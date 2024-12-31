const request = require('supertest');
const app = require('../src/index');
const db = require('../src/database/db');
const { generateToken } = require('../src/utils/jwt');

let authToken;
let testUserId;
let testWorkoutId;

beforeAll(async () => {
  // Create test user
  const userResult = await db.query(
    'INSERT INTO users (email, password_hash, full_name) VALUES ($1, $2, $3) RETURNING id',
    ['test@test.com', 'hashedpassword', 'Test User']
  );
  testUserId = userResult.rows[0].id;
  authToken = generateToken({ id: testUserId, email: 'test@test.com' });
});

describe('Workout Routes', () => {
  test('Create workout plan', async () => {
    const response = await request(app)
      .post('/api/workouts')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Test Workout',
        description: 'Test Description',
        exercises: [
          {
            exerciseId: 1,
            sets: 3,
            reps: 10,
            weight: 50,
            notes: 'Test note'
          }
        ]
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    testWorkoutId = response.body.id;
  });

  test('Get workouts list', async () => {
    const response = await request(app)
      .get('/api/workouts')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
  });

  test('Update workout plan', async () => {
    const response = await request(app)
      .put(`/api/workouts/${testWorkoutId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Updated Workout',
        description: 'Updated Description',
        exercises: [
          {
            exerciseId: 1,
            sets: 4,
            reps: 12,
            weight: 55,
            notes: 'Updated note'
          }
        ]
      });

    expect(response.status).toBe(200);
  });

  test('Delete workout plan', async () => {
    const response = await request(app)
      .delete(`/api/workouts/${testWorkoutId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
  });
});

afterAll(async () => {
  // Clean up test data
  await db.query('DELETE FROM users WHERE id = $1', [testUserId]);
  await db.pool.end();
});
