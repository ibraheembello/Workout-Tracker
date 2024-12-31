// src/database/init.js
const db = require('./db');
const fs = require('fs').promises;
const path = require('path');

async function initializeDatabase() {
  try {
    // Read schema file
    const schema = await fs.readFile(
      path.join(__dirname, 'schema.sql'),
      'utf8'
    );

    // Execute schema
    await db.query(schema);
    
    // Run seeders
    const seedExercises = require('./seeders/exerciseSeeder');
    await seedExercises();

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  } finally {
    await db.pool.end();
  }
}

if (require.main === module) {
  initializeDatabase();
}

module.exports = initializeDatabase;