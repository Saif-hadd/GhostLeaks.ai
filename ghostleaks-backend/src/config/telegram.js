const { Telegraf } = require('telegraf');
const logger = require('../utils/logger');

class TelegramService {
  constructor() {
    if (process.env.TELEGRAM_BOT_TOKEN) {
      this.bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
      this.setupBot();
    } else {
      logger.warn('Telegram bot token not provided');
    }
  }

  setupBot() {
    // Commande de démarrage
    this.bot.start((ctx) => {
      ctx.reply(
        '🛡️ Bienvenue sur GhostLeaks.ai Bot!\n\n' +
        'Je vous alerterai automatiquement si de nouvelles fuites de données ' +
        'contenant votre email sont détectées.\n\n' +
        'Pour activer les alertes, connectez-vous sur ghostleaks.ai et ' +
        'configurez votre nom d\'utilisateur Telegram dans les paramètres.'
      );
    });

    // Commande d'aide
    this.bot.help((ctx) => {
      ctx.reply(
        '🤖 Commandes disponibles:\n\n' +
        '/start - Démarrer le bot\n' +
        '/help - Afficher cette aide\n' +
        '/status - Vérifier le statut du service\n\n' +
        'Ce bot vous enverra automatiquement des alertes ' +
        'lorsque de nouvelles fuites sont détectées.'
      );
    });

    // Commande de statut
    this.bot.command('status', (ctx) => {
      ctx.reply('✅ Service GhostLeaks.ai opérationnel\n🔍 Surveillance active des fuites');
    });

    // Lancer le bot
    this.bot.launch();
    logger.info('Telegram bot started successfully');

    // Gestion gracieuse de l'arrêt
    process.once('SIGINT', () => this.bot.stop('SIGINT'));
    process.once('SIGTERM', () => this.bot.stop('SIGTERM'));
  }

  async sendBreachAlert(username, email, breaches) {
    if (!this.bot) {
      logger.warn('Telegram bot not initialized');
      return;
    }

    try {
      const message = `
🚨 *ALERTE SÉCURITÉ* 🚨

📧 Email: \`${email}\`
🔍 Nouvelles fuites détectées: *${breaches.length}*

${breaches.map(breach => `
🏢 *${breach.name}*
📅 Date: ${breach.date || 'Inconnue'}
📊 Comptes affectés: ${breach.pwnCount?.toLocaleString() || 'N/A'}
🔓 Données: ${breach.dataClasses?.join(', ') || 'Non spécifié'}
`).join('\n')}

🔒 *Actions recommandées:*
• Changez vos mots de passe immédiatement
• Activez l'authentification 2FA
• Surveillez vos comptes

[Voir le rapport complet](${process.env.FRONTEND_URL}/dashboard)
      `;

      await this.bot.telegram.sendMessage(`@${username}`, message, {
        parse_mode: 'Markdown',
        disable_web_page_preview: true
      });

      logger.info(`Telegram alert sent to @${username}`);
    } catch (error) {
      logger.error('Failed to send Telegram alert:', error);
      throw error;
    }
  }

  async sendWelcomeMessage(username, name) {
    if (!this.bot) return;

    try {
      const message = `
🎉 *Bienvenue ${name}!*

Votre compte GhostLeaks.ai est maintenant connecté à Telegram.

🔔 Vous recevrez des alertes automatiques si:
• De nouvelles fuites contenant votre email sont détectées
• Des activités suspectes sont identifiées

🛡️ Votre sécurité numérique est notre priorité!

[Accéder au tableau de bord](${process.env.FRONTEND_URL}/dashboard)
      `;

      await this.bot.telegram.sendMessage(`@${username}`, message, {
        parse_mode: 'Markdown'
      });

      logger.info(`Welcome message sent to @${username}`);
    } catch (error) {
      logger.error('Failed to send welcome message:', error);
    }
  }
}

module.exports = new TelegramService();