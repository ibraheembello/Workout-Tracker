// src/__tests__/auth.test.js
const request = require('supertest');
const app = require('../index');
const db = require('../database/db');

beforeAll(async () => {
  // Setup test database
  await db.query('DELETE FROM users');
});

afterAll(async () => {
  await db.pool.end();
});

describe('Authentication Endpoints', () => {
  it('should register a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        password: 'password123',
        fullName: 'Test User'
      });
    
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user).toHaveProperty('email', 'test@example.com');
  });

  it('should login existing user', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });
    
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
  });
});

// src/__tests__/workouts.test.js
const request = require('supertest');
const app = require('../index');
const db = require('../database/db');

let authToken;
let workoutId;

beforeAll(async () => {
  // Setup test user and get token
  const res = await request(app)
    .post('/api/auth/login')
    .send({
      email: 'test@example.com',
      password: 'password123'
    });
  
  authToken = res.body.token;
});

describe('Workout Endpoints', () => {
  it('should create a new workout plan', async () => {
    const res = await request(app)
      .post('/api/workouts')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Test Workout',
        description: 'Test workout description',
        exercises: [
          {
            exerciseId: 1,
            sets: 3,
            reps: 10,
            weight: 50,
            notes: 'Test exercise'
          }
        ]
      });
    
    expect(res.statusCode).toBe(201);
    workoutId = res.body.id;
  });

  it('should schedule a workout', async () => {
    const res = await request(app)
      .post('/api/workouts/schedule')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        workoutPlanId: workoutId,
        scheduledFor: new Date().toISOString(),
        notes: 'Test schedule'
      });
    
    expect(res.statusCode).toBe(201);
  });
});