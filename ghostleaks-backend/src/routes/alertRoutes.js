const express = require('express');
const { body } = require('express-validator');
const alertController = require('../controllers/alertController');
const auth = require('../utils/auth');

const router = express.Router();

// Validation pour les paramètres d'alerte
const validateAlertSettings = [
  body('email')
    .optional()
    .isBoolean()
    .withMessage('Le paramètre email doit être un booléen'),
  body('telegram')
    .optional()
    .isBoolean()
    .withMessage('Le paramètre telegram doit être un booléen'),
  body('telegramUsername')
    .optional()
    .matches(/^@?[a-zA-Z0-9_]{5,32}$/)
    .withMessage('Nom d\'utilisateur Telegram invalide (5-32 caractères, lettres, chiffres, underscore)')
];

// Validation pour le test d'alerte
const validateTestAlert = [
  body('type')
    .isIn(['email', 'telegram'])
    .withMessage('Type d\'alerte invalide (email ou telegram)')
];

// Routes
router.get('/settings',
  auth.requireAuth,
  alertController.getAlertSettings
);

router.put('/settings',
  auth.requireAuth,
  validateAlertSettings,
  alertController.updateAlertSettings
);

router.post('/test',
  auth.requireAuth,
  validateTestAlert,
  alertController.testAlert
);

router.get('/history',
  auth.requireAuth,
  alertController.getAlertHistory
);

module.exports = router;