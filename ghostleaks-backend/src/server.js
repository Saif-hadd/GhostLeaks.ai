require('dotenv').config();

const app = require('./app');
const connectDB = require('./config/database');
const logger = require('./utils/logger');
const cron = require('node-cron');
const alertController = require('./controllers/alertController');

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // Connexion à la base de données
    await connectDB();
    
    // Démarrer le serveur
    const server = app.listen(PORT, () => {
      logger.info(`🚀 GhostLeaks.ai API started on port ${PORT}`);
      logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🔗 Health check: http://localhost:${PORT}/health`);
    });

    // Configuration des cron jobs
    setupCronJobs();

    // Gestion gracieuse de l'arrêt
    const gracefulShutdown = (signal) => {
      logger.info(`${signal} received, shutting down gracefully`);
      
      server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });

      // Force shutdown après 30 secondes
      setTimeout(() => {
        logger.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 30000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

function setupCronJobs() {
  // Scan automatique quotidien à 2h du matin
  cron.schedule('0 2 * * *', async () => {
    logger.info('Starting scheduled daily email scans');
    try {
      await alertController.scanUserEmails();
      logger.info('Scheduled daily email scans completed');
    } catch (error) {
      logger.error('Error in scheduled email scans:', error);
    }
  }, {
    timezone: "Europe/Paris"
  });

  // Nettoyage des anciens rapports PDF (tous les dimanches à 3h)
  cron.schedule('0 3 * * 0', async () => {
    logger.info('Starting PDF cleanup');
    try {
      await cleanupOldReports();
      logger.info('PDF cleanup completed');
    } catch (error) {
      logger.error('Error in PDF cleanup:', error);
    }
  }, {
    timezone: "Europe/Paris"
  });

  // Vérification de santé du système (toutes les heures)
  cron.schedule('0 * * * *', async () => {
    try {
      await performHealthCheck();
    } catch (error) {
      logger.error('Health check failed:', error);
    }
  });

  logger.info('Cron jobs configured successfully');
}

async function cleanupOldReports() {
  const fs = require('fs');
  const path = require('path');
  const reportsDir = path.join(__dirname, '../reports');
  
  if (!fs.existsSync(reportsDir)) return;

  const files = fs.readdirSync(reportsDir);
  const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);

  let deletedCount = 0;
  
  files.forEach(file => {
    const filePath = path.join(reportsDir, file);
    const stats = fs.statSync(filePath);
    
    if (stats.mtime.getTime() < thirtyDaysAgo) {
      fs.unlinkSync(filePath);
      deletedCount++;
    }
  });

  logger.info(`Cleaned up ${deletedCount} old PDF reports`);
}

async function performHealthCheck() {
  const mongoose = require('mongoose');
  
  const health = {
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    memory: process.memoryUsage(),
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  };

  if (health.database !== 'connected') {
    logger.error('Health check failed: Database disconnected', health);
  } else {
    logger.debug('Health check passed', health);
  }
}

// Démarrer le serveur
startServer();