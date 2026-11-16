import React from 'react';

export default function UsersRolesPage() {
  return (
    <div className="p-4  space-y-6 w-full">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Passenger Identity & CRIS Staff Terminal Access</h2>
        <p className="text-xs text-slate-500">Manage TTE handheld digital terminals (HHT), Station Master accounts, and passenger verifications</p>
      </div>

      <div className="admin-card p-6 space-y-4">
        <h3 className="text-base font-bold text-slate-900">Access Management & Active Devices</h3>
        <p className="text-xs text-slate-500">Live sessions of Railway staff terminals and verified passenger identities</p>
        
        <div className="text-xs text-slate-600 bg-slate-50 p-4 rounded-lg border border-slate-200">
          Total <strong>1.48 Crore</strong> verified passenger profiles active with biometric and mPIN credentials. Total <strong>24,500 TTE Handheld Terminals (HHT)</strong> synced across all divisions.
        </div>
      </div>
    </div>
  );
}
