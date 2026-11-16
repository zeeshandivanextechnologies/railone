import express from 'express';
import { pool } from '../config/db.js';

const router = express.Router();

// 1. GET ALL GRIEVANCES
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM grievances ORDER BY created_at DESC');
    const grievances = result.rows.map(g => ({
      id: g.id,
      pnr: g.pnr,
      train: g.train,
      coach: g.coach,
      category: g.category,
      reportedBy: g.reported_by,
      priority: g.priority,
      status: g.status,
      assignedTo: g.assigned_to,
      time: 'Recently'
    }));
    res.json(grievances);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. LODGE GRIEVANCE (Passenger App)
router.post('/', async (req, res) => {
  try {
    const { id, pnr, train, coach, category, reportedBy, priority } = req.body;
    const query = `
      INSERT INTO grievances (id, pnr, train, coach, category, reported_by, priority, status, assigned_to)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'ASSIGNED', 'Train Captain & OBHS')
      RETURNING *
    `;
    const result = await pool.query(query, [
      id, pnr, train, coach, category, reportedBy, priority || 'MEDIUM'
    ]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. RESOLVE / UPDATE STATUS (Admin)
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, assignedTo } = req.body;
    const query = `
      UPDATE grievances 
      SET 
        status = COALESCE($1, status),
        assigned_to = COALESCE($2, assigned_to)
      WHERE id = $3
      RETURNING *
    `;
    const result = await pool.query(query, [status, assignedTo, id]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

