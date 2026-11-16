import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Train, 
  Compass, 
  Ticket, 
  LifeBuoy, 
  UtensilsCrossed, 
  Wallet, 
  Users, 
  Settings, 
  Radio, 
  ExternalLink,
  X
} from 'lucide-react';

export default function AdminSidebar({ 
  isCollapsed, 
  isMobileOpen, 
  setIsMobileOpen 
}) {
  const menuGroups = [
    {
      group: "Operations",
      items: [
        { path: '/', label: 'Overview', icon: LayoutDashboard },
        { path: '/trains', label: 'Trains & Schedules', icon: Train, count: '12.4k' },
        { path: '/tracking', label: 'NTES Live Tracking', icon: Compass }
      ]
    },
    {
      group: "Commercial",
      items: [
        { path: '/bookings', label: 'Passenger Bookings', icon: Ticket },
        { path: '/wallet', label: 'R-Wallet Liquidity', icon: Wallet },
        { path: '/ecatering', label: 'e-Catering Vendors', icon: UtensilsCrossed },
        { path: '/grievances', label: 'Rail Madad Complaints', icon: LifeBuoy, badge: '3 Open', badgeColor: 'bg-rose-50 text-rose-700 border-rose-200' }
      ]
    },
    {
      group: "Administration",
      items: [
        { path: '/broadcasts', label: 'Disruption Alerts', icon: Radio },
        { path: '/users', label: 'Staff & Terminal Roles', icon: Users },
        { path: '/settings', label: 'System Settings', icon: Settings }
      ]
    }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 flex flex-col justify-between transition-all duration-200 ease-in-out border-r border-slate-200 bg-white ${
          isMobileOpen ? 'translate-x-0 w-64 shadow-xl' : '-translate-x-full lg:translate-x-0'
        } ${
          isCollapsed ? 'lg:w-[70px]' : 'lg:w-64'
        }`}
      >
        {/* Top Logo / Title */}
        <div>
          <div className={`h-16 px-4 flex items-center border-b border-slate-100 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
            <div className="flex items-center space-x-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shrink-0 shadow-xs">
                <Train className="w-4 h-4" />
              </div>
              
              {!isCollapsed && (
                <div className="overflow-hidden whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-slate-900 tracking-tight">RailOne</span>
                    <span className="bg-slate-100 text-slate-600 font-mono text-[10px] font-bold px-1.5 py-0.2 rounded border border-slate-200">ADMIN</span>
                  </div>
                  <p className="text-[11px] text-slate-400">CRIS Operations Hub</p>
                </div>
              )}
            </div>

            <button 
              onClick={() => setIsMobileOpen(false)}
              className="lg:hidden p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links with NavLink */}
          <div className="p-3 space-y-5 overflow-y-auto max-h-[calc(100vh-140px)]">
            {menuGroups.map((group, idx) => (
              <div key={idx} className="space-y-0.5">
                {!isCollapsed ? (
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1.5">
                    {group.group}
                  </div>
                ) : (
                  <div className="w-5 h-px bg-slate-200 mx-auto my-2" />
                )}

                {group.items.map(item => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => {
                        if (window.innerWidth < 1024) setIsMobileOpen(false);
                      }}
                      title={isCollapsed ? item.label : undefined}
                      className={({ isActive }) => `w-full flex items-center rounded-lg text-xs transition-colors ${
                        isCollapsed ? 'justify-center p-2.5' : 'justify-between px-3 py-2'
                      } ${
                        isActive 
                          ? 'bg-blue-50 text-blue-700 font-bold' 
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium'
                      }`}
                    >
                      {({ isActive }) => (
                        <>
                          <div className="flex items-center space-x-2.5 overflow-hidden">
                            <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                            {!isCollapsed && <span className="truncate">{item.label}</span>}
                          </div>

                          {!isCollapsed && (item.badge || item.count) && (
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${
                              item.badgeColor || (isActive ? 'bg-blue-100 text-blue-800 border-blue-200' : 'bg-slate-100 text-slate-500 border-slate-200')
                            }`}>
                              {item.badge || item.count}
                            </span>
                          )}
                        </>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Footer info */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50">
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
            <div className="flex items-center space-x-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
                CR
              </div>
              {!isCollapsed && (
                <div className="truncate">
                  <div className="text-xs font-semibold text-slate-800 truncate">Central Controller</div>
                  <div className="text-[11px] text-slate-400 truncate">admin@cris.org.in</div>
                </div>
              )}
            </div>

            {!isCollapsed && (
              <button 
                title="Open Passenger App"
                onClick={() => window.open('http://localhost:5173', '_blank')}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition"
              >
                <ExternalLink className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
