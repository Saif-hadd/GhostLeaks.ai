const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  plan: {
    type: String,
    enum: ['free', 'pro'],
    default: 'free'
  },
  scansRemaining: {
    type: Number,
    default: 5
  },
  lastScanReset: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  },
  emailVerified: {
    type: Boolean,
    default: true // Simplifié pour la démo
  },
  alertSettings: {
    email: {
      type: Boolean,
      default: true
    },
    telegram: {
      type: Boolean,
      default: false
    },
    telegramUsername: {
      type: String,
      default: null
    }
  },
  subscription: {
    stripeCustomerId: String,
    stripeSubscriptionId: String,
    currentPeriodStart: Date,
    currentPeriodEnd: Date,
    status: {
      type: String,
      enum: ['active', 'cancelled', 'expired'],
      default: 'active'
    }
  }
}, {
  timestamps: true
});

// Hash password avant sauvegarde
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Méthode pour comparer les mots de passe
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Méthode pour réinitialiser les scans quotidiens
userSchema.methods.resetDailyScans = function() {
  const now = new Date();
  const lastReset = new Date(this.lastScanReset);
  
  // Si plus de 24h depuis le dernier reset
  if (now - lastReset > 24 * 60 * 60 * 1000) {
    this.scansRemaining = this.plan === 'pro' ? 999999 : 5;
    this.lastScanReset = now;
    return this.save();
  }
  
  return Promise.resolve(this);
};

// Méthode pour vérifier si l'utilisateur peut scanner
userSchema.methods.canScan = function() {
  return this.plan === 'pro' || this.scansRemaining > 0;
};

// Méthode pour décrémenter les scans
userSchema.methods.decrementScans = function() {
  if (this.plan === 'free' && this.scansRemaining > 0) {
    this.scansRemaining -= 1;
    return this.save();
  }
  return Promise.resolve(this);
};

// Index pour optimiser les requêtes
userSchema.index({ email: 1 });
userSchema.index({ plan: 1 });
userSchema.index({ lastScanReset: 1 });

module.exports = mongoose.model('User', userSchema);