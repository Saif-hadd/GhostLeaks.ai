# GhostLeaks.ai Backend

Backend API complet pour la plateforme de détection de fuites de données GhostLeaks.ai.

## 🚀 Fonctionnalités

- **Authentification JWT** avec bcrypt
- **Scan de fuites** via multiple sources gratuites :
  - HaveIBeenPwned API
  - BreachDirectory API  
  - Scraping Pastebin
  - Recherche GitHub
- **Génération de rapports PDF** avec graphiques
- **Alertes automatiques** par email et Telegram
- **Système d'abonnement** (Free/Pro)
- **Cron jobs** pour surveillance continue
- **Rate limiting** et sécurité renforcée

## 📋 Prérequis

- Node.js 18+
- MongoDB Atlas (free tier)
- Comptes API gratuits :
  - HaveIBeenPwned (optionnel)
  - BreachDirectory (optionnel)
  - GitHub Token
  - Gmail App Password
  - Telegram Bot Token

## 🛠️ Installation

### 1. Cloner et installer

```bash
cd ghostleaks-backend
npm install
```

### 2. Configuration des variables d'environnement

```bash
cp .env.example .env
```

Éditez `.env` avec vos vraies clés API :

```env
# MongoDB Atlas
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ghostleaks

# JWT Secret (générez une clé forte)
JWT_SECRET=your-super-secret-jwt-key-256-bits-minimum

# APIs gratuites
HIBP_API_KEY=your-hibp-key-here
BREACH_DIRECTORY_API_KEY=your-breach-directory-key
GITHUB_TOKEN=ghp_your-github-token-here

# Email (Gmail App Password)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-char-app-password

# Telegram Bot
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

### 3. Obtenir les clés API gratuites

#### HaveIBeenPwned (Optionnel - 10 requêtes/min gratuit)
1. Aller sur https://haveibeenpwned.com/API/Key
2. S'inscrire pour une clé gratuite
3. Ajouter la clé dans `HIBP_API_KEY`

#### BreachDirectory (Optionnel)
1. Aller sur https://breachdirectory.org/
2. S'inscrire pour l'API gratuite
3. Ajouter la clé dans `BREACH_DIRECTORY_API_KEY`

#### GitHub Token (Recommandé)
1. Aller dans GitHub Settings > Developer settings > Personal access tokens
2. Créer un token avec scope `public_repo`
3. Ajouter dans `GITHUB_TOKEN`

#### Gmail App Password
1. Activer 2FA sur votre compte Gmail
2. Aller dans Paramètres > Sécurité > Mots de passe d'application
3. Générer un mot de passe pour "Autre"
4. Utiliser ce mot de passe dans `SMTP_PASS`

#### Telegram Bot
1. Parler à @BotFather sur Telegram
2. Créer un nouveau bot avec `/newbot`
3. Récupérer le token et l'ajouter dans `TELEGRAM_BOT_TOKEN`

### 4. Démarrer le serveur

```bash
# Développement
npm run dev

# Production
npm start
```

## 🧪 Tests

```bash
# Lancer tous les tests
npm test

# Tests en mode watch
npm run test:watch

# Tests avec couverture
npm test -- --coverage
```

## 📡 API Endpoints

### Authentification

```bash
# Inscription
curl -X POST http://localhost:3000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123",
    "fullName": "John Doe"
  }'

# Connexion
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123"
  }'
```

### Scan de fuites

```bash
# Démarrer un scan
curl -X POST http://localhost:3000/api/scan/email \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "victim@example.com",
    "fullName": "Victim Name"
  }'

# Vérifier le statut
curl -X GET http://localhost:3000/api/scan/status/SCAN_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Historique des scans
curl -X GET http://localhost:3000/api/scan/history \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Rapports

```bash
# Télécharger rapport PDF
curl -X GET http://localhost:3000/api/reports/download/SCAN_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -o security-report.pdf

# Aperçu du rapport
curl -X GET http://localhost:3000/api/reports/preview/SCAN_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Alertes

```bash
# Configurer les alertes
curl -X PUT http://localhost:3000/api/alerts/settings \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": true,
    "telegram": true,
    "telegramUsername": "your_telegram_username"
  }'

# Tester une alerte
curl -X POST http://localhost:3000/api/alerts/test \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type": "email"}'
```

## 🐳 Déploiement Docker

### Build local

```bash
docker build -t ghostleaks-backend .
docker run -p 3000:3000 --env-file .env ghostleaks-backend
```

### Docker Compose (avec MongoDB)

```bash
docker-compose up -d
```

## ☁️ Déploiement Cloud

### Render.com (Gratuit)

1. Connecter votre repo GitHub à Render
2. Créer un nouveau Web Service
3. Configurer :
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Environment: Ajouter toutes les variables du `.env`

### Heroku

```bash
# Installer Heroku CLI
heroku create ghostleaks-api

# Configurer les variables
heroku config:set MONGODB_URI=your-mongodb-uri
heroku config:set JWT_SECRET=your-jwt-secret
# ... autres variables

# Déployer
git push heroku main
```

### Railway

1. Connecter votre repo à Railway
2. Ajouter les variables d'environnement
3. Déploiement automatique

## 📊 Monitoring et Logs

Les logs sont stockés dans le dossier `logs/` :
- `error.log` : Erreurs uniquement
- `combined.log` : Tous les logs

### Exemple de monitoring

```bash
# Suivre les logs en temps réel
tail -f logs/combined.log

