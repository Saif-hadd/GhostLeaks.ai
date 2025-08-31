const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

class PDFGeneratorService {
  constructor() {
    this.reportsDir = path.join(__dirname, '../../reports');
    this.ensureReportsDirectory();
  }

  ensureReportsDirectory() {
    if (!fs.existsSync(this.reportsDir)) {
      fs.mkdirSync(this.reportsDir, { recursive: true });
    }
  }

  async generateSecurityReport(scan, user) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const filename = `security-report-${scan._id}.pdf`;
        const filepath = path.join(this.reportsDir, filename);
        
        // Stream vers fichier
        doc.pipe(fs.createWriteStream(filepath));

        // En-tête du document
        this.addHeader(doc);
        
        // Informations du scan
        this.addScanInfo(doc, scan, user);
        
        // Résumé exécutif
        this.addExecutiveSummary(doc, scan);
        
        // Détails des fuites
        this.addBreachDetails(doc, scan);
        
        // Graphique des menaces
        this.addThreatChart(doc, scan);
        
        // Recommandations
        this.addRecommendations(doc, scan);
        
        // Pied de page
        this.addFooter(doc);

        doc.end();

        doc.on('end', () => {
          logger.info(`PDF report generated: ${filename}`);
          resolve(filepath);
        });

        doc.on('error', (error) => {
          logger.error('PDF generation error:', error);
          reject(error);
        });

      } catch (error) {
        logger.error('PDF generation failed:', error);
        reject(error);
      }
    });
  }

  addHeader(doc) {
    // Logo et titre
    doc.fontSize(24)
       .fillColor('#10b981')
       .text('🛡️ GhostLeaks.ai', 50, 50);
    
    doc.fontSize(16)
       .fillColor('#6b7280')
       .text('Rapport de Sécurité Cybernétique', 50, 80);
    
    // Ligne de séparation
    doc.moveTo(50, 110)
       .lineTo(550, 110)
       .strokeColor('#e5e7eb')
       .stroke();
  }

  addScanInfo(doc, scan, user) {
    doc.fontSize(14)
       .fillColor('#374151')
       .text('Informations du Scan', 50, 130);

    const scanInfo = [
      `Email scanné: ${scan.emailScanned}`,
      `Nom: ${scan.fullName || 'Non spécifié'}`,
      `Date du scan: ${scan.createdAt.toLocaleDateString('fr-FR')}`,
      `Statut: ${scan.status}`,
      `Menaces détectées: ${scan.threatsFound}`,
      `Niveau de risque: ${scan.severity.toUpperCase()}`
    ];

    let yPosition = 150;
    scanInfo.forEach(info => {
      doc.fontSize(11)
         .fillColor('#6b7280')
         .text(info, 70, yPosition);
      yPosition += 20;
    });
  }

  addExecutiveSummary(doc, scan) {
    doc.fontSize(14)
       .fillColor('#374151')
       .text('Résumé Exécutif', 50, 280);

    // Boîte colorée selon la sévérité
    const severityColors = {
      low: '#10b981',
      medium: '#f59e0b',
      high: '#ef4444',
      critical: '#dc2626'
    };

    doc.rect(50, 300, 500, 80)
       .fillColor(severityColors[scan.severity] + '20')
       .fill();

    doc.fontSize(12)
       .fillColor('#374151')
       .text(scan.aiSummary || 'Aucun résumé disponible', 60, 320, {
         width: 480,
         align: 'left'
       });
  }

  addBreachDetails(doc, scan) {
    if (scan.breachDetails.length === 0) {
      doc.fontSize(14)
         .fillColor('#10b981')
         .text('✅ Aucune fuite détectée', 50, 400);
      return;
    }

    doc.fontSize(14)
       .fillColor('#374151')
       .text('Détails des Fuites Détectées', 50, 400);

    let yPosition = 430;
    
    scan.breachDetails.forEach((breach, index) => {
      // Vérifier si on a assez de place, sinon nouvelle page
      if (yPosition > 700) {
        doc.addPage();
        yPosition = 50;
      }

      // Titre de la fuite
      doc.fontSize(12)
         .fillColor('#dc2626')
         .text(`${index + 1}. ${breach.name}`, 50, yPosition);
      
      yPosition += 20;

      // Détails
      const details = [
        `Source: ${breach.source}`,
        `Date: ${breach.date || 'Inconnue'}`,
        `Comptes affectés: ${breach.pwnCount?.toLocaleString() || 'N/A'}`,
        `Données compromises: ${breach.dataClasses?.join(', ') || 'Non spécifié'}`
      ];

      details.forEach(detail => {
        doc.fontSize(10)
           .fillColor('#6b7280')
           .text(detail, 70, yPosition);
        yPosition += 15;
      });

      // Description
      if (breach.description) {
        doc.fontSize(10)
           .fillColor('#374151')
           .text(breach.description, 70, yPosition, { width: 450 });
        yPosition += 40;
      }

      yPosition += 10; // Espacement entre les fuites
    });
  }

  addThreatChart(doc, scan) {
    if (scan.breachDetails.length === 0) return;

    // Nouvelle page pour le graphique
    doc.addPage();
    
    doc.fontSize(14)
       .fillColor('#374151')
       .text('Analyse des Menaces par Sévérité', 50, 50);

    // Compter les menaces par sévérité
    const severityCounts = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0
    };

    scan.breachDetails.forEach(breach => {
      severityCounts[breach.severity] = (severityCounts[breach.severity] || 0) + 1;
    });

    // Dessiner un graphique en barres simple
    const chartX = 50;
    const chartY = 100;
    const barWidth = 80;
    const maxBarHeight = 200;
    const maxCount = Math.max(...Object.values(severityCounts));

    const colors = {
      low: '#10b981',
      medium: '#f59e0b',
      high: '#ef4444',
      critical: '#dc2626'
    };

    let xOffset = 0;
    Object.entries(severityCounts).forEach(([severity, count]) => {
      const barHeight = maxCount > 0 ? (count / maxCount) * maxBarHeight : 0;
      
      // Barre
      doc.rect(chartX + xOffset, chartY + maxBarHeight - barHeight, barWidth, barHeight)
         .fillColor(colors[severity])
         .fill();

      // Label
      doc.fontSize(10)
         .fillColor('#374151')
         .text(severity.toUpperCase(), chartX + xOffset + 10, chartY + maxBarHeight + 10);
      
      // Valeur
      doc.fontSize(12)
         .fillColor('#374151')
         .text(count.toString(), chartX + xOffset + 35, chartY + maxBarHeight - barHeight - 20);

      xOffset += barWidth + 20;
    });
  }

  addRecommendations(doc, scan) {
    doc.addPage();
    
    doc.fontSize(14)
       .fillColor('#374151')
       .text('🔒 Recommandations de Sécurité', 50, 50);

    const recommendations = [
      '1. Changez immédiatement tous vos mots de passe',
      '2. Activez l\'authentification à deux facteurs (2FA)',
      '3. Surveillez vos relevés bancaires et de carte de crédit',
      '4. Considérez un service de surveillance du crédit',
      '5. Utilisez un gestionnaire de mots de passe',
      '6. Activez les alertes de connexion suspecte',
      '7. Vérifiez régulièrement vos comptes en ligne',
      '8. Évitez de réutiliser les mêmes mots de passe'
    ];

    let yPosition = 80;
    recommendations.forEach(rec => {
      doc.fontSize(11)
         .fillColor('#374151')
         .text(rec, 50, yPosition, { width: 500 });
      yPosition += 25;
    });

    // Boîte d'alerte
    doc.rect(50, yPosition + 20, 500, 100)
       .fillColor('#fef2f2')
       .fill();

    doc.rect(50, yPosition + 20, 500, 100)
       .strokeColor('#fca5a5')
       .stroke();

    doc.fontSize(12)
       .fillColor('#dc2626')
       .text('⚠️ IMPORTANT', 60, yPosition + 35);

    doc.fontSize(10)
       .fillColor('#7f1d1d')
       .text(
         'Si vous utilisez le même mot de passe sur plusieurs sites, ' +
         'changez-le IMMÉDIATEMENT sur tous les services. Les cybercriminels ' +
         'testent souvent les mots de passe volés sur d\'autres plateformes.',
         60, yPosition + 55,
         { width: 480 }
       );
  }

  addFooter(doc) {
    const pages = doc.bufferedPageRange();
    
    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);
      
      // Ligne de séparation
      doc.moveTo(50, 750)
         .lineTo(550, 750)
         .strokeColor('#e5e7eb')
         .stroke();

      // Texte du pied de page
      doc.fontSize(8)
         .fillColor('#9ca3af')
         .text(
           `GhostLeaks.ai - Rapport généré le ${new Date().toLocaleDateString('fr-FR')} | Page ${i + 1}/${pages.count}`,
           50, 760,
           { align: 'center', width: 500 }
         );
    }
  }
}

module.exports = new PDFGeneratorService();