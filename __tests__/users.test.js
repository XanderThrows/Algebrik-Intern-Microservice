const request = require('supertest');
const app = require('../server');

describe('User Management API', () => {
  // Store initial users and created user IDs for cleanup
  let initialUsers = [];
  let createdUserIds = [];

  // Get initial state before tests
  beforeAll(async () => {
    const response = await request(app).get('/api/users');
    initialUsers = response.body;
  });

  // Clean up created users after each test
  afterEach(async () => {
    // Delete all users that were created during tests
    for (const userId of createdUserIds) {
      try {
        await request(app).delete(`/api/users/${userId}`);
      } catch (error) {
        // User might already be deleted, ignore
      }
    }
    createdUserIds = [];
  });

  describe('GET /api/users', () => {
    test('should return all users', async () => {
      const response = await request(app)
        .get('/api/users')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(initialUsers.length);
      
      // Check that each user has required fields
      response.body.forEach(user => {
        expect(user).toHaveProperty('id');
        expect(user).toHaveProperty('name');
        expect(user).toHaveProperty('email');
      });
    });

    test('should return at least the initial users', async () => {
      const response = await request(app)
        .get('/api/users')
        .expect(200);

      // Check that initial users are present
      const initialUserIds = initialUsers.map(u => u.id);
      const returnedUserIds = response.body.map(u => u.id);
      
      initialUserIds.forEach(id => {
        expect(returnedUserIds).toContain(id);
      });
    });
  });

  describe('GET /api/users/:id', () => {
    test('should return a user by ID', async () => {
      // Use the first initial user, or create one if none exist
      let testUser = initialUsers[0];
      if (!testUser) {
        // If no initial users, create one first
        const createResponse = await request(app)
          .post('/api/users')
          .send({ name: 'Test User', email: 'test@example.com' })
          .expect(201);
        testUser = createResponse.body;
        createdUserIds.push(testUser.id);
      }

      const response = await request(app)
        .get(`/api/users/${testUser.id}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', testUser.id);
      expect(response.body).toHaveProperty('name', testUser.name);
      expect(response.body).toHaveProperty('email', testUser.email);
    });

    test('should return 404 for non-existent user', async () => {
      const nonExistentId = 999999;
      const response = await request(app)
        .get(`/api/users/${nonExistentId}`)
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('User not found');
    });

    test('should return 404 for invalid user ID', async () => {
      const response = await request(app)
        .get('/api/users/invalid-id')
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('User not found');
    });
  });

  describe('POST /api/users', () => {
    test('should create a new user with valid data', async () => {
      const newUser = {
        name: 'New Test User',
        email: 'newtest@example.com'
      };

      const response = await request(app)
        .post('/api/users')
        .send(newUser)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name', newUser.name);
      expect(response.body).toHaveProperty('email', newUser.email);
      expect(response.body).toHaveProperty('createdAt');
      expect(typeof response.body.createdAt).toBe('string');

      // Store for cleanup
      createdUserIds.push(response.body.id);

      // Verify user was added to the list
      const usersResponse = await request(app).get('/api/users');
      const userIds = usersResponse.body.map(u => u.id);
      expect(userIds).toContain(response.body.id);
    });

    test('should return 400 when name is missing', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({
          email: 'test@example.com'
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Name and email are required');
    });

    test('should return 400 when email is missing', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({
          name: 'Test User'
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Name and email are required');
    });

    test('should return 400 when both name and email are missing', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Name and email are required');
    });

    test('should return 400 when name is empty string', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({
          name: '',
          email: 'test@example.com'
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Name and email are required');
    });

    test('should return 400 when email is empty string', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({
          name: 'Test User',
          email: ''
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Name and email are required');
    });

    test('should create user with unique ID', async () => {
      const user1 = {
        name: 'User One',
        email: 'user1@example.com'
      };

      const user2 = {
        name: 'User Two',
        email: 'user2@example.com'
      };

      const response1 = await request(app)
        .post('/api/users')
        .send(user1)
        .expect(201);

      const response2 = await request(app)
        .post('/api/users')
        .send(user2)
        .expect(201);

      expect(response1.body.id).not.toBe(response2.body.id);

      // Store for cleanup
      createdUserIds.push(response1.body.id);
      createdUserIds.push(response2.body.id);
    });
  });

  describe('PUT /api/users/:id', () => {
    let testUserId;

    beforeEach(async () => {
      // Create a user for testing updates
      const response = await request(app)
        .post('/api/users')
        .send({
          name: 'Original Name',
          email: 'original@example.com'
        })
        .expect(201);
      
      testUserId = response.body.id;
      createdUserIds.push(testUserId);
    });

    test('should update an existing user', async () => {
      const updatedData = {
        name: 'Updated Name',
        email: 'updated@example.com'
      };

      const response = await request(app)
        .put(`/api/users/${testUserId}`)
        .send(updatedData)
        .expect(200);

      expect(response.body).toHaveProperty('id', testUserId);
      expect(response.body).toHaveProperty('name', updatedData.name);
      expect(response.body).toHaveProperty('email', updatedData.email);
      expect(response.body).toHaveProperty('updatedAt');
      expect(typeof response.body.updatedAt).toBe('string');

      // Verify the update was persisted
      const getResponse = await request(app)
        .get(`/api/users/${testUserId}`)
        .expect(200);

      expect(getResponse.body.name).toBe(updatedData.name);
      expect(getResponse.body.email).toBe(updatedData.email);
    });

    test('should return 404 for non-existent user', async () => {
      const nonExistentId = 999999;
      const response = await request(app)
        .put(`/api/users/${nonExistentId}`)
        .send({
          name: 'Test',
          email: 'test@example.com'
        })
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('User not found');
    });

    test('should return 400 when name is missing', async () => {
      const response = await request(app)
        .put(`/api/users/${testUserId}`)
        .send({
          email: 'test@example.com'
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Name and email are required');
    });

    test('should return 400 when email is missing', async () => {
      const response = await request(app)
        .put(`/api/users/${testUserId}`)
        .send({
          name: 'Test User'
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Name and email are required');
    });

    test('should return 400 when both name and email are missing', async () => {
      const response = await request(app)
        .put(`/api/users/${testUserId}`)
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Name and email are required');
    });

    test('should preserve createdAt when updating', async () => {
      // First get the user to see createdAt
      const originalUser = await request(app)
        .get(`/api/users/${testUserId}`)
        .expect(200);

      const originalCreatedAt = originalUser.body.createdAt;

      // Update the user
      await request(app)
        .put(`/api/users/${testUserId}`)
        .send({
          name: 'Updated Name',
          email: 'updated@example.com'
        })
        .expect(200);

      // Get updated user and verify createdAt is preserved
      const updatedUser = await request(app)
        .get(`/api/users/${testUserId}`)
        .expect(200);

      expect(updatedUser.body.createdAt).toBe(originalCreatedAt);
      expect(updatedUser.body).toHaveProperty('updatedAt');
    });
  });

  describe('DELETE /api/users/:id', () => {
    let testUserId;

    beforeEach(async () => {
      // Create a user for testing deletion
      const response = await request(app)
        .post('/api/users')
        .send({
          name: 'User To Delete',
          email: 'delete@example.com'
        })
        .expect(201);
      
      testUserId = response.body.id;
      // Don't add to createdUserIds since we're testing deletion
    });

    test('should delete an existing user', async () => {
      const response = await request(app)
        .delete(`/api/users/${testUserId}`)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('User deleted successfully');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('id', testUserId);

      // Verify user was deleted
      await request(app)
        .get(`/api/users/${testUserId}`)
        .expect(404);
    });

    test('should return 404 for non-existent user', async () => {
      const nonExistentId = 999999;
      const response = await request(app)
        .delete(`/api/users/${nonExistentId}`)
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('User not found');
    });

    test('should return 404 for invalid user ID', async () => {
      const response = await request(app)
        .delete('/api/users/invalid-id')
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('User not found');
    });

    test('should not be able to get user after deletion', async () => {
      // Delete the user
      await request(app)
        .delete(`/api/users/${testUserId}`)
        .expect(200);

      // Try to get the deleted user
      const response = await request(app)
        .get(`/api/users/${testUserId}`)
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('User not found');
    });
  });

  describe('Integration tests', () => {
    test('should perform full CRUD operations', async () => {
      // Create
      const createResponse = await request(app)
        .post('/api/users')
        .send({
          name: 'Integration Test User',
          email: 'integration@example.com'
        })
        .expect(201);

      const userId = createResponse.body.id;
      createdUserIds.push(userId);

      // Read
      const readResponse = await request(app)
        .get(`/api/users/${userId}`)
        .expect(200);

      expect(readResponse.body.name).toBe('Integration Test User');
      expect(readResponse.body.email).toBe('integration@example.com');

      // Update
      const updateResponse = await request(app)
        .put(`/api/users/${userId}`)
        .send({
          name: 'Updated Integration User',
          email: 'updated-integration@example.com'
        })
        .expect(200);

      expect(updateResponse.body.name).toBe('Updated Integration User');
      expect(updateResponse.body.email).toBe('updated-integration@example.com');

      // Verify update
      const verifyResponse = await request(app)
        .get(`/api/users/${userId}`)
        .expect(200);

      expect(verifyResponse.body.name).toBe('Updated Integration User');

      // Delete
      await request(app)
        .delete(`/api/users/${userId}`)
        .expect(200);

      // Verify deletion
      await request(app)
        .get(`/api/users/${userId}`)
        .expect(404);

      // Remove from cleanup list since we already deleted it
      createdUserIds = createdUserIds.filter(id => id !== userId);
    });
  });
});

