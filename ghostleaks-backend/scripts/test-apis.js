#!/usr/bin/env node

require('dotenv').config();
const axios = require('axios');
const logger = require('../src/utils/logger');

async function testAPIs() {
  console.log('🧪 Test des APIs externes\n');

  // Test HaveIBeenPwned
  if (process.env.HIBP_API_KEY) {
    try {
      console.log('Testing HaveIBeenPwned API...');
      const response = await axios.get(
        'https://haveibeenpwned.com/api/v3/breachedaccount/test@example.com',
        {
          headers: {
            'hibp-api-key': process.env.HIBP_API_KEY,
            'User-Agent': 'GhostLeaks.ai-Test'
          },
          timeout: 10000
        }
      );
      console.log('✅ HIBP API: OK');
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('✅ HIBP API: OK (no breaches found for test email)');
      } else {
        console.log('❌ HIBP API: Error -', error.message);
      }
    }
  } else {
    console.log('⚠️  HIBP API: Key not configured');
  }

  // Test GitHub API
  if (process.env.GITHUB_TOKEN) {
    try {
      console.log('Testing GitHub API...');
      const response = await axios.get(
        'https://api.github.com/user',
        {
          headers: {
            'Authorization': `token ${process.env.GITHUB_TOKEN}`,
            'User-Agent': 'GhostLeaks.ai-Test'
          },
          timeout: 10000
        }
      );
      console.log('✅ GitHub API: OK');
    } catch (error) {
      console.log('❌ GitHub API: Error -', error.message);
    }
  } else {
    console.log('⚠️  GitHub API: Token not configured');
  }

  // Test SMTP
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      console.log('Testing SMTP configuration...');
      const nodemailer = require('nodemailer');
      
      const transporter = nodemailer.createTransporter({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      await transporter.verify();
      console.log('✅ SMTP: OK');
    } catch (error) {
      console.log('❌ SMTP: Error -', error.message);
    }
  } else {
    console.log('⚠️  SMTP: Credentials not configured');
  }

  // Test Telegram Bot
  if (process.env.TELEGRAM_BOT_TOKEN) {
    try {
      console.log('Testing Telegram Bot...');
      const response = await axios.get(
        `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/getMe`,
        { timeout: 10000 }
      );
      
      if (response.data.ok) {
        console.log(`✅ Telegram Bot: OK (@${response.data.result.username})`);
      } else {
        console.log('❌ Telegram Bot: Invalid response');
      }
    } catch (error) {
      console.log('❌ Telegram Bot: Error -', error.message);
    }
  } else {
    console.log('⚠️  Telegram Bot: Token not configured');
  }

  console.log('\n🔧 Pour configurer les APIs manquantes, consultez README.md');
}

testAPIs().catch(console.error);