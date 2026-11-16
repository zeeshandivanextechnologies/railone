import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import AdminSidebar from './AdminSidebar.jsx';
import AdminHeader from './AdminHeader.jsx';

export default function AdminLayout() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/': return 'Executive Operations Center';
      case '/trains': return 'Fleet & Timetable Operations';
      case '/tracking': return 'NTES Live GPS Delay Controller';
      case '/bookings': return 'Commercial Ticketing & Revenue';
      case '/grievances': return 'Rail Madad Passenger Redressal';
      case '/broadcasts': return 'Passenger Disruption Broadcasts';
      case '/wallet': return 'R-Wallet Liquidity & Settlement';
      case '/ecatering': return 'e-Catering Vendor & Hygiene Control';
      case '/users': return 'Passenger Accounts & Staff Roles';
      case '/settings': return 'CRIS Central System Settings';
      default: return 'RailOne Super Admin';
    }
  };

  const getPageSubtitle = () => {
    switch (location.pathname) {
      case '/': return 'Real-time telemetry of Indian Railways fleet, punctuality & passenger revenues';
      case '/trains': return 'Induct new trains, modify rakes and manage route timetables';
      case '/tracking': return 'Live telemetry GPS updates broadcast directly to RailOne apps';
      case '/bookings': return 'Audit trail of IRCTC Reserved and UTS Paperless tickets';
      case '/grievances': return 'Live emergency and onboard passenger complaints workflow';
      case '/broadcasts': return 'Send weather, mega block and safety push notices';
      default: return 'Centre for Railway Information Systems (CRIS)';
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#f8fafc] text-slate-900 overflow-hidden antialiased font-inter">
      {/* Sidebar */}
      <AdminSidebar 
        isCollapsed={isCollapsed}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      {/* Main Full-Width Content Container */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-[#f8fafc]">
        {/* Header */}
        <AdminHeader 
          title={getPageTitle()} 
          subtitle={getPageSubtitle()} 
          onToggleSidebar={() => setIsCollapsed(prev => !prev)}
          isCollapsed={isCollapsed}
          onBroadcastClick={() => navigate('/broadcasts')}
          onOpenMobileMenu={() => setIsMobileOpen(true)}
        />

        {/* Content View via Outlet */}
        <main className="flex-1 overflow-y-auto bg-[#f8fafc] w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

