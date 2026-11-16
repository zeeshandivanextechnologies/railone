import React, { useState } from 'react';
import { 
  Radio, 
  Send, 
  CheckCircle, 
  Volume2
} from 'lucide-react';

export default function BroadcastAlertsPage() {
  const [alertType, setAlertType] = useState('WEATHER');
  const [headline, setHeadline] = useState('');
  const [message, setMessage] = useState('');
  const [targetZone, setTargetZone] = useState('ALL_INDIA');
  const [sentSuccess, setSentSuccess] = useState(false);

  const [activeAlerts, setActiveAlerts] = useState([
    {
      id: "ALT-9081",
      type: "FOG / WINTER",
      headline: "Dense Fog Alert across Northern & North Central Railway",
      zone: "NR, NCR, NER",
      postedAt: "13 Nov 2026, 06:00 AM",
      active: true
    },
    {
      id: "ALT-8842",
      type: "SAFETY ADVISORY",
      headline: "Track Maintenance Block between Mathura and Agra Cantt",
      zone: "NCR",
      postedAt: "12 Nov 2026, 11:30 PM",
      active: true
    }
  ]);

  const handleBroadcast = (e) => {
    e.preventDefault();
    if (!headline || !message) return;

    const newAlert = {
      id: `ALT-${Math.floor(1000 + Math.random() * 9000)}`,
      type: alertType,
      headline: headline,
      zone: targetZone,
      postedAt: "Just now",
      active: true
    };

    setActiveAlerts(prev => [newAlert, ...prev]);
    setSentSuccess(true);
    setHeadline('');
    setMessage('');
    setTimeout(() => setSentSuccess(false), 3000);
  };

  return (
    <div className="p-4  space-y-6 w-full">
      <div>
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Radio className="w-5 h-5 text-amber-600" />
          Network Disruption & Passenger Broadcast Controller
        </h2>
        <p className="text-xs text-slate-500">Push emergency notifications and safety alerts directly to passenger RailOne Super App</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 w-full">
        {/* Left: Compose Broadcast Alert */}
        <div className="xl:col-span-2 admin-card p-6 sm:p-7 space-y-4 w-full">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-blue-600" />
            Dispatch Live Passenger Alert
          </h3>

          {sentSuccess && (
            <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Broadcast Dispatched! High-priority notification banner is now live on RailOne app users' devices.</span>
            </div>
          )}

          <form onSubmit={handleBroadcast} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-slate-600 font-semibold uppercase text-[10px]">Alert Category</label>
                <select 
                  value={alertType}
                  onChange={(e) => setAlertType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 font-medium outline-none mt-1 focus:bg-white focus:border-blue-500"
                >
                  <option value="WEATHER">Dense Fog / Heavy Rain / Weather</option>
                  <option value="TRACK_BLOCK">Track Maintenance / Mega Block</option>
                  <option value="SECURITY">RPF Security & Baggage Alert</option>
                  <option value="SPECIAL_TRAIN">Festival / Holiday Special Trains</option>
                </select>
              </div>

              <div>
                <label className="text-slate-600 font-semibold uppercase text-[10px]">Target Railway Zone</label>
                <select 
                  value={targetZone}
                  onChange={(e) => setTargetZone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 font-medium outline-none mt-1 focus:bg-white focus:border-blue-500"
                >
                  <option value="ALL_INDIA">All India (Nationwide RailOne Users)</option>
                  <option value="NR">Northern Railway (NR)</option>
                  <option value="WR">Western Railway (WR)</option>
                  <option value="NCR">North Central Railway (NCR)</option>
                  <option value="ER">Eastern Railway (ER)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-slate-600 font-semibold uppercase text-[10px]">Alert Headline</label>
              <input 
                type="text" 
                required
                placeholder="e.g. Fog disruption: Speed restricted to 60 km/h in Delhi-Kanpur section"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 font-medium outline-none mt-1 focus:bg-white focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-slate-600 font-semibold uppercase text-[10px]">Full Advisory Message</label>
              <textarea 
                rows={3} 
                required
                placeholder="Explain the cause, impact on trains, and passenger instructions..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 outline-none mt-1 focus:bg-white focus:border-blue-500"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button 
                type="submit"
                className="bg-amber-600 hover:bg-amber-700 text-white font-semibold px-5 py-2.5 rounded-lg text-xs flex items-center gap-1.5 shadow-xs transition"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Publish Broadcast to RailOne Network</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right: Active Broadcast Banners */}
        <div className="admin-card p-5 sm:p-6 space-y-4 w-full">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Live App Broadcasts</h3>
            <span className="text-[10px] bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded-full border border-emerald-200">
              Broadcasting
            </span>
          </div>

          <div className="space-y-3">
            {activeAlerts.map(a => (
              <div key={a.id} className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
                    {a.type}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">{a.id}</span>
                </div>
                <h4 className="font-semibold text-slate-900 leading-snug">{a.headline}</h4>
                <div className="text-[10px] text-slate-500 flex items-center justify-between pt-1.5 border-t border-slate-200/60">
                  <span>Zone: {a.zone}</span>
                  <span className="font-mono">{a.postedAt}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
