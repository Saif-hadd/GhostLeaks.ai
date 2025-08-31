const User = require('../models/User');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const mailer = require('../config/mailer');
const telegram = require('../config/telegram');
const { validationResult } = require('express-validator');

class UserController {
  async register(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Données invalides',
          errors: errors.array()
        });
      }

      const { email, password, fullName } = req.body;

      // Vérifier si l'utilisateur existe déjà
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'Un compte avec cet email existe déjà'
        });
      }

      // Créer le nouvel utilisateur
      const user = new User({
        email,
        password,
        fullName
      });

      await user.save();

      // Générer le token JWT
      const token = this.generateToken(user._id);

      // Envoyer email de bienvenue
      try {
        await mailer.sendWelcomeEmail(email, fullName);
      } catch (emailError) {
        logger.error('Failed to send welcome email:', emailError);
      }

      res.status(201).json({
        success: true,
        message: 'Compte créé avec succès',
        user: {
          id: user._id,
          email: user.email,
          fullName: user.fullName,
          plan: user.plan,
          scansRemaining: user.scansRemaining
        },
        token
      });

      logger.info(`New user registered: ${email}`);

    } catch (error) {
      logger.error('Registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }

  async login(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Données invalides',
          errors: errors.array()
        });
      }

      const { email, password } = req.body;

      // Trouver l'utilisateur
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Email ou mot de passe incorrect'
        });
      }

      // Vérifier le mot de passe
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Email ou mot de passe incorrect'
        });
      }

      // Vérifier si le compte est actif
      if (!user.isActive) {
        return res.status(403).json({
          success: false,
          message: 'Compte désactivé'
        });
      }

      // Réinitialiser les scans quotidiens
      await user.resetDailyScans();

      // Générer le token
      const token = this.generateToken(user._id);

      res.json({
        success: true,
        message: 'Connexion réussie',
        user: {
          id: user._id,
          email: user.email,
          fullName: user.fullName,
          plan: user.plan,
          scansRemaining: user.scansRemaining,
          alertSettings: user.alertSettings
        },
        token
      });

      logger.info(`User logged in: ${email}`);

    } catch (error) {
      logger.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }

  async getProfile(req, res) {
    try {
      const userId = req.user.id;
      const user = await User.findById(userId).select('-password');
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Utilisateur non trouvé'
        });
      }

      // Réinitialiser les scans quotidiens
      await user.resetDailyScans();

      res.json({
        success: true,
        user: {
          id: user._id,
          email: user.email,
          fullName: user.fullName,
          plan: user.plan,
          scansRemaining: user.scansRemaining,
          alertSettings: user.alertSettings,
          subscription: user.subscription,
          createdAt: user.createdAt
        }
      });

    } catch (error) {
      logger.error('Error getting profile:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }

  async updateProfile(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Données invalides',
          errors: errors.array()
        });
      }

      const userId = req.user.id;
      const { fullName, alertSettings } = req.body;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Utilisateur non trouvé'
        });
      }

      // Mettre à jour les champs
      if (fullName) user.fullName = fullName;
      if (alertSettings) {
        user.alertSettings = { ...user.alertSettings, ...alertSettings };
        
        // Si Telegram est activé et username fourni, envoyer message de bienvenue
        if (alertSettings.telegram && alertSettings.telegramUsername && 
            !user.alertSettings.telegram) {
          try {
            await telegram.sendWelcomeMessage(alertSettings.telegramUsername, user.fullName);
          } catch (telegramError) {
            logger.error('Failed to send Telegram welcome:', telegramError);
          }
        }
      }

      await user.save();

      res.json({
        success: true,
        message: 'Profil mis à jour avec succès',
        user: {
          id: user._id,
          email: user.email,
          fullName: user.fullName,
          plan: user.plan,
          scansRemaining: user.scansRemaining,
          alertSettings: user.alertSettings
        }
      });

      logger.info(`Profile updated for user: ${user.email}`);

    } catch (error) {
      logger.error('Error updating profile:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }

  async upgradeToPro(req, res) {
    try {
      const userId = req.user.id;
      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Utilisateur non trouvé'
        });
      }

      if (user.plan === 'pro') {
        return res.status(400).json({
          success: false,
          message: 'Utilisateur déjà en plan Pro'
        });
      }

      // Simuler l'upgrade (en production, intégrer Stripe)
      user.plan = 'pro';
      user.scansRemaining = 999999;
      user.subscription = {
        status: 'active',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 jours
      };

      await user.save();

      res.json({
        success: true,
        message: 'Upgrade vers Pro réussi',
        user: {
          id: user._id,
          email: user.email,
          fullName: user.fullName,
          plan: user.plan,
          scansRemaining: user.scansRemaining,
          subscription: user.subscription
        }
      });

      logger.info(`User upgraded to Pro: ${user.email}`);

    } catch (error) {
      logger.error('Error upgrading user:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }

  generateToken(userId) {
    return jwt.sign(
      { id: userId },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
  }
}

module.exports = new UserController();