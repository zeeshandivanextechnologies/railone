import { pool } from '../config/db.js';

async function initHalts() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS train_station_halts (
      id SERIAL PRIMARY KEY,
      train_number VARCHAR(20) NOT NULL,
      station_code VARCHAR(20) NOT NULL,
      sequence INT,
      arrival VARCHAR(10),
      departure VARCHAR(10),
      day INT DEFAULT 1,
      UNIQUE(train_number, station_code)
    );
    CREATE INDEX IF NOT EXISTS idx_train_halts_stn ON train_station_halts(station_code);
    CREATE INDEX IF NOT EXISTS idx_train_halts_trn ON train_station_halts(train_number);
  `);
  console.log('train_station_halts created successfully!');
  await pool.end();
}

initHalts();

