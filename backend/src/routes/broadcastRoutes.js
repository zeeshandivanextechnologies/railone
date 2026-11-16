import express from 'express';
import { pool } from '../config/db.js';

const router = express.Router();

// 1. GET ALL BROADCASTS
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM broadcasts ORDER BY created_at DESC');
    const broadcasts = result.rows.map(b => ({
      id: b.id,
      type: b.type,
      headline: b.headline,
      message: b.message,
      zone: b.zone,
      postedAt: b.created_at
    }));
    res.json(broadcasts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. DISPATCH BROADCAST (Admin)
router.post('/', async (req, res) => {
  try {
    const { id, type, headline, message, zone } = req.body;
    const query = `
      INSERT INTO broadcasts (id, type, headline, message, zone)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const result = await pool.query(query, [id, type, headline, message, zone || 'ALL_INDIA']);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

