import express from 'express';
import { pool } from '../config/db.js';

const router = express.Router();

// 1. GET ALL BOOKINGS
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM bookings ORDER BY id DESC');
    const bookings = result.rows.map(b => ({
      id: b.id,
      pnr: b.pnr,
      trainNumber: b.train_number,
      trainName: b.train_name,
      passenger: b.passenger_name,
      passengerName: b.passenger_name,
      from: b.from,
      to: b.to,
      classType: b.class_type,
      className: b.class_type,
      fare: parseFloat(b.fare),
      paymentMethod: b.payment_method,
      status: b.status,
      ticketType: b.ticket_type,
      coach: b.coach,
      seat: b.seat,
      bookingDate: b.created_at
    }));
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. CREATE NEW BOOKING (From Passenger App)
router.post('/', async (req, res) => {
  try {
    const { 
      pnr, trainNumber, trainName, passengerName, from, to, 
      classType, fare, paymentMethod, status, ticketType, coach, seat 
    } = req.body;

    const query = `
      INSERT INTO bookings (pnr, train_number, train_name, passenger_name, "from", "to", class_type, fare, payment_method, status, ticket_type, coach, seat)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;
    const values = [
      pnr, trainNumber, trainName, passengerName, from, to, 
      classType || '3A', fare || 0, paymentMethod || 'UPI', 
      status || 'CONFIRMED', ticketType || 'RESERVED', coach || 'B2', seat || '23 (MB)'
    ];

    const result = await pool.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. CANCEL BOOKING
router.delete('/:pnr', async (req, res) => {
  try {
    const { pnr } = req.params;
    await pool.query('DELETE FROM bookings WHERE pnr = $1', [pnr]);
    res.json({ message: 'Ticket cancelled successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

