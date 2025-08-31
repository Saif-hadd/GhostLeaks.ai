const Joi = require('joi');

class ValidatorUtils {
  // Schéma pour l'inscription
  registerSchema = Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Email invalide',
      'any.required': 'Email requis'
    }),
    password: Joi.string().min(6).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).required().messages({
      'string.min': 'Le mot de passe doit contenir au moins 6 caractères',
      'string.pattern.base': 'Le mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre',
      'any.required': 'Mot de passe requis'
    }),
    fullName: Joi.string().min(2).max(100).required().messages({
      'string.min': 'Le nom doit contenir au moins 2 caractères',
      'string.max': 'Le nom ne peut pas dépasser 100 caractères',
      'any.required': 'Nom complet requis'
    })
  });

  // Schéma pour la connexion
  loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  });

  // Schéma pour le scan d'email
  scanEmailSchema = Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Email invalide',
      'any.required': 'Email requis'
    }),
    fullName: Joi.string().min(2).max(100).optional().messages({
      'string.min': 'Le nom doit contenir au moins 2 caractères',
      'string.max': 'Le nom ne peut pas dépasser 100 caractères'
    })
  });

  // Schéma pour les paramètres d'alerte
  alertSettingsSchema = Joi.object({
    email: Joi.boolean().optional(),
    telegram: Joi.boolean().optional(),
    telegramUsername: Joi.string().pattern(/^@?[a-zA-Z0-9_]{5,32}$/).optional().messages({
      'string.pattern.base': 'Nom d\'utilisateur Telegram invalide (5-32 caractères)'
    })
  });

  // Schéma pour la mise à jour du profil
  updateProfileSchema = Joi.object({
    fullName: Joi.string().min(2).max(100).optional(),
    alertSettings: this.alertSettingsSchema.optional()
  });

  // Middleware de validation
  validate(schema) {
    return (req, res, next) => {
      const { error } = schema.validate(req.body);
      
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Données invalides',
          errors: error.details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message
          }))
        });
      }
      
      next();
    };
  }

  // Validation d'email spécifique
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Validation de mot de passe fort
  isStrongPassword(password) {
    const minLength = 6;
    const hasLowerCase = /[a-z]/.test(password);
    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumbers = /\d/.test(password);
    
    return password.length >= minLength && hasLowerCase && hasUpperCase && hasNumbers;
  }

  // Sanitizer pour les entrées utilisateur
  sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    
    return input
      .trim()
      .replace(/[<>]/g, '') // Supprimer les balises HTML basiques
      .substring(0, 1000); // Limiter la longueur
  }

  // Validation d'ID MongoDB
  isValidObjectId(id) {
    return /^[0-9a-fA-F]{24}$/.test(id);
  }

  // Validation de nom d'utilisateur Telegram
  isValidTelegramUsername(username) {
    if (!username) return false;
    const cleanUsername = username.replace('@', '');
    return /^[a-zA-Z0-9_]{5,32}$/.test(cleanUsername);
  }
}

module.exports = new ValidatorUtils();