import React from 'react';

export default function ECateringVendorsPage() {
  return (
    <div className="p-4 space-y-6 w-full">
      <div>
        <h2 className="text-lg font-bold text-slate-900">IRCTC e-Catering & Vendor Monitoring</h2>
        <p className="text-xs text-slate-500">Authorised restaurant vendors delivering meals directly to passenger berths</p>
      </div>

      <div className="admin-card p-6 space-y-4">
        <h3 className="text-base font-bold text-slate-900">Active Vendor Partners</h3>
        <p className="text-xs text-slate-500">Hygiene ratings, FSSAI certifications, and station-wise service coverage</p>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs mt-3">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <span className="text-slate-800 font-bold text-sm">Haldiram's Sweets & Meals</span>
            <div className="text-emerald-700 font-semibold mt-1">FSSAI Certified • ⭐ 4.5</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Active at 84 Stations</div>
          </div>
          
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <span className="text-slate-800 font-bold text-sm">Domino's Pizza On Track</span>
            <div className="text-emerald-700 font-semibold mt-1">FSSAI Certified • ⭐ 4.4</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Active at 112 Stations</div>
          </div>
          
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <span className="text-slate-800 font-bold text-sm">Chai Point Express</span>
            <div className="text-emerald-700 font-semibold mt-1">FSSAI Certified • ⭐ 4.6</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Active at 62 Stations</div>
          </div>
        </div>
      </div>
    </div>
  );
}

