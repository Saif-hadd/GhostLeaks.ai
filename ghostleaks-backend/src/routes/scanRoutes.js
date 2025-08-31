const express = require('express');
const { body } = require('express-validator');
const scanController = require('../controllers/scanController');
const auth = require('../utils/auth');
const rateLimit = require('express-rate-limit');

const router = express.Router();

// Rate limiting pour les scans
const scanRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 scans par 15 minutes
  message: {
    success: false,
    message: 'Trop de tentatives de scan. Réessayez dans 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Validation pour le scan d'email
const validateScanEmail = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email valide requis'),
  body('fullName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Le nom doit contenir entre 2 et 100 caractères')
];

// Routes
router.post('/email', 
  scanRateLimit,
  auth.requireAuth,
  validateScanEmail,
  scanController.scanEmail
);

router.get('/status/:scanId',
  auth.requireAuth,
  scanController.getScanStatus
);

router.get('/history',
  auth.requireAuth,
  scanController.getScanHistory
);

router.get('/details/:scanId',
  auth.requireAuth,
  scanController.getScanDetails
);

router.delete('/:scanId',
  auth.requireAuth,
  scanController.deleteScan
);

module.exports = router;