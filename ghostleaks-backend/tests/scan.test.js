const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const Scan = require('../src/models/Scan');
const jwt = require('jsonwebtoken');

describe('Scan Endpoints', () => {
  let authToken;
  let testUser;

  beforeEach(async () => {
    // Créer un utilisateur de test
    testUser = new User({
      email: 'test@example.com',
      password: 'TestPass123',
      fullName: 'Test User'
    });
    await testUser.save();

    // Générer un token
    authToken = jwt.sign({ id: testUser._id }, process.env.JWT_SECRET);
  });

  afterEach(async () => {
    // Nettoyer la base de test
    await User.deleteMany({});
    await Scan.deleteMany({});
  });

  describe('POST /api/scan/email', () => {
    it('should start a scan for authenticated user', async () => {
      const response = await request(app)
        .post('/api/scan/email')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'test@victim.com',
          fullName: 'Victim User'
        });

      expect(response.status).toBe(202);
      expect(response.body.success).toBe(true);
      expect(response.body.scanId).toBeDefined();
      expect(response.body.status).toBe('processing');
    });

    it('should reject scan without authentication', async () => {
      const response = await request(app)
        .post('/api/scan/email')
        .send({
          email: 'test@victim.com',
          fullName: 'Victim User'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should reject invalid email format', async () => {
      const response = await request(app)
        .post('/api/scan/email')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'invalid-email',
          fullName: 'Test User'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject scan when no scans remaining', async () => {
      // Épuiser les scans
      testUser.scansRemaining = 0;
      await testUser.save();

      const response = await request(app)
        .post('/api/scan/email')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'test@victim.com',
          fullName: 'Victim User'
        });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Limite de scans atteinte');
    });
  });

  describe('GET /api/scan/history', () => {
    beforeEach(async () => {
      // Créer quelques scans de test
      const scans = [
        {
          userId: testUser._id,
          emailScanned: 'test1@example.com',
          status: 'completed',
          threatsFound: 2,
          severity: 'high'
        },
        {
          userId: testUser._id,
          emailScanned: 'test2@example.com',
          status: 'completed',
          threatsFound: 0,
          severity: 'low'
        }
      ];

      await Scan.insertMany(scans);
    });

    it('should return scan history for authenticated user', async () => {
      const response = await request(app)
        .get('/api/scan/history')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.scans).toHaveLength(2);
      expect(response.body.pagination).toBeDefined();
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/scan/history?page=1&limit=1')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.scans).toHaveLength(1);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(1);
    });
  });

  describe('GET /api/scan/status/:scanId', () => {
    let testScan;

    beforeEach(async () => {
      testScan = new Scan({
        userId: testUser._id,
        emailScanned: 'test@example.com',
        status: 'processing'
      });
      await testScan.save();
    });

    it('should return scan status for owner', async () => {
      const response = await request(app)
        .get(`/api/scan/status/${testScan._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.scan.id).toBe(testScan._id.toString());
      expect(response.body.scan.status).toBe('processing');
    });

    it('should not return scan status for non-owner', async () => {
      // Créer un autre utilisateur
      const otherUser = new User({
        email: 'other@example.com',
        password: 'OtherPass123',
        fullName: 'Other User'
      });
      await otherUser.save();

      const otherToken = jwt.sign({ id: otherUser._id }, process.env.JWT_SECRET);

      const response = await request(app)
        .get(`/api/scan/status/${testScan._id}`)
        .set('Authorization', `Bearer ${otherToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });
});