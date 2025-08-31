const axios = require('axios');
const cheerio = require('cheerio');
const logger = require('../utils/logger');
const Leak = require('../models/Leak');

class LeakScannerService {
  constructor() {
    this.hibpApiKey = process.env.HIBP_API_KEY;
    this.breachDirectoryApiKey = process.env.BREACH_DIRECTORY_API_KEY;
    this.githubToken = process.env.GITHUB_TOKEN;
  }

  async scanEmail(email) {
    logger.info(`Starting comprehensive scan for email: ${email}`);
    const results = {
      hibp: { checked: false, found: false, results: [] },
      breachDirectory: { checked: false, found: false, results: [] },
      pastebin: { checked: false, found: false, results: [] },
      github: { checked: false, found: false, results: [] }
    };

    // Exécuter tous les scans en parallèle
    const scanPromises = [
      this.scanHaveIBeenPwned(email),
      this.scanBreachDirectory(email),
      this.scanPastebin(email),
      this.scanGitHub(email)
    ];

    try {
      const [hibpResult, bdResult, pastebinResult, githubResult] = await Promise.allSettled(scanPromises);
      
      // Traiter les résultats
      if (hibpResult.status === 'fulfilled') {
        results.hibp = hibpResult.value;
      } else {
        logger.error('HIBP scan failed:', hibpResult.reason);
      }

      if (bdResult.status === 'fulfilled') {
        results.breachDirectory = bdResult.value;
      } else {
        logger.error('BreachDirectory scan failed:', bdResult.reason);
      }

      if (pastebinResult.status === 'fulfilled') {
        results.pastebin = pastebinResult.value;
      } else {
        logger.error('Pastebin scan failed:', pastebinResult.reason);
      }

      if (githubResult.status === 'fulfilled') {
        results.github = githubResult.value;
      } else {
        logger.error('GitHub scan failed:', githubResult.reason);
      }

      // Consolider les résultats
      const consolidatedResults = await this.consolidateResults(email, results);
      
      logger.info(`Scan completed for ${email}. Found ${consolidatedResults.length} breaches.`);
      return consolidatedResults;

    } catch (error) {
      logger.error('Error during email scan:', error);
      throw error;
    }
  }

  async scanHaveIBeenPwned(email) {
    const result = { checked: true, found: false, results: [] };
    
    if (!this.hibpApiKey) {
      logger.warn('HIBP API key not configured');
      return result;
    }

    try {
      const response = await axios.get(
        `https://haveibeenpwned.com/api/v3/breachedaccount/${encodeURIComponent(email)}`,
        {
          headers: {
            'hibp-api-key': this.hibpApiKey,
            'User-Agent': 'GhostLeaks.ai-Scanner'
          },
          timeout: 10000
        }
      );

      if (response.data && response.data.length > 0) {
        result.found = true;
        result.results = response.data.map(breach => ({
          name: breach.Name,
          domain: breach.Domain,
          breachDate: breach.BreachDate,
          pwnCount: breach.PwnCount,
          description: breach.Description,
          dataClasses: breach.DataClasses,
          isVerified: breach.IsVerified,
          isSensitive: breach.IsSensitive,
          source: 'hibp'
        }));
      }

      logger.info(`HIBP scan completed for ${email}: ${result.results.length} breaches found`);
      return result;

    } catch (error) {
      if (error.response?.status === 404) {
        // 404 = pas de breach trouvée
        logger.info(`HIBP: No breaches found for ${email}`);
        return result;
      } else if (error.response?.status === 429) {
        logger.warn('HIBP rate limit exceeded');
        throw new Error('Rate limit exceeded for HIBP API');
      } else {
        logger.error('HIBP API error:', error.message);
        throw error;
      }
    }
  }

  async scanBreachDirectory(email) {
    const result = { checked: true, found: false, results: [] };
    
    if (!this.breachDirectoryApiKey) {
      logger.warn('BreachDirectory API key not configured');
      return result;
    }

    try {
      const response = await axios.get(
        `https://breachdirectory.org/api/search`,
        {
          params: {
            email: email,
            api_key: this.breachDirectoryApiKey
          },
          timeout: 15000
        }
      );

      if (response.data && response.data.found && response.data.result) {
        result.found = true;
        result.results = response.data.result.map(breach => ({
          name: breach.source || 'Unknown',
          domain: breach.domain,
          breachDate: breach.date,
          description: `Data found in ${breach.source}`,
          dataClasses: breach.fields || [],
          source: 'breach_directory'
        }));
      }

      logger.info(`BreachDirectory scan completed for ${email}: ${result.results.length} breaches found`);
      return result;

    } catch (error) {
      logger.error('BreachDirectory API error:', error.message);
      throw error;
    }
  }

