const express = require('express');
const { body } = require('express-validator');
const reportController = require('../controllers/reportController');
const auth = require('../utils/auth');
const rateLimit = require('express-rate-limit');

const router = express.Router();

// Rate limiting pour les téléchargements
const downloadRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // 10 téléchargements par 5 minutes
  message: {
    success: false,
    message: 'Trop de téléchargements. Réessayez dans 5 minutes.'
  }
});

// Validation pour le rapport personnalisé
const validateCustomReport = [
  body('emailList')
    .isArray({ min: 1, max: 50 })
    .withMessage('Liste d\'emails requise (1-50 emails)'),
  body('emailList.*')
    .isEmail()
    .withMessage('Tous les emails doivent être valides'),
  body('reportType')
    .optional()
    .isIn(['summary', 'detailed', 'executive'])
    .withMessage('Type de rapport invalide')
];

// Routes
router.get('/download/:scanId',
  downloadRateLimit,
  auth.requireAuth,
  reportController.downloadReport
);

router.get('/preview/:scanId',
  auth.requireAuth,
  reportController.getReportPreview
);

router.post('/custom',
  auth.requireAuth,
  validateCustomReport,
  reportController.generateCustomReport
);

module.exports = router;