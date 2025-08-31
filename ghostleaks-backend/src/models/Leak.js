const mongoose = require('mongoose');

const leakSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  domain: {
    type: String,
    trim: true
  },
  breachDate: {
    type: Date,
    default: null
  },
  addedDate: {
    type: Date,
    default: Date.now
  },
  pwnCount: {
    type: Number,
    default: 0
  },
  description: {
    type: String,
    trim: true
  },
  dataClasses: [{
    type: String,
    trim: true
  }],
  isVerified: {
    type: Boolean,
    default: false
  },
  isFabricated: {
    type: Boolean,
    default: false
  },
  isSensitive: {
    type: Boolean,
    default: false
  },
  isRetired: {
    type: Boolean,
    default: false
  },
  logoPath: {
    type: String,
    default: null
  },
  source: {
    type: String,
    enum: ['hibp', 'breach_directory', 'pastebin', 'github', 'manual'],
    required: true
  },
  sourceId: {
    type: String, // ID externe de la source
    default: null
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  affectedEmails: [{
    email: String,
    foundDate: { type: Date, default: Date.now },
    context: String // Contexte où l'email a été trouvé
  }]
}, {
  timestamps: true
});

// Méthode pour calculer la sévérité automatiquement
leakSchema.methods.calculateSeverity = function() {
  let score = 0;
  
  // Score basé sur le nombre de comptes affectés
  if (this.pwnCount > 100000000) score += 4; // 100M+
  else if (this.pwnCount > 10000000) score += 3; // 10M+
  else if (this.pwnCount > 1000000) score += 2; // 1M+
  else score += 1;
  
  // Score basé sur les types de données
  const sensitiveData = ['passwords', 'credit cards', 'social security numbers', 'financial data'];
  const hasSensitiveData = this.dataClasses.some(dc => 
    sensitiveData.some(sd => dc.toLowerCase().includes(sd))
  );
  
  if (hasSensitiveData) score += 3;
  if (this.isSensitive) score += 2;
  if (this.isVerified) score += 1;
  
  // Déterminer la sévérité
  if (score >= 8) this.severity = 'critical';
  else if (score >= 6) this.severity = 'high';
  else if (score >= 4) this.severity = 'medium';
  else this.severity = 'low';
  
  return this.severity;
};

// Méthode pour ajouter un email affecté
leakSchema.methods.addAffectedEmail = function(email, context = '') {
  const existingEmail = this.affectedEmails.find(ae => ae.email === email);
  
  if (!existingEmail) {
    this.affectedEmails.push({
      email,
      context,
      foundDate: new Date()
    });
    return this.save();
  }
  
  return Promise.resolve(this);
};

// Index pour optimiser les requêtes
leakSchema.index({ name: 1 });
leakSchema.index({ domain: 1 });
leakSchema.index({ source: 1 });
leakSchema.index({ severity: 1 });
leakSchema.index({ 'affectedEmails.email': 1 });
leakSchema.index({ breachDate: -1 });
leakSchema.index({ addedDate: -1 });

module.exports = mongoose.model('Leak', leakSchema);