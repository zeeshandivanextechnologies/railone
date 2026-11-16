import { pool } from '../config/db.js';

async function migrateProfile() {
  try {
    await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS gender VARCHAR(10) DEFAULT 'M'");
    await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS city VARCHAR(100)");
    await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS state VARCHAR(100)");
    await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS pincode VARCHAR(10)");

    await pool.query(`
      CREATE TABLE IF NOT EXISTS master_passengers (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(150) NOT NULL,
        age INT NOT NULL,
        gender VARCHAR(10) NOT NULL,
        berth_preference VARCHAR(50) DEFAULT 'No Preference',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log("Migration profile & master_passengers OK");
    process.exit(0);
  } catch (err) {
    console.error("Migration err:", err);
    process.exit(1);
  }
}

migrateProfile();
