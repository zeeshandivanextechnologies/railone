import React from 'react';

export default function SystemSettingsPage() {
  return (
    <div className="p-4 space-y-6 w-full">
      <div>
        <h2 className="text-lg font-bold text-slate-900">CRIS Server & Database Core Settings</h2>
        <p className="text-xs text-slate-500">Configure NTES latency sync interval, IRCTC Tatkal payment gateway throttling, and security protocols</p>
      </div>

      <div className="admin-card p-6 space-y-4">
        <h3 className="text-base font-bold text-slate-900">System Configuration</h3>
        <p className="text-xs text-slate-500">Global parameters for Indian Railways RailOne integration servers</p>
        
        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50">
            <div>
              <div className="font-semibold text-slate-800">NTES Satellite GPS Ping Interval</div>
              <div className="text-[11px] text-slate-500">Frequency of GPS coordinate broadcasts to passenger apps</div>
            </div>
            <span className="font-mono font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-200">15 Seconds</span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50">
            <div>
              <div className="font-semibold text-slate-800">Tatkal Concurrency Shield</div>
              <div className="text-[11px] text-slate-500">Automated bot protection and captcha throttling at 10:00 & 11:00 AM</div>
            </div>
            <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">Active</span>
          </div>
        </div>
      </div>
    </div>
  );
}
