const mongoose = require('mongoose');

const scanSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  emailScanned: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  fullName: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['processing', 'completed', 'failed'],
    default: 'processing'
  },
  threatsFound: {
    type: Number,
    default: 0
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'low'
  },
  aiSummary: {
    type: String,
    default: null
  },
  breachDetails: [{
    source: String,
    name: String,
    date: Date,
    description: String,
    dataClasses: [String],
    pwnCount: Number,
    isVerified: Boolean,
    severity: String
  }],
  scanMethods: {
    hibp: {
      checked: { type: Boolean, default: false },
      found: { type: Boolean, default: false },
      results: [mongoose.Schema.Types.Mixed]
    },
    breachDirectory: {
      checked: { type: Boolean, default: false },
      found: { type: Boolean, default: false },
      results: [mongoose.Schema.Types.Mixed]
    },
    pastebin: {
      checked: { type: Boolean, default: false },
      found: { type: Boolean, default: false },
      results: [mongoose.Schema.Types.Mixed]
    },
    github: {
      checked: { type: Boolean, default: false },
      found: { type: Boolean, default: false },
      results: [mongoose.Schema.Types.Mixed]
    }
  },
  pdfReportUrl: {
    type: String,
    default: null
  },
  processingTime: {
    type: Number, // en millisecondes
    default: null
  },
  ipAddress: {
    type: String,
    default: null
  },
  userAgent: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Méthode pour calculer le score de risque
scanSchema.methods.calculateRiskScore = function() {
  let score = 0;
  
  this.breachDetails.forEach(breach => {
    switch (breach.severity) {
      case 'critical': score += 10; break;
      case 'high': score += 7; break;
      case 'medium': score += 4; break;
      case 'low': score += 1; break;
    }
  });
  
  return Math.min(score, 100); // Score max 100
};

// Méthode pour générer un résumé IA
scanSchema.methods.generateAISummary = function() {
  const totalBreaches = this.breachDetails.length;
  
  if (totalBreaches === 0) {
    this.aiSummary = "Excellente nouvelle ! Aucune fuite de données détectée pour cette adresse email. Vos informations semblent sécurisées.";
    this.severity = 'low';
    return;
  }

  const criticalBreaches = this.breachDetails.filter(b => b.severity === 'critical').length;
  const highBreaches = this.breachDetails.filter(b => b.severity === 'high').length;
  
  if (criticalBreaches > 0) {
    this.severity = 'critical';
    this.aiSummary = `⚠️ RISQUE CRITIQUE: ${totalBreaches} fuite(s) détectée(s) dont ${criticalBreaches} critique(s). Changez IMMÉDIATEMENT tous vos mots de passe et activez l'authentification 2FA.`;
  } else if (highBreaches > 0) {
    this.severity = 'high';
    this.aiSummary = `🔴 RISQUE ÉLEVÉ: ${totalBreaches} fuite(s) détectée(s) dont ${highBreaches} à risque élevé. Action rapide recommandée pour sécuriser vos comptes.`;
  } else if (totalBreaches > 3) {
    this.severity = 'medium';
    this.aiSummary = `🟡 RISQUE MODÉRÉ: ${totalBreaches} fuites détectées. Bien que moins critiques, surveillez vos comptes et changez vos mots de passe par précaution.`;
  } else {
    this.severity = 'low';
    this.aiSummary = `🟢 RISQUE FAIBLE: ${totalBreaches} fuite(s) mineure(s) détectée(s). Surveillez vos comptes et considérez changer vos mots de passe.`;
  }
};

// Index pour optimiser les requêtes
scanSchema.index({ userId: 1, createdAt: -1 });
scanSchema.index({ emailScanned: 1 });
scanSchema.index({ status: 1 });
scanSchema.index({ severity: 1 });

module.exports = mongoose.model('Scan', scanSchema);