const Scan = require('../models/Scan');
const User = require('../models/User');
const leakScanner = require('../services/leakScanner');
const aiSummary = require('../services/aiSummary');
const pdfGenerator = require('../services/pdfGenerator');
const mailer = require('../config/mailer');
const logger = require('../utils/logger');
const { validationResult } = require('express-validator');

class ScanController {
  async scanEmail(req, res) {
    try {
      // Vérifier les erreurs de validation
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Données invalides',
          errors: errors.array()
        });
      }

      const { email, fullName } = req.body;
      const userId = req.user.id;

      // Vérifier l'utilisateur et ses limites
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Utilisateur non trouvé'
        });
      }

      // Réinitialiser les scans quotidiens si nécessaire
      await user.resetDailyScans();

      // Vérifier si l'utilisateur peut scanner
      if (!user.canScan()) {
        return res.status(403).json({
          success: false,
          message: 'Limite de scans atteinte. Passez au plan Pro pour des scans illimités.',
          scansRemaining: user.scansRemaining
        });
      }

      // Créer un nouveau scan
      const scan = new Scan({
        userId,
        emailScanned: email,
        fullName,
        status: 'processing',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      await scan.save();

      // Répondre immédiatement avec l'ID du scan
      res.status(202).json({
        success: true,
        message: 'Scan démarré',
        scanId: scan._id,
        status: 'processing'
      });

      // Décrémenter les scans de l'utilisateur
      await user.decrementScans();

      // Traitement asynchrone du scan
      this.processScanAsync(scan._id, email, user);

    } catch (error) {
      logger.error('Error starting scan:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }

  async processScanAsync(scanId, email, user) {
    const startTime = Date.now();
    
    try {
      logger.info(`Processing scan ${scanId} for email: ${email}`);
      
      // Effectuer le scan
      const breachResults = await leakScanner.scanEmail(email);
      
      // Mettre à jour le scan avec les résultats
      const scan = await Scan.findById(scanId);
      if (!scan) {
        logger.error(`Scan ${scanId} not found`);
        return;
      }

      // Mapper les résultats vers le format de la base
      scan.breachDetails = breachResults.map(breach => ({
        source: breach.source,
        name: breach.name,
        date: breach.breachDate || breach.date,
        description: breach.description,
        dataClasses: breach.dataClasses || [],
        pwnCount: breach.pwnCount,
        isVerified: breach.isVerified,
        severity: breach.severity || 'medium'
      }));

      scan.threatsFound = breachResults.length;
      scan.processingTime = Date.now() - startTime;

      // Générer le résumé IA
      const aiAnalysis = aiSummary.generateSummary(scan.breachDetails, email);
      scan.aiSummary = aiAnalysis.summary;
      scan.severity = aiAnalysis.severity;

      // Mettre à jour les méthodes de scan utilisées
      scan.scanMethods = {
        hibp: { checked: true, found: breachResults.some(b => b.source === 'hibp') },
        breachDirectory: { checked: true, found: breachResults.some(b => b.source === 'breach_directory') },
        pastebin: { checked: true, found: breachResults.some(b => b.source === 'pastebin') },
        github: { checked: true, found: breachResults.some(b => b.source === 'github') }
      };

      scan.status = 'completed';
      await scan.save();

      // Générer le rapport PDF
      try {
        const pdfPath = await pdfGenerator.generateSecurityReport(scan, user);
        scan.pdfReportUrl = `/reports/${path.basename(pdfPath)}`;
        await scan.save();
      } catch (pdfError) {
        logger.error('PDF generation failed:', pdfError);
      }

      // Envoyer alerte email si des fuites sont trouvées et alertes activées
      if (breachResults.length > 0 && user.alertSettings.email) {
        try {
          await mailer.sendBreachAlert(email, breachResults);
        } catch (emailError) {
          logger.error('Failed to send email alert:', emailError);
        }
      }

      logger.info(`Scan ${scanId} completed successfully. Found ${breachResults.length} breaches.`);

    } catch (error) {
      logger.error(`Scan ${scanId} failed:`, error);
      
      // Marquer le scan comme échoué
      try {
        await Scan.findByIdAndUpdate(scanId, {
          status: 'failed',
          aiSummary: 'Erreur lors du scan. Veuillez réessayer plus tard.',
          processingTime: Date.now() - startTime
        });
      } catch (updateError) {
        logger.error('Failed to update failed scan:', updateError);
      }
    }
  }

  async getScanStatus(req, res) {
    try {
      const { scanId } = req.params;
      const userId = req.user.id;

      const scan = await Scan.findOne({ _id: scanId, userId });
      if (!scan) {
        return res.status(404).json({
          success: false,
          message: 'Scan non trouvé'
        });
      }

      res.json({
        success: true,
        scan: {
          id: scan._id,
          status: scan.status,
          emailScanned: scan.emailScanned,
          threatsFound: scan.threatsFound,
          severity: scan.severity,
          aiSummary: scan.aiSummary,
          createdAt: scan.createdAt,
          processingTime: scan.processingTime
        }
      });

    } catch (error) {
      logger.error('Error getting scan status:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }

  async getScanHistory(req, res) {
    try {
      const userId = req.user.id;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      const scans = await Scan.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('-breachDetails'); // Exclure les détails pour la liste

      const total = await Scan.countDocuments({ userId });

      res.json({
        success: true,
        scans: scans.map(scan => ({
          id: scan._id,
          emailScanned: scan.emailScanned,
          status: scan.status,
          threatsFound: scan.threatsFound,
          severity: scan.severity,
          aiSummary: scan.aiSummary,
          createdAt: scan.createdAt,
          pdfReportUrl: scan.pdfReportUrl
        })),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      });

    } catch (error) {
      logger.error('Error getting scan history:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }

  async getScanDetails(req, res) {
    try {
      const { scanId } = req.params;
      const userId = req.user.id;

      const scan = await Scan.findOne({ _id: scanId, userId });
      if (!scan) {
        return res.status(404).json({
          success: false,
          message: 'Scan non trouvé'
        });
      }

      res.json({
        success: true,
        scan: {
          id: scan._id,
          emailScanned: scan.emailScanned,
          fullName: scan.fullName,
          status: scan.status,
          threatsFound: scan.threatsFound,
          severity: scan.severity,
          aiSummary: scan.aiSummary,
          breachDetails: scan.breachDetails,
          scanMethods: scan.scanMethods,
          pdfReportUrl: scan.pdfReportUrl,
          processingTime: scan.processingTime,
          createdAt: scan.createdAt
        }
      });

    } catch (error) {
      logger.error('Error getting scan details:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }

  async deleteScan(req, res) {
    try {
      const { scanId } = req.params;
      const userId = req.user.id;

      const scan = await Scan.findOneAndDelete({ _id: scanId, userId });
      if (!scan) {
        return res.status(404).json({
          success: false,
          message: 'Scan non trouvé'
        });
      }

      // Supprimer le fichier PDF s'il existe
      if (scan.pdfReportUrl) {
        const fs = require('fs');
        const path = require('path');
        const pdfPath = path.join(__dirname, '../../reports', path.basename(scan.pdfReportUrl));
        
        if (fs.existsSync(pdfPath)) {
          fs.unlinkSync(pdfPath);
        }
      }

      res.json({
        success: true,
        message: 'Scan supprimé avec succès'
      });

    } catch (error) {
      logger.error('Error deleting scan:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }
}

module.exports = new ScanController();