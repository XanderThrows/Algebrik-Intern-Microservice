const request = require('supertest');
const app = require('../server');

describe('POST /api/math/verify-sum', () => {
  describe('Successful verification', () => {
    test('should return correct=true when sum matches expected result', async () => {
      const response = await request(app)
        .post('/api/math/verify-sum')
        .send({
          num1: 5,
          num2: 3,
          expectedResult: 8
        })
        .expect(200);

      expect(response.body).toHaveProperty('correct', true);
      expect(response.body).toHaveProperty('num1', 5);
      expect(response.body).toHaveProperty('num2', 3);
      expect(response.body).toHaveProperty('actualSum', 8);
      expect(response.body).toHaveProperty('expectedResult', 8);
      expect(response.body.message).toContain('Correct');
    });

    test('should return correct=true when sum matches expected result', async () => {
        const response = await request(app)
          .post('/api/math/verify-sum')
          .send({
            num1: 6,
            num2: 3,
            expectedResult: 20
          })
          .expect(200);
  
        expect(response.body).toHaveProperty('correct', true);
        expect(response.body).toHaveProperty('num1', 6);
        expect(response.body).toHaveProperty('num2', 3);
        expect(response.body).toHaveProperty('actualSum', 9);
        expect(response.body).toHaveProperty('expectedResult', 20);
        expect(response.body.message).toContain('Correct');
      });

    test('should handle negative numbers correctly', async () => {
      const response = await request(app)
        .post('/api/math/verify-sum')
        .send({
          num1: -5,
          num2: 3,
          expectedResult: -2
        })
        .expect(200);

      expect(response.body.correct).toBe(true);
      expect(response.body.actualSum).toBe(-2);
    });

    test('should handle zero correctly', async () => {
      const response = await request(app)
        .post('/api/math/verify-sum')
        .send({
          num1: 0,
          num2: 0,
          expectedResult: 0
        })
        .expect(200);

      expect(response.body.correct).toBe(true);
      expect(response.body.actualSum).toBe(0);
    });

    test('should handle decimal numbers correctly', async () => {
      const response = await request(app)
        .post('/api/math/verify-sum')
        .send({
          num1: 2.5,
          num2: 3.7,
          expectedResult: 6.2
        })
        .expect(200);

      expect(response.body.correct).toBe(true);
      expect(response.body.actualSum).toBeCloseTo(6.2);
    });

    test('should handle large numbers', async () => {
      const response = await request(app)
        .post('/api/math/verify-sum')
        .send({
          num1: 1000000,
          num2: 2000000,
          expectedResult: 3000000
        })
        .expect(200);

      expect(response.body.correct).toBe(true);
      expect(response.body.actualSum).toBe(3000000);
    });
  });

  describe('Incorrect verification', () => {
    test('should return correct=false when sum does not match expected result', async () => {
      const response = await request(app)
        .post('/api/math/verify-sum')
        .send({
          num1: 5,
          num2: 3,
          expectedResult: 9
        })
        .expect(200);

      expect(response.body).toHaveProperty('correct', false);
      expect(response.body).toHaveProperty('actualSum', 8);
      expect(response.body).toHaveProperty('expectedResult', 9);
      expect(response.body.message).toContain('Incorrect');
    });
  });

  describe('Input validation', () => {
    test('should return 400 when num1 is missing', async () => {
      const response = await request(app)
        .post('/api/math/verify-sum')
        .send({
          num2: 3,
          expectedResult: 8
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Missing required fields');
    });

    test('should return 400 when num2 is missing', async () => {
      const response = await request(app)
        .post('/api/math/verify-sum')
        .send({
          num1: 5,
          expectedResult: 8
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Missing required fields');
    });

    test('should return 400 when expectedResult is missing', async () => {
      const response = await request(app)
        .post('/api/math/verify-sum')
        .send({
          num1: 5,
          num2: 3
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Missing required fields');
    });

    test('should return 400 when num1 is not a number', async () => {
      const response = await request(app)
        .post('/api/math/verify-sum')
        .send({
          num1: 'not a number',
          num2: 3,
          expectedResult: 8
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('All fields must be numbers');
    });

    test('should return 400 when num2 is not a number', async () => {
      const response = await request(app)
        .post('/api/math/verify-sum')
        .send({
          num1: 5,
          num2: 'not a number',
          expectedResult: 8
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('All fields must be numbers');
    });

    test('should return 400 when expectedResult is not a number', async () => {
      const response = await request(app)
        .post('/api/math/verify-sum')
        .send({
          num1: 5,
          num2: 3,
          expectedResult: 'not a number'
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('All fields must be numbers');
    });

    test('should return 400 when num1 is null', async () => {
      const response = await request(app)
        .post('/api/math/verify-sum')
        .send({
          num1: null,
          num2: 3,
          expectedResult: 8
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('All fields must be numbers');
    });

    test('should return 400 when field is undefined (not just missing)', async () => {
      const response = await request(app)
        .post('/api/math/verify-sum')
        .send({
          num1: undefined,
          num2: 3,
          expectedResult: 8
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Edge cases', () => {
    test('should handle very small decimal numbers', async () => {
      const response = await request(app)
        .post('/api/math/verify-sum')
        .send({
          num1: 0.1,
          num2: 0.2,
          expectedResult: 0.3
        })
        .expect(200);

      // Using epsilon comparison, this should pass
      expect(response.body.correct).toBe(true);
    });

    test('should handle negative expected result', async () => {
      const response = await request(app)
        .post('/api/math/verify-sum')
        .send({
          num1: -10,
          num2: 5,
          expectedResult: -5
        })
        .expect(200);

      expect(response.body.correct).toBe(true);
      expect(response.body.actualSum).toBe(-5);
    });

    test('should handle one negative and one positive number', async () => {
      const response = await request(app)
        .post('/api/math/verify-sum')
        .send({
          num1: 10,
          num2: -3,
          expectedResult: 7
        })
        .expect(200);

      expect(response.body.correct).toBe(true);
      expect(response.body.actualSum).toBe(7);
    });
  });
});