  async scanPastebin(email) {
    const result = { checked: true, found: false, results: [] };

    try {
      // Recherche sur Pastebin via Google (méthode gratuite)
      const searchQuery = `site:pastebin.com "${email}"`;
      const response = await axios.get(
        `https://www.googleapis.com/customsearch/v1`,
        {
          params: {
            key: process.env.GOOGLE_API_KEY, // Optionnel
            cx: process.env.GOOGLE_CSE_ID,   // Optionnel
            q: searchQuery,
            num: 10
          },
          timeout: 10000
        }
      );

      if (response.data.items && response.data.items.length > 0) {
        result.found = true;
        result.results = response.data.items.map(item => ({
          name: 'Pastebin Leak',
          url: item.link,
          title: item.title,
          snippet: item.snippet,
          source: 'pastebin',
          severity: 'medium'
        }));
      }

      logger.info(`Pastebin scan completed for ${email}: ${result.results.length} results found`);
      return result;

    } catch (error) {
      // Si pas de clé Google API, on skip silencieusement
      if (!process.env.GOOGLE_API_KEY) {
        logger.info('Google API key not configured, skipping Pastebin scan');
        return result;
      }
      
      logger.error('Pastebin scan error:', error.message);
      return result; // Ne pas faire échouer le scan complet
    }
  }

  async scanGitHub(email) {
    const result = { checked: true, found: false, results: [] };

    if (!this.githubToken) {
      logger.warn('GitHub token not configured');
      return result;
    }

    try {
      // Recherche dans les commits et issues GitHub
      const searchQueries = [
        `"${email}" in:file`,
        `"${email}" in:commit`,
        `"${email}" in:issue`
      ];

      for (const query of searchQueries) {
        try {
          const response = await axios.get(
            'https://api.github.com/search/code',
            {
              params: { q: query, per_page: 10 },
              headers: {
                'Authorization': `token ${this.githubToken}`,
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'GhostLeaks.ai-Scanner'
              },
              timeout: 10000
            }
          );

          if (response.data.items && response.data.items.length > 0) {
            result.found = true;
            result.results.push(...response.data.items.map(item => ({
              name: 'GitHub Code Exposure',
              repository: item.repository.full_name,
              path: item.path,
              url: item.html_url,
              score: item.score,
              source: 'github',
              severity: 'high' // Exposition de code = risque élevé
            })));
          }

          // Respecter les limites de taux GitHub
          await new Promise(resolve => setTimeout(resolve, 1000));

        } catch (searchError) {
          if (searchError.response?.status === 403) {
            logger.warn('GitHub API rate limit exceeded');
            break;
          }
          logger.error(`GitHub search error for query "${query}":`, searchError.message);
        }
      }

      logger.info(`GitHub scan completed for ${email}: ${result.results.length} exposures found`);
      return result;

    } catch (error) {
      logger.error('GitHub scan error:', error.message);
      return result;
    }
  }

  async consolidateResults(email, scanResults) {
    const allBreaches = [];

    // Consolider tous les résultats
    Object.values(scanResults).forEach(methodResult => {
      if (methodResult.found && methodResult.results) {
        allBreaches.push(...methodResult.results);
      }
    });

    // Dédupliquer par nom
    const uniqueBreaches = [];
    const seenNames = new Set();

    allBreaches.forEach(breach => {
      const key = `${breach.name}-${breach.source}`;
      if (!seenNames.has(key)) {
        seenNames.add(key);
        uniqueBreaches.push(breach);
      }
    });

    // Sauvegarder les nouvelles fuites dans la base
    for (const breach of uniqueBreaches) {
      try {
        await this.saveOrUpdateLeak(breach, email);
      } catch (error) {
        logger.error('Error saving leak:', error);
      }
    }

    return uniqueBreaches;
  }

  async saveOrUpdateLeak(breachData, email) {
    try {
      let leak = await Leak.findOne({ 
        name: breachData.name, 
        source: breachData.source 
      });

      if (!leak) {
        leak = new Leak({
          name: breachData.name,
          domain: breachData.domain,
          breachDate: breachData.breachDate ? new Date(breachData.breachDate) : null,
          pwnCount: breachData.pwnCount || 0,
          description: breachData.description,
          dataClasses: breachData.dataClasses || [],
          isVerified: breachData.isVerified || false,
          isSensitive: breachData.isSensitive || false,
          source: breachData.source,
          sourceId: breachData.sourceId
        });

        leak.calculateSeverity();
        await leak.save();
        logger.info(`New leak saved: ${leak.name}`);
      }

      // Ajouter l'email affecté
      await leak.addAffectedEmail(email, breachData.context || '');

      return leak;
    } catch (error) {
      logger.error('Error saving/updating leak:', error);
      throw error;
    }
  }

  // Méthode pour scanner plusieurs emails (pour les cron jobs)
  async scanMultipleEmails(emails) {
    const results = [];
    
    for (const email of emails) {
      try {
        const scanResult = await this.scanEmail(email);
        results.push({ email, success: true, breaches: scanResult });
        
        // Délai entre les scans pour éviter les rate limits
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        logger.error(`Failed to scan ${email}:`, error);
        results.push({ email, success: false, error: error.message });
      }
    }
    
    return results;
  }
}

module.exports = new LeakScannerService();