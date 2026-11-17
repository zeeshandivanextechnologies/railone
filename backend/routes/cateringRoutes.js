import express from 'express';
import { pool } from '../config/db.js';

const router = express.Router();

// Initialize catering menu & orders tables if not exist
export const initCateringTables = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS catering_items (
        id SERIAL PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        vendor VARCHAR(150) NOT NULL,
        station VARCHAR(100) NOT NULL,
        category VARCHAR(50) DEFAULT 'ALL',
        price NUMERIC(10, 2) NOT NULL,
        is_veg BOOLEAN DEFAULT TRUE,
        rating VARCHAR(10) DEFAULT '4.5',
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS catering_orders (
        id SERIAL PRIMARY KEY,
        order_id VARCHAR(50) UNIQUE NOT NULL,
        user_id INT,
        item_id INT,
        item_name VARCHAR(150) NOT NULL,
        vendor VARCHAR(150) NOT NULL,
        station VARCHAR(100),
        pnr VARCHAR(50),
        coach VARCHAR(20),
        seat VARCHAR(20),
        price NUMERIC(10, 2) NOT NULL,
        payment_method VARCHAR(50) DEFAULT 'R-WALLET',
        status VARCHAR(50) DEFAULT 'CONFIRMED',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Seed default items if empty
    const countRes = await pool.query(`SELECT count(*) FROM catering_items`);
    if (parseInt(countRes.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO catering_items (name, vendor, station, category, price, is_veg, rating, description)
        VALUES 
        ('North Indian Standard Thali', 'Haldiram''s', 'Kota Jn', 'THALI', 180.00, true, '4.5', 'Dal Makhani, Shahi Paneer, 2 Parathas, Rice, Gulab Jamun & Salad'),
        ('Veg Cheese Pizza & Cold Drink', 'Domino''s', 'New Delhi', 'FAST_FOOD', 249.00, true, '4.4', 'Fresh 7-inch cheese pizza with cold beverage bottle'),
        ('Fresh Masala Tea + Samosa (2 pcs)', 'Chai Point', 'Kanpur Central', 'BEVERAGES', 70.00, true, '4.6', 'Aromatic ginger cardamom tea with 2 crispy hot samosas'),
        ('Special Executive Thali', 'Haldiram''s', 'Kota Jn', 'THALI', 240.00, true, '4.7', 'Premium paneer butter masala, yellow dal, jeera rice, butter naan & sweet'),
        ('Kaju Katli Sweet Box (250g)', 'Bikanervala', 'Mathura Jn', 'DESSERTS', 290.00, true, '4.8', 'Authentic pure cashew sweets with silver foil packing')
      `);
      console.log('✅ Catering sample items seeded.');
    }
  } catch (err) {
    console.error('⚠️ Catering table initialization note:', err.message);
  }
};

// 1. GET ALL CATERING ITEMS (Optional station / category query)
router.get('/items', async (req, res) => {
  try {
    const { station, category } = req.query;
    let query = 'SELECT * FROM catering_items WHERE 1=1';
    const params = [];

    if (station) {
      params.push(`%${station}%`);
      query += ` AND station ILIKE $${params.length}`;
    }
    if (category && category !== 'ALL') {
      params.push(category);
      query += ` AND category = $${params.length}`;
    }

    query += ' ORDER BY id ASC';
    const result = await pool.query(query, params);
    
    // Map to frontend-friendly fields
    const items = result.rows.map(item => ({
      id: item.id,
      name: item.name,
      vendor: item.vendor,
      station: item.station,
      category: item.category,
      price: parseFloat(item.price),
      isVeg: item.is_veg,
      rating: item.rating,
      description: item.description
    }));

    res.json(items);
  } catch (err) {
    console.error('Error fetching catering items:', err.message);
    res.status(500).json({ error: 'Failed to fetch catering items' });
  }
});

// 2. PLACE CATERING ORDER (Seat Delivery)
router.post('/order', async (req, res) => {
  try {
    const { userId, itemId, itemName, vendor, station, pnr, coach, seat, price, paymentMethod } = req.body;
    const orderId = `CAT-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

    const insertQuery = `
      INSERT INTO catering_orders (order_id, user_id, item_id, item_name, vendor, station, pnr, coach, seat, price, payment_method, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'CONFIRMED')
      RETURNING *
    `;

    const result = await pool.query(insertQuery, [
      orderId,
      userId || null,
      itemId || null,
      itemName,
      vendor,
      station || 'Next Station',
      pnr || 'UNRESERVED',
      coach || 'Coach',
      seat || 'Berth',
      price,
      paymentMethod || 'R-WALLET'
    ]);

    res.status(201).json({
      success: true,
      order: result.rows[0],
      message: `Order confirmed with ${vendor}! It will be delivered to your coach seat.`
    });
  } catch (err) {
    console.error('Error placing catering order:', err.message);
    res.status(500).json({ error: 'Failed to place catering order' });
  }
});

export default router;
