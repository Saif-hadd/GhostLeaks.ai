const Scan = require('../models/Scan');
const User = require('../models/User');
const pdfGenerator = require('../services/pdfGenerator');
const logger = require('../utils/logger');
const path = require('path');
const fs = require('fs');

class ReportController {
  async downloadReport(req, res) {
    try {
      const { scanId } = req.params;
      const userId = req.user.id;

      // Vérifier que le scan appartient à l'utilisateur
      const scan = await Scan.findOne({ _id: scanId, userId });
      if (!scan) {
        return res.status(404).json({
          success: false,
          message: 'Rapport non trouvé'
        });
      }

      if (scan.status !== 'completed') {
        return res.status(400).json({
          success: false,
          message: 'Le scan n\'est pas encore terminé'
        });
      }

      // Vérifier si le PDF existe déjà
      let pdfPath;
      if (scan.pdfReportUrl) {
        pdfPath = path.join(__dirname, '../../reports', path.basename(scan.pdfReportUrl));
        
        if (!fs.existsSync(pdfPath)) {
          // Régénérer le PDF s'il n'existe plus
          const user = await User.findById(userId);
          pdfPath = await pdfGenerator.generateSecurityReport(scan, user);
          scan.pdfReportUrl = `/reports/${path.basename(pdfPath)}`;
          await scan.save();
        }
      } else {
        // Générer le PDF pour la première fois
        const user = await User.findById(userId);
        pdfPath = await pdfGenerator.generateSecurityReport(scan, user);
        scan.pdfReportUrl = `/reports/${path.basename(pdfPath)}`;
        await scan.save();
      }

      // Envoyer le fichier PDF
      const filename = `security-report-${scan.emailScanned}-${scan.createdAt.toISOString().split('T')[0]}.pdf`;
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      
      const fileStream = fs.createReadStream(pdfPath);
      fileStream.pipe(res);

      logger.info(`PDF report downloaded for scan: ${scanId}`);

    } catch (error) {
      logger.error('Error downloading report:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors du téléchargement du rapport'
      });
    }
  }

  async getReportPreview(req, res) {
    try {
      const { scanId } = req.params;
      const userId = req.user.id;

      const scan = await Scan.findOne({ _id: scanId, userId });
      if (!scan) {
        return res.status(404).json({
          success: false,
          message: 'Rapport non trouvé'
        });
      }

      // Générer un aperçu JSON du rapport
      const preview = {
        scanInfo: {
          email: scan.emailScanned,
          date: scan.createdAt,
          status: scan.status,
          threatsFound: scan.threatsFound,
          severity: scan.severity
        },
        summary: scan.aiSummary,
        breaches: scan.breachDetails.map(breach => ({
          name: breach.name,
          date: breach.date,
          severity: breach.severity,
          dataClasses: breach.dataClasses,
          pwnCount: breach.pwnCount
        })),
        recommendations: this.generateRecommendations(scan.severity),
        riskScore: this.calculateRiskScore(scan.breachDetails)
      };

      res.json({
        success: true,
        preview
      });

    } catch (error) {
      logger.error('Error getting report preview:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }

  async generateCustomReport(req, res) {
    try {
      const userId = req.user.id;
      const { emailList, reportType = 'summary' } = req.body;

      if (!emailList || !Array.isArray(emailList) || emailList.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Liste d\'emails requise'
        });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Utilisateur non trouvé'
        });
      }

      // Vérifier les limites du plan
      if (user.plan === 'free' && emailList.length > 5) {
        return res.status(403).json({
          success: false,
          message: 'Plan gratuit limité à 5 emails par rapport. Passez au plan Pro.'
        });
      }

      // Récupérer les scans pour ces emails
      const scans = await Scan.find({
        userId,
        emailScanned: { $in: emailList },
        status: 'completed'
      }).sort({ createdAt: -1 });

      if (scans.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Aucun scan trouvé pour ces emails'
        });
      }

      // Générer le rapport personnalisé
      const customReport = {
        reportType,
        generatedAt: new Date(),
        emailsScanned: emailList.length,
        scansFound: scans.length,
        totalThreats: scans.reduce((sum, scan) => sum + scan.threatsFound, 0),
        overallSeverity: this.calculateOverallSeverity(scans),
        scans: scans.map(scan => ({
          email: scan.emailScanned,
          date: scan.createdAt,
          threats: scan.threatsFound,
          severity: scan.severity,
          summary: scan.aiSummary
        }))
      };

      res.json({
        success: true,
        report: customReport
      });

      logger.info(`Custom report generated for user: ${user.email}`);

    } catch (error) {
      logger.error('Error generating custom report:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }

  generateRecommendations(severity) {
    const recommendations = {
      critical: [
        "🚨 URGENT: Changez TOUS vos mots de passe IMMÉDIATEMENT",
        "Contactez vos banques pour surveiller les activités suspectes",
        "Considérez un gel de crédit temporaire",
        "Activez l'authentification 2FA partout où c'est possible"
      ],
      high: [
        "Changez vos mots de passe dans les 24 heures",
        "Vérifiez vos relevés bancaires des 3 derniers mois",
        "Activez les alertes de connexion sur tous vos comptes"
      ],
      medium: [
        "Changez vos mots de passe dans la semaine",
        "Vérifiez vos comptes principaux",
        "Soyez vigilant aux tentatives de phishing"
      ],
      low: [
        "Changez vos mots de passe quand c'est pratique",
        "Restez vigilant aux emails suspects",
        "Effectuez des scans réguliers"
      ]
    };

    return recommendations[severity] || recommendations.low;
  }

  calculateRiskScore(breachDetails) {
    let score = 0;
    
    breachDetails.forEach(breach => {
      switch (breach.severity) {
        case 'critical': score += 25; break;
        case 'high': score += 15; break;
        case 'medium': score += 8; break;
        case 'low': score += 3; break;
      }
    });
    
    return Math.min(score, 100);
  }

  calculateOverallSeverity(scans) {
    const severities = scans.map(scan => scan.severity);
    
    if (severities.includes('critical')) return 'critical';
    if (severities.includes('high')) return 'high';
    if (severities.includes('medium')) return 'medium';
    return 'low';
  }
}

module.exports = new ReportController();