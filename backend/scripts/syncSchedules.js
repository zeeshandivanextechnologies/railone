import { pool } from '../config/db.js';

const API_KEY = 'rk_live_sEvoQpxAue5NV-jlQmlFFdtCYa9NE1od';
const BASE_URL = 'https://ir.railcore.tech/v1';

// Popular trains to index schedules for instant cross-station route search
const popularTrains = [
  '12015', '12016', '12413', '12414', '20977', '20978', '12985', '12986',
  '12951', '12952', '12953', '12954', '12955', '12956', '12919', '12920',
  '12001', '12002', '12003', '12004', '12005', '12006', '12011', '12012',
  '22415', '22416', '22435', '22436', '12301', '12302', '12305', '12306',
  '12049', '12050', '12059', '12060', '12423', '12424', '12621', '12622',
  '12625', '12626', '12259', '12260', '12903', '12904', '12909', '12910',
  '12137', '12138', '12309', '12310', '12313', '12314', '12431', '12432',
  '12555', '12556', '12559', '12560', '12565', '12566', '12801', '12802'
];

async function syncPopularSchedules() {
  console.log('[Schedule Sync] Fetching route schedules from RailCore API...');
  let totalHalts = 0;

  for (const tNum of popularTrains) {
    try {
      const res = await fetch(`${BASE_URL}/trains/${tNum}/schedule`, {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Accept': 'application/json'
        }
      });
      const data = await res.json();
      if (data.success && data.data && data.data.stops) {
        const train = data.data;

        // Ensure train exists in trains table
        await pool.query(
          `INSERT INTO trains (
            id, number, name, "from", "to", departure, arrival, type, zone, status, current_location, platform, delay_minutes, speed_kmph, occupancy_percent, rakes
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
          ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, "from" = EXCLUDED."from", "to" = EXCLUDED."to"`,
          [
            tNum,
            tNum,
            train.train_name,
            train.source_station_code,
            train.destination_station_code,
            train.stops[0]?.departure_time || '06:00',
            train.stops[train.stops.length - 1]?.arrival_time || '20:00',
            train.train_name.includes('Shatabdi') ? 'SHATABDI' : (train.train_name.includes('Rajdhani') ? 'RAJDHANI' : 'SUPERFAST'),
            'IR',
            'Active',
            `${train.source_station_code} Yard`,
            'PF 1',
            0,
            110,
            85,
            22
          ]
        ).catch(() => {});

        // Insert stops
        for (const stop of train.stops) {
          if (!stop.station_code) continue;
          await pool.query(
            `INSERT INTO train_station_halts (
              train_number, station_code, sequence, arrival, departure, day
            ) VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (train_number, station_code) DO UPDATE
            SET sequence = EXCLUDED.sequence, arrival = EXCLUDED.arrival, departure = EXCLUDED.departure`,
            [
              tNum,
              stop.station_code.toUpperCase(),
              stop.sequence || 1,
              stop.arrival_time || stop.departure_time || '00:00',
              stop.departure_time || stop.arrival_time || '00:00',
              stop.day || 1
            ]
          ).catch(() => {});
          totalHalts++;
        }
      }
    } catch (e) {
      console.warn(`[Schedule Sync] Failed for ${tNum}:`, e.message);
    }
  }

  console.log(`[Schedule Sync] Finished! Inserted/Updated ${totalHalts} stops into database.`);
  await pool.end();
}

syncPopularSchedules();

