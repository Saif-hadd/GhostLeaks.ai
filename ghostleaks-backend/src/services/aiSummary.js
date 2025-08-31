const logger = require('../utils/logger');

class AISummaryService {
  constructor() {
    // Service d'IA gratuit ou logique locale
  }

  generateSummary(breachDetails, emailScanned) {
    try {
      const totalBreaches = breachDetails.length;
      
      if (totalBreaches === 0) {
        return {
          summary: "Excellente nouvelle ! Aucune fuite de données détectée pour cette adresse email. Vos informations semblent sécurisées dans les bases de données publiques.",
          severity: 'low',
          riskScore: 0,
          recommendations: [
            "Continuez à utiliser des mots de passe forts et uniques",
            "Activez l'authentification 2FA quand c'est possible",
            "Effectuez des scans réguliers pour rester vigilant"
          ]
        };
      }

      // Analyser la sévérité des fuites
      const severityCounts = this.analyzeSeverity(breachDetails);
      const riskScore = this.calculateRiskScore(breachDetails);
      const overallSeverity = this.determineOverallSeverity(severityCounts, riskScore);
      
      // Générer le résumé basé sur l'analyse
      const summary = this.generateDetailedSummary(totalBreaches, severityCounts, emailScanned);
      const recommendations = this.generateRecommendations(overallSeverity, breachDetails);

      return {
        summary,
        severity: overallSeverity,
        riskScore,
        recommendations,
        analysis: {
          totalBreaches,
          severityCounts,
          mostRecentBreach: this.findMostRecentBreach(breachDetails),
          largestBreach: this.findLargestBreach(breachDetails),
          sensitiveDataExposed: this.checkSensitiveData(breachDetails)
        }
      };

    } catch (error) {
      logger.error('Error generating AI summary:', error);
      return {
        summary: "Erreur lors de l'analyse des données. Veuillez consulter les détails des fuites manuellement.",
        severity: 'medium',
        riskScore: 50,
        recommendations: ["Consultez les détails des fuites", "Changez vos mots de passe par précaution"]
      };
    }
  }

  analyzeSeverity(breachDetails) {
    const counts = { low: 0, medium: 0, high: 0, critical: 0 };
    
    breachDetails.forEach(breach => {
      const severity = this.assessBreachSeverity(breach);
      counts[severity]++;
    });
    
    return counts;
  }

  assessBreachSeverity(breach) {
    let score = 0;
    
    // Score basé sur le nombre de comptes affectés
    if (breach.pwnCount > 100000000) score += 4; // 100M+
    else if (breach.pwnCount > 10000000) score += 3; // 10M+
    else if (breach.pwnCount > 1000000) score += 2; // 1M+
    else score += 1;
    
    // Score basé sur les types de données
    const sensitiveKeywords = [
      'password', 'credit card', 'social security', 'financial',
      'bank', 'payment', 'ssn', 'passport', 'driver license'
    ];
    
    const dataClasses = (breach.dataClasses || []).join(' ').toLowerCase();
    const hasSensitiveData = sensitiveKeywords.some(keyword => 
      dataClasses.includes(keyword)
    );
    
    if (hasSensitiveData) score += 3;
    if (breach.isVerified) score += 1;
    if (breach.isSensitive) score += 2;
    
    // Récence de la fuite
    if (breach.breachDate) {
      const breachAge = Date.now() - new Date(breach.breachDate).getTime();
      const ageInYears = breachAge / (365 * 24 * 60 * 60 * 1000);
      
      if (ageInYears < 1) score += 2; // Très récent
      else if (ageInYears < 3) score += 1; // Récent
    }
    
    // Déterminer la sévérité
    if (score >= 8) return 'critical';
    else if (score >= 6) return 'high';
    else if (score >= 4) return 'medium';
    else return 'low';
  }

  calculateRiskScore(breachDetails) {
    let totalScore = 0;
    
    breachDetails.forEach(breach => {
      const severity = this.assessBreachSeverity(breach);
      switch (severity) {
        case 'critical': totalScore += 25; break;
        case 'high': totalScore += 15; break;
        case 'medium': totalScore += 8; break;
        case 'low': totalScore += 3; break;
      }
    });
    
    return Math.min(totalScore, 100); // Score max 100
  }

