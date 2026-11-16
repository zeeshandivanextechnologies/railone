import express from 'express';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import { pool } from '../config/db.js';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_TzcLjMRMDrl0cb',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'uxIvOiiUm41mjXQ7TfqadhSH',
});

// Initialize wallet transactions table
export const initWalletTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS wallet_transactions (
      id SERIAL PRIMARY KEY,
      user_id INT NOT NULL,
      txn_id VARCHAR(100) UNIQUE NOT NULL,
      type VARCHAR(20) NOT NULL, -- 'CREDIT' or 'DEBIT'
      title VARCHAR(255) NOT NULL,
      amount NUMERIC(10, 2) NOT NULL,
      method VARCHAR(50) DEFAULT 'Razorpay UPI',
      razorpay_order_id VARCHAR(100),
      razorpay_payment_id VARCHAR(100),
      status VARCHAR(50) DEFAULT 'SUCCESS',
      cashback NUMERIC(10, 2) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log(' PostgreSQL Wallet Transactions Table Ready.');
};

// 1. GET WALLET DATA & TRANSACTION HISTORY FOR A USER
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Get live user balance
    const userRes = await pool.query('SELECT wallet_balance, mobile, full_name, email FROM users WHERE id = $1', [userId]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userRes.rows[0];

    // Get live transactions
    const txnRes = await pool.query(
      `SELECT txn_id as id, type, title, amount, method, status, cashback,
              TO_CHAR(created_at, 'DD Mon YYYY, HH12:MI AM') as date
       FROM wallet_transactions 
       WHERE user_id = $1 
       ORDER BY created_at DESC`,
      [userId]
    );

    res.json({
      balance: parseFloat(userData.wallet_balance || 0),
      user: {
        mobile: userData.mobile,
        name: userData.full_name,
        email: userData.email
      },
      transactions: txnRes.rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. CREATE RAZORPAY ORDER (Initiate Top-up)
router.post('/create-order', async (req, res) => {
  try {
    const { amount, userId } = req.body;
    const numAmount = parseFloat(amount);

    if (!numAmount || numAmount <= 0) {
      return res.status(400).json({ error: 'Please enter a valid amount' });
    }

    // Amount in paisa for Razorpay
    const options = {
      amount: Math.round(numAmount * 100),
      currency: 'INR',
      receipt: `rcpt_rwallet_${Date.now()}`,
      notes: {
        userId: userId ? userId.toString() : 'guest',
        service: 'RailOne R-Wallet Top-up'
      }
    };

    const order = await razorpayInstance.orders.create(options);

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_TzcLjMRMDrl0cb'
    });
  } catch (err) {
    console.error('Razorpay Create Order Error:', err);
    res.status(500).json({ error: err.message || 'Failed to create Razorpay Order' });
  }
});

// 3. VERIFY RAZORPAY PAYMENT & CREDIT USER WALLET
router.post('/verify-payment', async (req, res) => {
  try {
    const { 
      userId, 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature, 
      amount, 
      paymentMethod 
    } = req.body;

    if (!userId || !razorpay_payment_id || !amount) {
      return res.status(400).json({ error: 'Missing payment details' });
    }

    // Verify HMAC SHA256 Signature
    if (razorpay_order_id && razorpay_signature) {
      const generatedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'uxIvOiiUm41mjXQ7TfqadhSH')
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      if (generatedSignature !== razorpay_signature) {
        return res.status(400).json({ error: 'Invalid payment signature. Verification failed.' });
      }
    }

    const numAmount = parseFloat(amount);
    const txnId = `TXN-${Math.floor(10000 + Math.random() * 90000)}`;
    const title = `Top-up via Razorpay (${paymentMethod || 'UPI/Card'})`;

    // 1. Update wallet balance in PostgreSQL users table
    const updateRes = await pool.query(
      `UPDATE users 
       SET wallet_balance = COALESCE(wallet_balance, 0) + $1 
       WHERE id = $2 
       RETURNING wallet_balance`,
      [numAmount, userId]
    );

    const newBalance = parseFloat(updateRes.rows[0].wallet_balance);

    // 2. Insert into wallet_transactions ledger
    const insertRes = await pool.query(
      `INSERT INTO wallet_transactions 
        (user_id, txn_id, type, title, amount, method, razorpay_order_id, razorpay_payment_id, status, cashback)
       VALUES ($1, $2, 'CREDIT', $3, $4, $5, $6, $7, 'SUCCESS', 0)
       RETURNING txn_id as id, type, title, amount, method, status, cashback,
                 TO_CHAR(created_at, 'DD Mon YYYY, HH12:MI AM') as date`,
      [userId, txnId, title, numAmount, paymentMethod || 'Razorpay Online', razorpay_order_id || null, razorpay_payment_id]
    );

    res.json({
      success: true,
      message: 'Payment verified and R-Wallet credited successfully!',
      balance: newBalance,
      transaction: insertRes.rows[0]
    });
  } catch (err) {
    console.error('Verify Payment Error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;

