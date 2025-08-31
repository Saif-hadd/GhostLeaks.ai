const express = require('express');
const { body } = require('express-validator');
const userController = require('../controllers/userController');
const auth = require('../utils/auth');
const rateLimit = require('express-rate-limit');

const router = express.Router();

// Rate limiting pour l'authentification
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 tentatives par 15 minutes
  message: {
    success: false,
    message: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.'
  }
});

// Validation pour l'inscription
const validateRegister = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email valide requis'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Le mot de passe doit contenir au moins 6 caractères')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Le mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre'),
  body('fullName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Le nom doit contenir entre 2 et 100 caractères')
];

// Validation pour la connexion
const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email valide requis'),
  body('password')
    .notEmpty()
    .withMessage('Mot de passe requis')
];

// Validation pour la mise à jour du profil
const validateUpdateProfile = [
  body('fullName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Le nom doit contenir entre 2 et 100 caractères'),
  body('alertSettings.telegramUsername')
    .optional()
    .matches(/^@?[a-zA-Z0-9_]{5,32}$/)
    .withMessage('Nom d\'utilisateur Telegram invalide')
];

// Routes publiques
router.post('/register', 
  authRateLimit,
  validateRegister,
  userController.register
);

router.post('/login',
  authRateLimit,
  validateLogin,
  userController.login
);

// Routes protégées
router.get('/profile',
  auth.requireAuth,
  userController.getProfile
);

router.put('/profile',
  auth.requireAuth,
  validateUpdateProfile,
  userController.updateProfile
);

router.post('/upgrade',
  auth.requireAuth,
  userController.upgradeToPro
);

module.exports = router;