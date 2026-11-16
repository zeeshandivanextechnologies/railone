import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { execSync } from 'child_process';
import { initDB } from './config/db.js';

// Route imports
import trainRoutes from './routes/trainRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import grievanceRoutes from './routes/grievanceRoutes.js';
import broadcastRoutes from './routes/broadcastRoutes.js';
import authRoutes, { initUserTable } from './routes/authRoutes.js';
import walletRoutes, { initWalletTable } from './routes/walletRoutes.js';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT, 10) || 5000;

// Middleware - Support up to 10MB for avatar image uploads
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/trains', trainRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/grievances', grievanceRoutes);
app.use('/api/broadcasts', broadcastRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'RailOne Backend & PostgreSQL Server Running' });
});

// Helper to gracefully free port 5000 if occupied on Windows
const freePortIfOccupied = (port) => {
  if (process.platform === 'win32') {
    try {
      const output = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
      const lines = output.trim().split('\n');
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && pid !== `${process.pid}` && pid !== '0') {
          try {
            execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
            console.log(` Automatically freed port ${port} by terminating old process PID: ${pid}`);
          } catch (_) {}
        }
      }
    } catch (_) {
      // Port is already free
    }
  }
};

// Initialize DB and start server
const startServer = async () => {
  try {
    await initDB();
    await initUserTable();
    await initWalletTable();

    const server = app.listen(PORT, () => {
      console.log(` RailOne Backend API Server running on http://localhost:${PORT}`);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.warn(` Port ${PORT} was busy. Auto-clearing and restarting...`);
        freePortIfOccupied(PORT);
        setTimeout(() => {
          server.close();
          app.listen(PORT, () => {
            console.log(` RailOne Backend API Server successfully started on http://localhost:${PORT}`);
          });
        }, 1200);
      } else {
        console.error('Server error:', err);
      }
    });
  } catch (err) {
    console.error('Fatal initialization error:', err);
  }
};

startServer();
