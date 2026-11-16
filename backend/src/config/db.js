import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

// Initial pool pointing to default 'postgres' database to ensure 'railone_db' exists
export const adminPool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'admin',
  database: 'postgres'
});

// App pool pointing to 'railone_db'
export const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'admin',
  database: process.env.DB_NAME || 'railone_db'
});

export const initDB = async () => {
  try {
    // 1. Check if railone_db exists, create if not
    const dbCheck = await adminPool.query(
      `SELECT 1 FROM pg_database WHERE datname = 'railone_db'`
    );
    if (dbCheck.rows.length === 0) {
      await adminPool.query(`CREATE DATABASE railone_db`);
      console.log(' PostgreSQL Database "railone_db" created successfully.');
    } else {
      console.log(' PostgreSQL Database "railone_db" already exists.');
    }

    // 2. Initialize Tables in railone_db
    await pool.query(`
      CREATE TABLE IF NOT EXISTS trains (
        id VARCHAR(50) PRIMARY KEY,
        number VARCHAR(20) UNIQUE NOT NULL,
        name VARCHAR(150) NOT NULL,
        "from" VARCHAR(50) NOT NULL,
        "to" VARCHAR(50) NOT NULL,
        departure VARCHAR(20) NOT NULL,
        arrival VARCHAR(20) NOT NULL,
        type VARCHAR(50) DEFAULT 'EXPRESS',
        zone VARCHAR(20) DEFAULT 'NR',
        status VARCHAR(50) DEFAULT 'ON_TIME',
        current_location VARCHAR(150) DEFAULT 'Starting Station',
        platform VARCHAR(20) DEFAULT 'PF 1',
        delay_minutes INT DEFAULT 0,
        speed_kmph INT DEFAULT 110,
        occupancy_percent INT DEFAULT 90,
        rakes INT DEFAULT 16,
        pantry_vendor VARCHAR(150) DEFAULT 'IRCTC Kitchen',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS bookings (
        id SERIAL PRIMARY KEY,
        pnr VARCHAR(50) UNIQUE NOT NULL,
        train_number VARCHAR(20),
        train_name VARCHAR(150),
        passenger_name VARCHAR(150) NOT NULL,
        "from" VARCHAR(50) NOT NULL,
        "to" VARCHAR(50) NOT NULL,
        class_type VARCHAR(50) DEFAULT '3A',
        fare NUMERIC(10, 2) DEFAULT 0,
        payment_method VARCHAR(50) DEFAULT 'UPI',
        status VARCHAR(50) DEFAULT 'CONFIRMED',
        ticket_type VARCHAR(50) DEFAULT 'RESERVED',
        coach VARCHAR(20) DEFAULT 'B2',
        seat VARCHAR(20) DEFAULT '23 (MB)',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS grievances (
        id VARCHAR(50) PRIMARY KEY,
        pnr VARCHAR(50),
        train VARCHAR(150),
        coach VARCHAR(50),
        category VARCHAR(100) NOT NULL,
        reported_by VARCHAR(150),
        priority VARCHAR(20) DEFAULT 'MEDIUM',
        status VARCHAR(50) DEFAULT 'ASSIGNED',
        assigned_to VARCHAR(150) DEFAULT 'Train Captain',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS broadcasts (
        id VARCHAR(50) PRIMARY KEY,
        type VARCHAR(50) NOT NULL,
        headline TEXT NOT NULL,
        message TEXT,
        zone VARCHAR(50) DEFAULT 'ALL_INDIA',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. Seed Initial Data if table empty
    const trainCount = await pool.query(`SELECT count(*) FROM trains`);
    if (parseInt(trainCount.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO trains (id, number, name, "from", "to", departure, arrival, type, zone, status, current_location, platform, delay_minutes, speed_kmph, occupancy_percent, rakes, pantry_vendor)
        VALUES 
        ('12952', '12952', 'Mumbai Rajdhani Express', 'NDLS', 'MMCT', '16:55', '08:35', 'RAJDHANI', 'WR', 'ON_TIME', 'Kota Jn (KOTA)', 'PF 1', 0, 128, 96, 22, 'IRCTC / Haldiram''s'),
        ('22436', '22436', 'Vande Bharat Express', 'NDLS', 'CNB', '06:00', '10:08', 'VANDE_BHARAT', 'NCR', 'SLIGHT_DELAY', 'Approaching Aligarh Jn', 'PF 3', 6, 135, 100, 16, 'Chai Point & Meals'),
        ('12004', '12004', 'Lucknow Shatabdi', 'NDLS', 'LKO', '06:10', '12:40', 'SHATABDI', 'NR', 'ON_TIME', 'Moradabad Jn', 'PF 2', 0, 110, 88, 14, 'IRCTC Kitchen'),
        ('12302', '12302', 'Howrah Rajdhani Express', 'NDLS', 'HWH', '16:50', '09:55', 'RAJDHANI', 'ER', 'DELAYED', 'Kanpur Central (CNB)', 'PF 4', 28, 95, 94, 21, 'Haldiram''s & Amul');
      `);
      console.log(' Seeded initial trains data in PostgreSQL.');
    }

    const bookingCount = await pool.query(`SELECT count(*) FROM bookings`);
    if (parseInt(bookingCount.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO bookings (pnr, train_number, train_name, passenger_name, "from", "to", class_type, fare, payment_method, status, ticket_type, coach, seat)
        VALUES 
        ('2847193021', '12952', 'Mumbai Rajdhani', 'Rahul Sharma', 'NDLS', 'MMCT', '3A', 2150, 'R-WALLET', 'CONFIRMED', 'RESERVED', 'B2', '23 (MB)'),
        ('UTS84719201', 'SUBURBAN', 'UTS General Suburban Pass', 'Vikas Mehra', 'NDLS', 'CNB', 'GEN (II)', 45, 'R-WALLET (3% Off)', 'ACTIVE_PASS', 'UTS UNRESERVED', 'GS', 'Unreserved'),
        ('UTS91820412', 'PLATFORM', 'Platform Entry Pass (2h)', 'Deepak Patel', 'NDLS', 'NDLS', 'PLATFORM', 10, 'UPI', 'VALID_NOW', 'PLATFORM', 'NA', 'Platform Access');
      `);
      console.log(' Seeded initial bookings data in PostgreSQL.');
    }

    const grievanceCount = await pool.query(`SELECT count(*) FROM grievances`);
    if (parseInt(grievanceCount.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO grievances (id, pnr, train, coach, category, reported_by, priority, status, assigned_to)
        VALUES 
        ('RM-202611-9481', '2847193021', '12952 - Mumbai Rajdhani', 'B2-23', 'Coach Cleanliness', 'Rahul Sharma (+91 9876543210)', 'HIGH', 'ASSIGNED', 'OBHS Captain - Kota Division'),
        ('RM-202611-9310', '1892048192', '22436 - Vande Bharat', 'C2-14', 'Electrical / AC Cooling', 'Amit Verma (+91 9123456780)', 'MEDIUM', 'RESOLVED', 'Electrical Wing - Aligarh'),
        ('RM-202611-8911', '7481920481', '12302 - Howrah Rajdhani', 'S4-48', 'RPF Security Help', 'Sunita Roy (+91 9988776655)', 'CRITICAL', 'IN_PROGRESS', 'RPF Flying Squad CNB');
      `);
      console.log(' Seeded initial grievances data in PostgreSQL.');
    }

    const broadcastCount = await pool.query(`SELECT count(*) FROM broadcasts`);
    if (parseInt(broadcastCount.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO broadcasts (id, type, headline, message, zone)
        VALUES 
        ('ALT-9081', 'FOG / WINTER', 'Dense Fog Alert across Northern & North Central Railway', 'Speed restricted to 60 km/h in fog sections.', 'NR, NCR, NER'),
        ('ALT-8842', 'SAFETY ADVISORY', 'Track Maintenance Block between Mathura and Agra Cantt', 'Scheduled safety inspections.', 'NCR');
      `);
      console.log(' Seeded initial broadcasts data in PostgreSQL.');
    }

    console.log(' PostgreSQL Database Tables Initialized Successfully!');
  } catch (error) {
    console.error('❌ Error initializing PostgreSQL Database:', error.message);
  }
};

