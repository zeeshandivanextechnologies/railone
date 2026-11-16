import express from 'express';
import { pool } from '../config/db.js';

const router = express.Router();

// 1. GET ALL TRAINS
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM trains ORDER BY number ASC');
    // Map db columns to camelCase for frontend compatibility
    const trains = result.rows.map(t => ({
      id: t.id,
      number: t.number,
      name: t.name,
      from: t.from,
      to: t.to,
      departure: t.departure,
      arrival: t.arrival,
      type: t.type,
      zone: t.zone,
      status: t.status,
      currentLocation: t.current_location,
      platform: t.platform,
      delayMinutes: t.delay_minutes,
      speedKmph: t.speed_kmph,
      occupancyPercent: t.occupancy_percent,
      rakes: t.rakes,
      pantryVendor: t.pantry_vendor
    }));
    res.json(trains);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. CREATE NEW TRAIN (ADMIN)
router.post('/', async (req, res) => {
  try {
    const { 
      number, name, from, to, departure, arrival, 
      type, zone, rakes, pantryVendor, currentLocation, platform 
    } = req.body;

    const id = number;
    const query = `
      INSERT INTO trains (id, number, name, "from", "to", departure, arrival, type, zone, rakes, pantry_vendor, current_location, platform)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;
    const values = [
      id, number, name, from, to, departure, arrival, 
      type || 'EXPRESS', zone || 'NR', rakes || 16, 
      pantryVendor || 'IRCTC', currentLocation || `${from} Yard`, platform || 'PF 1'
    ];

    const result = await pool.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. UPDATE LIVE GPS DELAY OVERRIDE (ADMIN)
router.patch('/:number/live', async (req, res) => {
  try {
    const { number } = req.params;
    const { currentLocation, delayMinutes, platform, speedKmph, status } = req.body;

    const query = `
      UPDATE trains 
      SET 
        current_location = COALESCE($1, current_location),
        delay_minutes = COALESCE($2, delay_minutes),
        platform = COALESCE($3, platform),
        speed_kmph = COALESCE($4, speed_kmph),
        status = COALESCE($5, status)
      WHERE number = $6
      RETURNING *
    `;
    const result = await pool.query(query, [currentLocation, delayMinutes, platform, speedKmph, status, number]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Train not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. DELETE / DECOMMISSION TRAIN
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM trains WHERE id = $1', [id]);
    res.json({ message: 'Train service deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

