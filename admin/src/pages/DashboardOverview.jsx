import React from 'react';
import { 
  Train, 
  Users, 
  CreditCard, 
  Compass, 
  TrendingUp, 
  ArrowUpRight, 
  LifeBuoy, 
  ChevronRight, 
  Activity, 
  ArrowRight,
  Clock
} from 'lucide-react';

export default function DashboardOverview({ stats, trains, grievances, onNavigate }) {
  return (
    <div className="p-4 space-y-6 w-full">
      {/* 4 Clean Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
        {/* Total Active Trains */}
        <div className="admin-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Active Fleet</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Train className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">12,480</div>
          <div className="flex items-center space-x-1 text-xs text-emerald-600 mt-2 font-medium">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+14 rakes today</span>
          </div>
        </div>

        {/* Daily Passenger Bookings */}
        <div className="admin-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Passenger Bookings</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">24.81 Lakh</div>
          <div className="text-xs text-slate-500 mt-2">
            68% Reserved • 32% UTS
          </div>
        </div>

        {/* Daily Revenue */}
        <div className="admin-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Today's Revenue</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">₹48.24 Cr</div>
          <div className="flex items-center space-x-1 text-xs text-emerald-600 mt-2 font-medium">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+8.2% vs Yesterday</span>
          </div>
        </div>

        {/* Punctuality Rate */}
        <div className="admin-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">NTES Punctuality</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Compass className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">92.4%</div>
          <div className="text-xs text-slate-500 mt-2">
            Target 95% across zones
          </div>
        </div>
      </div>

      {/* Main Tables Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 w-full">
        {/* Left: Fleet Monitor */}
        <div className="xl:col-span-2 admin-card p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-600" />
                Live Fleet NTES Status Monitor
              </h3>
              <p className="text-xs text-slate-500">GPS telemetry and section running delays</p>
            </div>
            <button 
              onClick={() => onNavigate('trains')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-0.5"
            >
              <span>Manage Fleet</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[600px]">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-y border-slate-100">
                <tr>
                  <th className="py-2.5 px-3">Train</th>
                  <th className="py-2.5 px-3">Route</th>
                  <th className="py-2.5 px-3">Current Location</th>
                  <th className="py-2.5 px-3">Speed</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {trains.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-900">{t.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">#{t.number} • {t.zone}</div>
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-700">
                      {t.from} <span className="text-slate-400 mx-1">➔</span> {t.to}
                    </td>
                    <td className="py-3 px-3 text-slate-800">
                      {t.currentLocation} <span className="text-[10px] text-slate-400 font-semibold">({t.platform})</span>
                    </td>
                    <td className="py-3 px-3 font-mono font-medium text-slate-700">
                      {t.speedKmph} km/h
                    </td>
                    <td className="py-3 px-3">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                        t.delayMinutes === 0 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {t.delayMinutes === 0 ? 'ON TIME' : `+${t.delayMinutes} MINS`}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button 
                        onClick={() => onNavigate('tracking')}
                        className="bg-white hover:bg-slate-50 text-slate-700 text-[11px] font-semibold px-2.5 py-1 rounded border border-slate-200 transition"
                      >
                        Override GPS
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Rail Madad Complaints */}
        <div className="admin-card p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <LifeBuoy className="w-4 h-4 text-rose-600" />
                Live Rail Madad Dispatch
              </h3>
              <p className="text-xs text-slate-500">Passenger onboard emergencies</p>
            </div>
            <span className="text-[10px] bg-rose-50 text-rose-700 font-semibold px-2 py-0.5 rounded-full border border-rose-200">
              Live Feed
            </span>
          </div>

          <div className="space-y-3">
            {grievances.map(g => (
              <div key={g.id} className="p-3 rounded-lg border border-slate-200/80 bg-slate-50/40 space-y-1.5 hover:bg-slate-50 transition">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-slate-500">{g.id}</span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                    g.priority === 'CRITICAL' 
                      ? 'bg-rose-100 text-rose-800' 
                      : (g.priority === 'HIGH' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700')
                  }`}>
                    {g.priority}
                  </span>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-slate-900">{g.category}</h4>
                  <div className="text-[11px] text-slate-500">{g.train} • Coach {g.coach}</div>
                </div>

                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 text-[10px]">{g.time}</span>
                  <button 
                    onClick={() => onNavigate('grievances')}
                    className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-0.5 text-xs"
                  >
                    <span>Resolve</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button 
            onClick={() => onNavigate('grievances')}
            className="w-full bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold py-2 rounded-lg text-xs border border-slate-200 transition"
          >
            Open Rail Madad Center
          </button>
        </div>
      </div>
    </div>
  );
}
