#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

console.log('🛡️  GhostLeaks.ai Backend Setup\n');

// Créer les dossiers nécessaires
const directories = ['logs', 'reports', 'uploads'];
directories.forEach(dir => {
  const dirPath = path.join(__dirname, '..', dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`✅ Created directory: ${dir}/`);
  }
});

// Générer un JWT secret si .env n'existe pas
const envPath = path.join(__dirname, '..', '.env');
if (!fs.existsSync(envPath)) {
  const jwtSecret = crypto.randomBytes(64).toString('hex');
  
  const envContent = `# GhostLeaks.ai Backend Configuration
# Généré automatiquement le ${new Date().toISOString()}

# Base de données MongoDB Atlas
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ghostleaks?retryWrites=true&w=majority

# JWT Secret (généré automatiquement)
JWT_SECRET=${jwtSecret}

# Port du serveur
PORT=3000

# Environment
NODE_ENV=development

# APIs externes (à configurer)
HIBP_API_KEY=your-hibp-api-key-here
BREACH_DIRECTORY_API_KEY=your-breach-directory-api-key-here
GITHUB_TOKEN=your-github-token-here

# Configuration email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Telegram Bot
TELEGRAM_BOT_TOKEN=your-telegram-bot-token-here

# Frontend URL
FRONTEND_URL=http://localhost:5173

# Rate limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Limites de scan
FREE_SCANS_PER_DAY=5
PRO_SCANS_PER_DAY=999999
`;

  fs.writeFileSync(envPath, envContent);
  console.log('✅ Created .env file with generated JWT secret');
}

console.log('\n🔧 Configuration requise:');
console.log('1. Éditez le fichier .env avec vos vraies clés API');
console.log('2. Configurez MongoDB Atlas');
console.log('3. Obtenez les clés API gratuites (voir README.md)');
console.log('4. Lancez: npm run dev');

console.log('\n📚 Consultez README.md pour les instructions détaillées');
console.log('🚀 Setup terminé!\n');