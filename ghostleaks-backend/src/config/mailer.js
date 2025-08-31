const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

class MailerService {
  constructor() {
    this.transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false, // true pour 465, false pour autres ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendEmail(to, subject, html, attachments = []) {
    try {
      const mailOptions = {
        from: `"GhostLeaks.ai" <${process.env.SMTP_USER}>`,
        to,
        subject,
        html,
        attachments
      };

      const result = await this.transporter.sendMail(mailOptions);
      logger.info(`Email sent successfully to ${to}:`, result.messageId);
      return result;
    } catch (error) {
      logger.error('Failed to send email:', error);
      throw error;
    }
  }

  async sendBreachAlert(email, breaches) {
    const subject = '🚨 Nouvelle fuite de données détectée - GhostLeaks.ai';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #1f2937 0%, #111827 100%); padding: 30px; text-align: center;">
          <h1 style="color: #10b981; margin: 0; font-size: 28px;">🛡️ GhostLeaks.ai</h1>
          <p style="color: #d1d5db; margin: 10px 0 0 0;">Alerte de Sécurité</p>
        </div>
        
        <div style="background: #f9fafb; padding: 30px;">
          <h2 style="color: #dc2626; margin-top: 0;">⚠️ Nouvelle fuite détectée</h2>
          <p style="color: #374151; line-height: 1.6;">
            Nous avons détecté que votre adresse email <strong>${email}</strong> 
            apparaît dans ${breaches.length} nouvelle(s) fuite(s) de données.
          </p>
          
          <div style="background: white; border-left: 4px solid #dc2626; padding: 20px; margin: 20px 0;">
            <h3 style="color: #dc2626; margin-top: 0;">Fuites détectées :</h3>
            ${breaches.map(breach => `
              <div style="margin-bottom: 15px; padding: 15px; background: #fef2f2; border-radius: 8px;">
                <h4 style="color: #991b1b; margin: 0 0 10px 0;">${breach.name}</h4>
                <p style="color: #7f1d1d; margin: 0; font-size: 14px;">
                  Date: ${breach.date || 'Inconnue'}<br>
                  Données compromises: ${breach.dataClasses?.join(', ') || 'Non spécifié'}
                </p>
              </div>
            `).join('')}
          </div>
          
          <h3 style="color: #059669;">🔒 Actions recommandées :</h3>
          <ul style="color: #374151; line-height: 1.8;">
            <li>Changez immédiatement vos mots de passe</li>
            <li>Activez l'authentification à deux facteurs</li>
            <li>Surveillez vos comptes bancaires</li>
            <li>Considérez un gel de crédit si nécessaire</li>
          </ul>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.FRONTEND_URL}/dashboard" 
               style="background: #10b981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
              Voir le Rapport Complet
            </a>
          </div>
        </div>
        
        <div style="background: #1f2937; padding: 20px; text-align: center;">
          <p style="color: #9ca3af; margin: 0; font-size: 12px;">
            © 2025 GhostLeaks.ai - Protection de votre identité numérique
          </p>
        </div>
      </div>
    `;

    return this.sendEmail(email, subject, html);
  }

  async sendWelcomeEmail(email, name) {
    const subject = '🎉 Bienvenue sur GhostLeaks.ai';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #1f2937 0%, #111827 100%); padding: 30px; text-align: center;">
          <h1 style="color: #10b981; margin: 0; font-size: 28px;">🛡️ GhostLeaks.ai</h1>
        </div>
        
        <div style="background: #f9fafb; padding: 30px;">
          <h2 style="color: #1f2937;">Bienvenue ${name} !</h2>
          <p style="color: #374151; line-height: 1.6;">
            Votre compte a été créé avec succès. Vous pouvez maintenant commencer à scanner 
            vos emails pour détecter d'éventuelles fuites de données.
          </p>
          
          <div style="background: white; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0;">
            <h3 style="color: #059669; margin-top: 0;">Plan Gratuit activé :</h3>
            <ul style="color: #374151;">
              <li>5 scans par jour</li>
              <li>Détection de base des fuites</li>
              <li>Alertes par email</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.FRONTEND_URL}/scan" 
               style="background: #10b981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
              Commencer mon Premier Scan
            </a>
          </div>
        </div>
      </div>
    `;

    return this.sendEmail(email, subject, html);
  }
}

module.exports = new MailerService();