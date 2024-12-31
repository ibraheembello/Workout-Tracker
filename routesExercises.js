// src/routes/exercises.js
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const db = require('../database/db');

/**
 * @swagger
 * /api/exercises:
 *   get:
 *     tags: [Exercises]
 *     summary: Get all exercises
 *     security:
 *       - bearerAuth: []
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT e.*, ec.name as category_name 
      FROM exercises e 
      JOIN exercise_categories ec ON e.category_id = ec.id
      ORDER BY e.name
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching exercises' });
  }
});

/**
 * @swagger
 * /api/exercises/categories:
 *   get:
 *     tags: [Exercises]
 *     summary: Get all exercise categories
 *     security:
 *       - bearerAuth: []
 */
router.get('/categories', authenticateToken, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM exercise_categories ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching categories' });
  }
});

module.exports = router;