  determineOverallSeverity(severityCounts, riskScore) {
    if (severityCounts.critical > 0 || riskScore >= 80) return 'critical';
    if (severityCounts.high > 0 || riskScore >= 60) return 'high';
    if (severityCounts.medium > 0 || riskScore >= 30) return 'medium';
    return 'low';
  }

  generateDetailedSummary(totalBreaches, severityCounts, email) {
    const { critical, high, medium, low } = severityCounts;
    
    if (critical > 0) {
      return `🚨 ALERTE CRITIQUE: Votre email ${email} a été trouvé dans ${totalBreaches} fuite(s) de données, dont ${critical} classée(s) comme critiques. Ces fuites contiennent probablement des informations sensibles comme des mots de passe ou des données financières. Une action immédiate est requise pour sécuriser tous vos comptes.`;
    }
    
    if (high > 0) {
      return `🔴 RISQUE ÉLEVÉ: ${totalBreaches} fuite(s) détectée(s) pour ${email}, incluant ${high} fuite(s) à haut risque. Vos données personnelles ont été exposées et pourraient être utilisées par des cybercriminels. Changez vos mots de passe rapidement.`;
    }
    
    if (medium > 0) {
      return `🟡 RISQUE MODÉRÉ: ${totalBreaches} fuite(s) identifiée(s) pour ${email}. Bien que moins critiques, ces expositions nécessitent votre attention. Vérifiez la sécurité de vos comptes et changez vos mots de passe par précaution.`;
    }
    
    return `🟢 RISQUE FAIBLE: ${totalBreaches} fuite(s) mineure(s) détectée(s) pour ${email}. L'exposition semble limitée, mais restez vigilant et surveillez vos comptes régulièrement.`;
  }

  generateRecommendations(severity, breachDetails) {
    const baseRecommendations = [
      "Utilisez un gestionnaire de mots de passe",
      "Activez l'authentification à deux facteurs",
      "Surveillez régulièrement vos comptes"
    ];

    const severityRecommendations = {
      critical: [
        "🚨 URGENT: Changez TOUS vos mots de passe IMMÉDIATEMENT",
        "Contactez vos banques pour surveiller les activités suspectes",
        "Considérez un gel de crédit temporaire",
        "Vérifiez tous vos comptes financiers quotidiennement",
        "Signalez toute activité suspecte aux autorités"
      ],
      high: [
        "Changez vos mots de passe dans les 24 heures",
        "Vérifiez vos relevés bancaires des 3 derniers mois",
        "Activez les alertes de connexion sur tous vos comptes",
        "Considérez changer votre adresse email principale"
      ],
      medium: [
        "Changez vos mots de passe dans la semaine",
        "Vérifiez vos comptes principaux",
        "Activez les notifications de sécurité",
        "Soyez vigilant aux tentatives de phishing"
      ],
      low: [
        "Changez vos mots de passe quand c'est pratique",
        "Restez vigilant aux emails suspects",
        "Effectuez des scans réguliers"
      ]
    };

    return [
      ...severityRecommendations[severity],
      ...baseRecommendations
    ];
  }

  findMostRecentBreach(breachDetails) {
    return breachDetails.reduce((latest, current) => {
      const currentDate = new Date(current.date || 0);
      const latestDate = new Date(latest?.date || 0);
      return currentDate > latestDate ? current : latest;
    }, null);
  }

  findLargestBreach(breachDetails) {
    return breachDetails.reduce((largest, current) => {
      return (current.pwnCount || 0) > (largest?.pwnCount || 0) ? current : largest;
    }, null);
  }

  checkSensitiveData(breachDetails) {
    const sensitiveTypes = [];
    const sensitiveKeywords = [
      'password', 'credit card', 'social security', 'financial',
      'bank account', 'payment', 'ssn', 'passport'
    ];

    breachDetails.forEach(breach => {
      const dataClasses = (breach.dataClasses || []).join(' ').toLowerCase();
      sensitiveKeywords.forEach(keyword => {
        if (dataClasses.includes(keyword) && !sensitiveTypes.includes(keyword)) {
          sensitiveTypes.push(keyword);
        }
      });
    });

    return sensitiveTypes;
  }
}

module.exports = new AISummaryService();