# Filtrer les erreurs
grep "error" logs/combined.log
```

## 🔧 Configuration Avancée

### Cron Jobs

Le système lance automatiquement :
- **Scan quotidien** : 2h du matin (timezone Paris)
- **Nettoyage PDF** : Dimanche 3h (supprime les rapports > 30 jours)
- **Health check** : Toutes les heures

### Rate Limiting

- **Global** : 100 requêtes/15min
- **Auth** : 5 tentatives/15min
- **Scans** : 10 scans/15min
- **Downloads** : 10 téléchargements/5min

### Sécurité

- Helmet.js pour les headers de sécurité
- CORS configuré pour le frontend uniquement
- Validation stricte des inputs
- Hachage bcrypt avec salt 12
- JWT avec expiration 7 jours

## 🔍 Exemple de Scan Complet

```javascript
// Réponse d'un scan terminé
{
  "success": true,
  "scan": {
    "id": "507f1f77bcf86cd799439011",
    "emailScanned": "victim@example.com",
    "status": "completed",
    "threatsFound": 3,
    "severity": "high",
    "aiSummary": "🔴 RISQUE ÉLEVÉ: 3 fuite(s) détectée(s) incluant 1 fuite(s) à haut risque...",
    "breachDetails": [
      {
        "name": "Adobe",
        "source": "hibp",
        "date": "2013-10-04",
        "pwnCount": 152445165,
        "dataClasses": ["Email addresses", "Password hints", "Passwords"],
        "severity": "high"
      }
    ],
    "processingTime": 4500,
    "createdAt": "2025-01-22T10:30:00.000Z"
  }
}
```

## 📈 Exemple de Rapport PDF

Le rapport PDF généré contient :
- **En-tête** avec logo GhostLeaks.ai
- **Informations du scan** (email, date, statut)
- **Résumé exécutif** avec niveau de risque
- **Détails des fuites** trouvées
- **Graphique en barres** des menaces par sévérité
- **Recommandations** personnalisées selon le risque
- **Pied de page** avec date de génération

## 🤖 Exemple d'Alerte Telegram

```
🚨 ALERTE SÉCURITÉ 🚨

📧 Email: victim@example.com
🔍 Nouvelles fuites détectées: 2

🏢 Adobe
📅 Date: 2013-10-04
📊 Comptes affectés: 152,445,165
🔓 Données: Email addresses, Passwords

🔒 Actions recommandées:
• Changez vos mots de passe immédiatement
• Activez l'authentification 2FA
• Surveillez vos comptes

[Voir le rapport complet](http://localhost:5173/dashboard)
```

## 🔄 Intégration Frontend

Pour connecter ce backend à votre frontend React :

### 1. Mettre à jour les variables d'environnement frontend

```env
VITE_API_URL=http://localhost:3000/api
```

### 2. Créer un service API

```javascript
// src/services/api.js
const API_URL = import.meta.env.VITE_API_URL;

export const api = {
  async post(endpoint, data, token = null) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data)
    });
    
    return response.json();
  },
  
  async get(endpoint, token = null) {
    const headers = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    
    const response = await fetch(`${API_URL}${endpoint}`, { headers });
    return response.json();
  }
};
```

### 3. Remplacer les simulations

```javascript
// Dans AuthModal.tsx - remplacer la simulation
const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  
  try {
    const endpoint = mode === 'signin' ? '/users/login' : '/users/register';
    const data = mode === 'signin' 
      ? { email, password }
      : { email, password, fullName };
    
    const result = await api.post(endpoint, data);
    
    if (result.success) {
      localStorage.setItem('token', result.token);
      setUser(result.user);
      onClose();
    } else {
      setError(result.message);
    }
  } catch (error) {
    setError('Erreur de connexion');
  } finally {
    setLoading(false);
  }
};
```

## 🚨 Sécurité en Production

### Variables d'environnement critiques

```bash
# Générer un JWT secret fort
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Utiliser HTTPS uniquement
FRONTEND_URL=https://your-domain.com

# Configurer MongoDB avec authentification
MONGODB_URI=mongodb+srv://user:strongpassword@cluster.mongodb.net/ghostleaks
```

### Recommandations

1. **HTTPS obligatoire** en production
2. **Firewall** : Bloquer tous les ports sauf 80/443
3. **Monitoring** : Configurer des alertes sur les erreurs
4. **Backup** : Sauvegardes automatiques MongoDB
5. **Updates** : Maintenir les dépendances à jour

## 📞 Support

Pour toute question ou problème :
1. Vérifiez les logs dans `logs/error.log`
2. Testez l'endpoint `/health` pour vérifier le statut
3. Consultez la documentation des APIs externes

## 🔄 Mise à jour depuis la simulation

Pour remplacer complètement la simulation actuelle :

1. **Démarrer le backend** : `npm run dev`
2. **Mettre à jour le frontend** pour utiliser les vraies APIs
3. **Configurer les clés API** dans `.env`
4. **Tester** avec de vrais emails

Le backend est maintenant prêt pour la production avec de vraies fonctionnalités de scan !