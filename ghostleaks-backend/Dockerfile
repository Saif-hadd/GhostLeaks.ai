# Utiliser Node.js 18 LTS
FROM node:18-alpine

# Créer le répertoire de l'application
WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances
RUN npm ci --only=production

# Copier le code source
COPY src/ ./src/

# Créer les répertoires nécessaires
RUN mkdir -p logs reports

# Créer un utilisateur non-root pour la sécurité
RUN addgroup -g 1001 -S nodejs
RUN adduser -S ghostleaks -u 1001

# Changer la propriété des fichiers
RUN chown -R ghostleaks:nodejs /app
USER ghostleaks

# Exposer le port
EXPOSE 3000

# Variables d'environnement par défaut
ENV NODE_ENV=production
ENV PORT=3000

# Commande de démarrage
CMD ["node", "src/server.js"]

# Labels pour la documentation
LABEL maintainer="GhostLeaks.ai"
LABEL description="Backend API pour GhostLeaks.ai - Scanner de fuites de données"
LABEL version="1.0.0"