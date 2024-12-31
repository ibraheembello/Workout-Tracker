// src/routes/workouts.js
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const db = require('../database/db');

/**
 * @swagger
 * /api/workouts:
 *   post:
 *     tags: [Workouts]
 *     summary: Create a new workout plan
 *     security:
 *       - bearerAuth: []
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, description, exercises } = req.body;
    
    // Start transaction
    await db.query('BEGIN');

    // Create workout plan
    const workoutResult = await db.query(
      'INSERT INTO workout_plans (user_id, name, description) VALUES ($1, $2, $3) RETURNING id',
      [req.user.id, name, description]
    );

    const workoutId = workoutResult.rows[0].id;

    // Add exercises to workout
    for (let i = 0; i < exercises.length; i++) {
      const exercise = exercises[i];
      await db.query(
        `INSERT INTO workout_exercises 
        (workout_plan_id, exercise_id, sets, reps, weight, notes, order_index)
        VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [workoutId, exercise.exerciseId, exercise.sets, exercise.reps, 
         exercise.weight, exercise.notes, i]
      );
    }

    await db.query('COMMIT');
    res.status(201).json({ id: workoutId, message: 'Workout plan created' });
  } catch (error) {
    await db.query('ROLLBACK');
    res.status(500).json({ error: 'Error creating workout plan' });
  }
});

/**
 * @swagger
 * /api/workouts/{id}:
 *   put:
 *     tags: [Workouts]
 *     summary: Update a workout plan
 *     security:
 *       - bearerAuth: []
 */
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { name, description, exercises } = req.body;
    const workoutId = req.params.id;

    // Verify ownership
    const workoutCheck = await db.query(
      'SELECT * FROM workout_plans WHERE id = $1 AND user_id = $2',
      [workoutId, req.user.id]
    );

    if (workoutCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Workout plan not found' });
    }

    await db.query('BEGIN');

    // Update workout plan
    await db.query(
      'UPDATE workout_plans SET name = $1, description = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
      [name, description, workoutId]
    );

    // Delete existing exercises
    await db.query('DELETE FROM workout_exercises WHERE workout_plan_id = $1', [workoutId]);

    // Add updated exercises
    for (let i = 0; i < exercises.length; i++) {
      const exercise = exercises[i];
      await db.query(
        `INSERT INTO workout_exercises 
        (workout_plan_id, exercise_id, sets, reps, weight, notes, order_index)
        VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [workoutId, exercise.exerciseId, exercise.sets, exercise.reps, 
         exercise.weight, exercise.notes, i]
      );
    }

    await db.query('COMMIT');
    res.json({ message: 'Workout plan updated' });
  } catch (error) {
    await db.query('ROLLBACK');
    res.status(500).json({ error: 'Error updating workout plan' });
  }
});

/**
 * @swagger
 * /api/workouts/schedule:
 *   post:
 *     tags: [Workouts]
 *     summary: Schedule a workout
 *     security:
 *       - bearerAuth: []
 */
router.post('/schedule', authenticateToken, async (req, res) => {
  try {
    const { workoutPlanId, scheduledFor, notes } = req.body;

    const result = await db.query(
      `INSERT INTO scheduled_workouts 
      (workout_plan_id, user_id, scheduled_for, notes)
      VALUES ($1, $2, $3, $4)
      RETURNING id`,
      [workoutPlanId, req.user.id, scheduledFor, notes]
    );

    res.status(201).json({
      id: result.rows[0].id,
      message: 'Workout scheduled successfully'
    });
  } catch (error) {
    res.status(500).json({ error: 'Error scheduling workout' });
  }
});

/**
 * @swagger
 * /api/workouts/log:
 *   post:
 *     tags: [Workouts]
 *     summary: Log a completed workout
 *     security:
 *       - bearerAuth: []
 */
router.post('/log', authenticateToken, async (req, res) => {
  try {
    const { scheduledWorkoutId, exercises } = req.body;

    await db.query('BEGIN');

    // Update scheduled workout status
    await db.query(
      `UPDATE scheduled_workouts 
      SET status = 'completed', completed_at = CURRENT_TIMESTAMP 
      WHERE id = $1 AND user_id = $2`,
      [scheduledWorkoutId, req.user.id]
    );

    // Log individual exercises
    for (const exercise of exercises) {
      await db.query(
        `INSERT INTO workout_logs 
        (scheduled_workout_id, exercise_id, sets_completed, reps_completed, 
         weight_used, notes)
        VALUES ($1, $2, $3, $4, $5, $6)`,
        [scheduledWorkoutId, exercise.exerciseId, exercise.setsCompleted,
         exercise.repsCompleted, exercise.weightUsed, exercise.notes]
      );
    }

    await db.query('COMMIT');
    res.json({ message: 'Workout logged successfully' });
  } catch (error) {
    await db.query('ROLLBACK');
    res.status(500).json({ error: 'Error logging workout' });
  }
});

/**
 * @swagger
 * /api/workouts/progress:
 *   get:
 *     tags: [Workouts]
 *     summary: Get workout progress report
 *     security:
 *       - bearerAuth: []
 */
router.get('/progress', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(`
      WITH completed_workouts AS (
        SELECT 
          sw.id,
          wp.name as workout_name,
          sw.completed_at,
          COUNT(wl.id) as exercises_completed,
          STRING_AGG(DISTINCT e.name, ', ') as exercises
        FROM scheduled_workouts sw
        JOIN workout_plans wp ON sw.workout_plan_id = wp.id
        JOIN workout_logs wl ON sw.id = wl.scheduled_workout_id
        JOIN exercises e ON wl.exercise_id = e.id
        WHERE sw.user_id = $1 AND sw.status = 'completed'
        GROUP BY sw.id, wp.name, sw.completed_at
        ORDER BY sw.completed_at DESC
        LIMIT 10
      )
      SELECT 
        *,
        (SELECT COUNT(*) FROM scheduled_workouts 
         WHERE user_id = $1 AND status = 'completed') as total_workouts,
        (SELECT COUNT(*) FROM workout_logs wl
         JOIN scheduled_workouts sw ON wl.scheduled_workout_id = sw.id
         WHERE sw.user_id = $1) as total_exercises_completed
      FROM completed_workouts
    `, [req.user.id]);

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Error generating progress report' });
  }
});

/**
 * @swagger
 * /api/workouts:
 *   get:
 *     tags: [Workouts]
 *     summary: List all workouts for the user
 *     security:
 *       - bearerAuth: []
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        wp.*,
        json_agg(
          json_build_object(
            'id', we.id,
            'exercise_id', we.exercise_id,
            'exercise_name', e.name,
            'sets', we.sets,
            'reps', we.reps,
            'weight', we.weight,
            'notes', we.notes,
            'order_index', we.order_index
          )
        ) as exercises
      FROM workout_plans wp
      LEFT JOIN workout_exercises we ON wp.id = we.workout_plan_id
      LEFT JOIN exercises e ON we.exercise_id = e.id
      WHERE wp.user_id = $1
      GROUP BY wp.id
      ORDER BY wp.created_at DESC
    `, [req.user.id]);
    
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching workouts' });
  }
});

/**
 * @swagger
 * /api/workouts/{id}:
 *   delete:
 *     tags: [Workouts]
 *     summary: Delete a workout plan
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const workoutId = req.params.id;

    // Verify ownership
    const workoutCheck = await db.query(
      'SELECT * FROM workout_plans WHERE id = $1 AND user_id = $2',
      [workoutId, req.user.id]
    );

    if (workoutCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Workout plan not found' });
    }

    // Delete workout (cascade will handle related records)
    await db.query('DELETE FROM workout_plans WHERE id = $1', [workoutId]);
    
    res.json({ message: 'Workout plan deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting workout plan' });
  }
});

module.exports = router;