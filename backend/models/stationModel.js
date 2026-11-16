import { pool } from '../config/db.js';

export const initStationsTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS all_railway_stations (
      code VARCHAR(20) PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      city VARCHAR(100),
      state VARCHAR(100),
      popularity INT DEFAULT 0,
      halt_count INT DEFAULT 0,
      lat NUMERIC(10, 6),
      lng NUMERIC(10, 6),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log(' PostgreSQL All Railway Stations Table Ready.');
};
