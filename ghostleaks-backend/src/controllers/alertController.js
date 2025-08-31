const User = require('../models/User');
const Scan = require('../models/Scan');
const leakScanner = require('../services/leakScanner');
const mailer = require('../config/mailer');
const telegram = require('../config/telegram');
const logger = require('../utils/logger');

class AlertController {
  async updateAlertSettings(req, res) {
    try {
      const userId = req.user.id;
      const { email, telegram: telegramEnabled, telegramUsername } = req.body;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Utilisateur non trouvé'
        });
      }

      // Mettre à jour les paramètres d'alerte
      user.alertSettings = {
        email: email !== undefined ? email : user.alertSettings.email,
        telegram: telegramEnabled !== undefined ? telegramEnabled : user.alertSettings.telegram,
        telegramUsername: telegramUsername || user.alertSettings.telegramUsername
      };

      await user.save();

      // Si Telegram vient d'être activé, envoyer message de bienvenue
      if (telegramEnabled && telegramUsername && !user.alertSettings.telegram) {
        try {
          await telegram.sendWelcomeMessage(telegramUsername, user.fullName);
        } catch (telegramError) {
          logger.error('Failed to send Telegram welcome:', telegramError);
        }
      }

      res.json({
        success: true,
        message: 'Paramètres d\'alerte mis à jour',
        alertSettings: user.alertSettings
      });

      logger.info(`Alert settings updated for user: ${user.email}`);

    } catch (error) {
      logger.error('Error updating alert settings:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }

  async getAlertSettings(req, res) {
    try {
      const userId = req.user.id;
      const user = await User.findById(userId).select('alertSettings');

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Utilisateur non trouvé'
        });
      }

      res.json({
        success: true,
        alertSettings: user.alertSettings
      });

    } catch (error) {
      logger.error('Error getting alert settings:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }

  async testAlert(req, res) {
    try {
      const userId = req.user.id;
      const { type } = req.body; // 'email' ou 'telegram'

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Utilisateur non trouvé'
        });
      }

      if (type === 'email' && user.alertSettings.email) {
        // Test d'alerte email
        const testBreaches = [{
          name: 'Test Breach',
          date: new Date().toISOString(),
          dataClasses: ['Email addresses', 'Passwords']
        }];

        await mailer.sendBreachAlert(user.email, testBreaches);
        
        res.json({
          success: true,
          message: 'Email de test envoyé avec succès'
        });

      } else if (type === 'telegram' && user.alertSettings.telegram && user.alertSettings.telegramUsername) {
        // Test d'alerte Telegram
        const testBreaches = [{
          name: 'Test Breach',
          date: new Date().toISOString(),
          dataClasses: ['Email addresses', 'Passwords'],
          pwnCount: 1000000
        }];

        await telegram.sendBreachAlert(user.alertSettings.telegramUsername, user.email, testBreaches);
        
        res.json({
          success: true,
          message: 'Message Telegram de test envoyé avec succès'
        });

      } else {
        res.status(400).json({
          success: false,
          message: 'Type d\'alerte non configuré ou invalide'
        });
      }

    } catch (error) {
      logger.error('Error sending test alert:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'envoi de l\'alerte de test'
      });
    }
  }

  // Méthode pour les cron jobs - scanner les emails des utilisateurs
  async scanUserEmails() {
    try {
      logger.info('Starting scheduled email scans for all users');

      // Récupérer tous les utilisateurs actifs avec alertes activées
      const users = await User.find({
        isActive: true,
        $or: [
          { 'alertSettings.email': true },
          { 'alertSettings.telegram': true }
        ]
      });

      logger.info(`Found ${users.length} users for scheduled scanning`);

      for (const user of users) {
        try {
          // Récupérer les emails uniques scannés par cet utilisateur
          const uniqueEmails = await Scan.distinct('emailScanned', { userId: user._id });
          
          if (uniqueEmails.length === 0) continue;

          logger.info(`Scanning ${uniqueEmails.length} emails for user: ${user.email}`);

          // Scanner chaque email
          for (const email of uniqueEmails) {
            try {
              // Vérifier s'il y a eu un scan récent (moins de 24h)
              const recentScan = await Scan.findOne({
                userId: user._id,
                emailScanned: email,
                createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
              });

              if (recentScan) {
                logger.info(`Skipping recent scan for ${email}`);
                continue;
              }

              // Effectuer le scan
              const breachResults = await leakScanner.scanEmail(email);
              
              // Vérifier s'il y a de nouvelles fuites
              const lastScan = await Scan.findOne({
                userId: user._id,
                emailScanned: email,
                status: 'completed'
              }).sort({ createdAt: -1 });

              const newBreaches = this.findNewBreaches(breachResults, lastScan?.breachDetails || []);
              
              if (newBreaches.length > 0) {
                logger.info(`Found ${newBreaches.length} new breaches for ${email}`);
                
                // Créer un nouveau scan pour les nouvelles fuites
                const newScan = new Scan({
                  userId: user._id,
                  emailScanned: email,
                  status: 'completed',
                  threatsFound: newBreaches.length,
                  breachDetails: newBreaches
                });

                newScan.generateAISummary();
                await newScan.save();

                // Envoyer les alertes
                await this.sendNewBreachAlerts(user, email, newBreaches);
              }

              // Délai entre les scans pour éviter les rate limits
              await new Promise(resolve => setTimeout(resolve, 5000));

            } catch (emailError) {
              logger.error(`Error scanning email ${email} for user ${user.email}:`, emailError);
            }
          }

        } catch (userError) {
          logger.error(`Error processing user ${user.email}:`, userError);
        }
      }

      logger.info('Scheduled email scans completed');

    } catch (error) {
      logger.error('Error in scheduled email scanning:', error);
    }
  }

  findNewBreaches(currentBreaches, previousBreaches) {
    const previousNames = new Set(previousBreaches.map(b => b.name));
    return currentBreaches.filter(breach => !previousNames.has(breach.name));
  }

  async sendNewBreachAlerts(user, email, newBreaches) {
    try {
      // Alerte email
      if (user.alertSettings.email) {
        await mailer.sendBreachAlert(email, newBreaches);
        logger.info(`Email alert sent to ${user.email}`);
      }

      // Alerte Telegram
      if (user.alertSettings.telegram && user.alertSettings.telegramUsername) {
        await telegram.sendBreachAlert(user.alertSettings.telegramUsername, email, newBreaches);
        logger.info(`Telegram alert sent to @${user.alertSettings.telegramUsername}`);
      }

    } catch (error) {
      logger.error('Error sending breach alerts:', error);
    }
  }

  async getAlertHistory(req, res) {
    try {
      const userId = req.user.id;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const skip = (page - 1) * limit;

      // Récupérer les scans qui ont déclenché des alertes
      const alertScans = await Scan.find({
        userId,
        threatsFound: { $gt: 0 },
        status: 'completed'
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('emailScanned threatsFound severity aiSummary createdAt');

      const total = await Scan.countDocuments({
        userId,
        threatsFound: { $gt: 0 },
        status: 'completed'
      });

      res.json({
        success: true,
        alerts: alertScans.map(scan => ({
          id: scan._id,
          email: scan.emailScanned,
          threats: scan.threatsFound,
          severity: scan.severity,
          summary: scan.aiSummary,
          date: scan.createdAt
        })),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      });

    } catch (error) {
      logger.error('Error getting alert history:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }
}

module.exports = new AlertController();