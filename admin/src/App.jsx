import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import AdminLayout from './components/AdminLayout.jsx';

// Pages
import DashboardOverview from './pages/DashboardOverview.jsx';
import TrainOperationsPage from './pages/TrainOperationsPage.jsx';
import NTESDelayPage from './pages/NTESDelayPage.jsx';
import GrievanceControlPage from './pages/GrievanceControlPage.jsx';
import BookingsLedgerPage from './pages/BookingsLedgerPage.jsx';
import BroadcastAlertsPage from './pages/BroadcastAlertsPage.jsx';
import WalletLiquidityPage from './pages/WalletLiquidityPage.jsx';
import ECateringVendorsPage from './pages/ECateringVendorsPage.jsx';
import UsersRolesPage from './pages/UsersRolesPage.jsx';
import SystemSettingsPage from './pages/SystemSettingsPage.jsx';

// Data & PostgreSQL API Service
import { 
  ADMIN_TRAINS, 
  ADMIN_STATS, 
  ADMIN_GRIEVANCES, 
  ADMIN_BOOKINGS 
} from './data/adminData.js';
import { api } from './services/api.js';

export default function App() {
  const [trains, setTrains] = useState([]);
  const [grievances, setGrievances] = useState(ADMIN_GRIEVANCES);
  const [bookings, setBookings] = useState(ADMIN_BOOKINGS);

  // Fetch live state from PostgreSQL on mount
  useEffect(() => {
    const syncData = async () => {
      const liveTrains = await api.getTrains();
      setTrains(liveTrains);
      const liveGrievances = await api.getGrievances(ADMIN_GRIEVANCES);
      setGrievances(liveGrievances);
      const liveBookings = await api.getBookings(ADMIN_BOOKINGS);
      setBookings(liveBookings);
    };
    syncData();
  }, []);

  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route 
          path="/" 
          element={
            <DashboardOverview 
              stats={ADMIN_STATS} 
              trains={trains} 
              grievances={grievances} 
            />
          } 
        />
        <Route 
          path="/trains" 
          element={
            <TrainOperationsPage 
              trains={trains} 
              setTrains={setTrains} 
            />
          } 
        />
        <Route 
          path="/tracking" 
          element={
            <NTESDelayPage 
              trains={trains} 
              setTrains={setTrains} 
            />
          } 
        />
        <Route 
          path="/bookings" 
          element={
            <BookingsLedgerPage 
              bookings={bookings} 
              stats={ADMIN_STATS} 
            />
          } 
        />
        <Route 
          path="/grievances" 
          element={
            <GrievanceControlPage 
              grievances={grievances} 
              setGrievances={setGrievances} 
            />
          } 
        />
        <Route 
          path="/broadcasts" 
          element={<BroadcastAlertsPage />} 
        />
        <Route 
          path="/wallet" 
          element={<WalletLiquidityPage />} 
        />
        <Route 
          path="/ecatering" 
          element={<ECateringVendorsPage />} 
        />
        <Route 
          path="/users" 
          element={<UsersRolesPage />} 
        />
        <Route 
          path="/settings" 
          element={<SystemSettingsPage />} 
        />
      </Route>
    </Routes>
  );
}
