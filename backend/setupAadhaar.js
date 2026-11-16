import { pool } from './config/db.js';

async function setup() {
  try {
    await pool.query("ALTER TABLE master_passengers ADD COLUMN IF NOT EXISTS dob VARCHAR(20);");
    await pool.query("ALTER TABLE master_passengers ADD COLUMN IF NOT EXISTS concession_type VARCHAR(50) DEFAULT 'None';");
    await pool.query("ALTER TABLE master_passengers ADD COLUMN IF NOT EXISTS meal_preference VARCHAR(50) DEFAULT 'No Preference';");
    await pool.query("ALTER TABLE master_passengers ADD COLUMN IF NOT EXISTS id_card_type VARCHAR(50) DEFAULT 'Aadhaar Card';");
    await pool.query("ALTER TABLE master_passengers ADD COLUMN IF NOT EXISTS id_card_number VARCHAR(100);");
    await pool.query("ALTER TABLE master_passengers ADD COLUMN IF NOT EXISTS is_id_verified BOOLEAN DEFAULT FALSE;");

    await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS aadhaar_number VARCHAR(20);");
    await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_aadhaar_verified BOOLEAN DEFAULT FALSE;");
    await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS dob VARCHAR(20);");

    await pool.query(`
      CREATE TABLE IF NOT EXISTS mock_aadhaar_directory (
        aadhaar_number VARCHAR(20) PRIMARY KEY,
        full_name VARCHAR(150) NOT NULL,
        dob VARCHAR(20) NOT NULL,
        gender VARCHAR(10) NOT NULL,
        city VARCHAR(100),
        state VARCHAR(100)
      );
    `);

    await pool.query(`
      INSERT INTO mock_aadhaar_directory (aadhaar_number, full_name, dob, gender, city, state)
      VALUES 
        ('829081863212', 'Zeeshan Ansari', '1998-05-14', 'M', 'New Delhi', 'Delhi'),
        ('123456789012', 'Rahul Sharma', '1995-08-21', 'M', 'Mumbai', 'Maharashtra'),
        ('987654321098', 'Priya Patel', '2000-11-05', 'F', 'Ahmedabad', 'Gujarat')
      ON CONFLICT (aadhaar_number) DO NOTHING;
    `);

    console.log('SUCCESS_SETUP_AADHAAR');
    process.exit(0);
  } catch (err) {
    console.error('ERROR_SETUP:', err);
    process.exit(1);
  }
}

setup();
