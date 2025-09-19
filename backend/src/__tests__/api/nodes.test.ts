import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import app from '../../index';

const prisma = new PrismaClient();

describe('Nodes API', () => {
  let authToken: string;

  beforeAll(async () => {
    // Clean up test data
    await prisma.user.deleteMany({
      where: {
        email: {
          contains: 'nodes-test'
        }
      }
    });

    // Create test user
    const hashedPassword = await bcrypt.hash('password123', 12);
    await prisma.user.create({
      data: {
        email: 'nodes-test@example.com',
        password: hashedPassword,
        name: 'Nodes Test',
        role: 'USER'
      }
    });

    // Login to get token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'nodes-test@example.com',
        password: 'password123'
      });

    authToken = loginResponse.body.data.token;
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.user.deleteMany({
      where: {
        email: {
          contains: 'nodes-test'
        }
      }
    });
    await prisma.$disconnect();
  });

  describe('GET /api/nodes', () => {
    it('should return list of available node types', async () => {
      const response = await request(app)
        .get('/api/nodes')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.data.length).toBeGreaterThan(0);

      // Check node structure
      const node = response.body.data[0];
      expect(node).toHaveProperty('type');
      expect(node).toHaveProperty('displayName');
      expect(node).toHaveProperty('description');
      expect(node).toHaveProperty('group');
      expect(node).toHaveProperty('properties');
    });

    it('should filter nodes by category', async () => {
      const response = await request(app)
        .get('/api/nodes?category=trigger')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.every((node: any) => 
        node.group.includes('trigger')
      )).toBe(true);
    });

    it('should filter nodes by search term', async () => {
      const response = await request(app)
        .get('/api/nodes?search=HTTP')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.every((node: any) => 
        node.displayName.toLowerCase().includes('http') ||
        node.description.toLowerCase().includes('http') ||
        node.type.toLowerCase().includes('http')
      )).toBe(true);
    });

    it('should paginate nodes correctly', async () => {
      const response = await request(app)
        .get('/api/nodes?page=1&limit=2')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(2);
      expect(response.body.data.length).toBeLessThanOrEqual(2);
    });

    it('should sort nodes correctly', async () => {
      const response = await request(app)
        .get('/api/nodes?sortBy=displayName&sortOrder=asc')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      
      // Check if sorted alphabetically
      const names = response.body.data.map((node: any) => node.displayName);
      const sortedNames = [...names].sort();
      expect(names).toEqual(sortedNames);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/nodes')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('GET /api/nodes/categories', () => {
    it('should return list of node categories', async () => {
      const response = await request(app)
        .get('/api/nodes/categories')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);

      // Check category structure
      const category = response.body.data[0];
      expect(category).toHaveProperty('name');
      expect(category).toHaveProperty('displayName');
      expect(category).toHaveProperty('count');
      expect(typeof category.count).toBe('number');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/nodes/categories')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('GET /api/nodes/:type', () => {
    it('should return specific node type details', async () => {
      const response = await request(app)
        .get('/api/nodes/http-request')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.type).toBe('http-request');
      expect(response.body.data.displayName).toBe('HTTP Request');
      expect(response.body.data.properties).toBeDefined();
      expect(Array.isArray(response.body.data.properties)).toBe(true);
    });

    it('should return 404 for non-existent node type', async () => {
      const response = await request(app)
        .get('/api/nodes/non-existent-node')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NODE_TYPE_NOT_FOUND');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/nodes/http-request')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });
  });
});