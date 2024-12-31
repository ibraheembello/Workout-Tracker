// src/database/seeders/exerciseSeeder.js
const db = require('../db');

const categories = [
  { name: 'Strength', description: 'Exercises focused on building muscle strength' },
  { name: 'Cardio', description: 'Exercises focused on cardiovascular fitness' },
  { name: 'Flexibility', description: 'Exercises focused on improving flexibility' }
];

const exercises = [
  {
    name: 'Bench Press',
    description: 'A compound exercise that works the chest, shoulders, and triceps',
    category: 'Strength'
  },
  {
    name: 'Squats',
    description: 'A compound exercise that primarily targets the legs and core',
    category: 'Strength'
  },
  {
    name: 'Running',
    description: 'Cardiovascular exercise that can be done at various intensities',
    category: 'Cardio'
  },
  {
    name: 'Yoga Flow',
    description: 'A series of poses that improve flexibility and balance',
    category: 'Flexibility'
  }
  // Add more exercises as needed
];

async function seedExercises() {
  try {
    // Insert categories
    for (const category of categories) {
      await db.query(
        'INSERT INTO exercise_categories (name, description) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING',
        [category.name, category.description]
      );
    }

    // Get category IDs
    const categoryResults = await db.query('SELECT id, name FROM exercise_categories');
    const categoryMap = {};
    categoryResults.rows.forEach(cat => {
      categoryMap[cat.name] = cat.id;
    });

    // Insert exercises
    for (const exercise of exercises) {
      await db.query(
        'INSERT INTO exercises (name, description, category_id) VALUES ($1, $2, $3) ON CONFLICT (name) DO NOTHING',
        [exercise.name, exercise.description, categoryMap[exercise.category]]
      );
    }

    console.log('Exercise data seeded successfully');
  } catch (error) {
    console.error('Error seeding exercise data:', error);
    throw error;
  }
}

module.exports = seedExercises;