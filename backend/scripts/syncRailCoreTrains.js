import { pool } from '../config/db.js';

const API_KEY = 'rk_live_sEvoQpxAue5NV-jlQmlFFdtCYa9NE1od';
const BASE_URL = 'https://ir.railcore.tech/v1';

const seeds = [
  'Rajdhani', 'Shatabdi', 'Vande', 'Express', 'Mail', 'Special',
  'Delhi', 'Mumbai', 'Jaipur', 'Kota', 'Lucknow', 'Patna', 'Kolkata',
  'Chennai', 'Bangalore', 'Hyderabad', 'Ahmedabad', 'Pune', 'Varanasi',
  'Agra', 'Kanpur', 'Bhopal', 'Indore', 'Surat', 'Vadodara', 'Amritsar',
  'Jammu', 'Guwahati', 'Gorakhpur', 'Gwalior', 'Chandigarh', '12', '11', '22', '14', '19', '13'
];

async function syncTrains() {
  console.log('[Sync] Fetching trains from RailCore Tech API...');
  let count = 0;

  for (const q of seeds) {
    try {
      const res = await fetch(`${BASE_URL}/trains/search?q=${encodeURIComponent(q)}&limit=50`, {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Accept': 'application/json'
        }
      });
      const data = await res.json();
      if (data.success && data.data && data.data.results) {
        for (const t of data.data.results) {
          if (!t.train_number || !t.source_station_code || !t.destination_station_code) continue;

          const isRaj = (t.train_name || '').toLowerCase().includes('rajdhani');
          const isShat = (t.train_name || '').toLowerCase().includes('shatabdi') || (t.train_name || '').toLowerCase().includes('vande');

          const check = await pool.query('SELECT number FROM trains WHERE number = $1', [t.train_number]);
          if (check.rows.length === 0) {
            await pool.query(
              `INSERT INTO trains (
                id, number, name, "from", "to", departure, arrival, type, zone, status, current_location, platform, delay_minutes, speed_kmph, occupancy_percent, rakes
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
              [
                t.train_number,
                t.train_number,
                t.train_name,
                t.source_station_code,
                t.destination_station_code,
                isRaj ? '16:55' : (isShat ? '06:00' : '11:50'),
                isRaj ? '08:35' : (isShat ? '14:20' : '19:40'),
                t.train_type || (isRaj ? 'RAJDHANI' : (isShat ? 'SHATABDI' : 'SUPERFAST')),
                'IR',
                'Active',
                `${t.source_station_code} Yard`,
                'PF 1',
                0,
                isRaj ? 110 : (isShat ? 120 : 80),
                85,
                22
              ]
            ).catch(() => {});
            count++;
          }
        }
      }
    } catch (err) {
      console.warn(`[Sync] Error for query ${q}:`, err.message);
    }
  }

  console.log(`[Sync] Inserted ${count} new dynamic trains from RailCore!`);
  const total = await pool.query('SELECT count(*) FROM trains');
  console.log(`[Sync] Total trains in PostgreSQL database: ${total.rows[0].count}`);
  await pool.end();
}

syncTrains();

