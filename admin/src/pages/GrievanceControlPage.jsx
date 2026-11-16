import React, { useState } from 'react';
import { 
  LifeBuoy, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  Send
} from 'lucide-react';

export default function GrievanceControlPage({ grievances, setGrievances }) {
  const [selectedGrievance, setSelectedGrievance] = useState(grievances[0] || null);
  const [remarkInput, setRemarkInput] = useState('');
  const [resolutionStatus, setResolutionStatus] = useState('RESOLVED');

  const handleUpdateStatus = (e) => {
    e.preventDefault();
    if (!selectedGrievance) return;

    setGrievances(prev => prev.map(g => {
      if (g.id === selectedGrievance.id) {
        return {
          ...g,
          status: resolutionStatus,
          assignedTo: remarkInput ? `${g.assignedTo} (Action: ${remarkInput})` : g.assignedTo
        };
      }
      return g;
    }));

    setSelectedGrievance(prev => ({
      ...prev,
      status: resolutionStatus
    }));

    setRemarkInput('');
    alert(`Grievance ${selectedGrievance.id} updated to ${resolutionStatus}!`);
  };

  return (
    <div className="p-4  space-y-6 w-full">
      <div>
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <LifeBuoy className="w-5 h-5 text-rose-600" />
          Rail Madad Passenger Grievance Control Room
        </h2>
        <p className="text-xs text-slate-500">Direct interface between passengers and Onboard Train Captains, RPF and Section Engineers</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 w-full">
        {/* Left: Grievances Feed */}
        <div className="admin-card p-4 sm:p-5 space-y-3 w-full">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Complaints</h3>
            <span className="text-[10px] text-rose-700 font-semibold bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
              {grievances.length} Tickets
            </span>
          </div>

          <div className="space-y-2">
            {grievances.map(g => (
              <div 
                key={g.id}
                onClick={() => setSelectedGrievance(g)}
                className={`p-3 rounded-lg border cursor-pointer transition space-y-1 ${
                  selectedGrievance?.id === g.id 
                    ? 'bg-rose-50/60 border-rose-300' 
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-slate-400 font-medium">{g.id}</span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                    g.status === 'RESOLVED' 
                      ? 'bg-emerald-100 text-emerald-800' 
                      : (g.priority === 'CRITICAL' ? 'bg-rose-600 text-white' : 'bg-amber-100 text-amber-800')
                  }`}>
                    {g.status}
                  </span>
                </div>
                <div className="font-semibold text-xs text-slate-900">{g.category}</div>
                <div className="text-[11px] text-slate-500">{g.train} • {g.coach}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Grievance Investigation & Resolution Panel */}
        {selectedGrievance ? (
          <div className="xl:col-span-2 admin-card p-6 sm:p-7 space-y-5 w-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <span className="text-xs font-mono font-medium text-slate-400">Incident #{selectedGrievance.id}</span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">{selectedGrievance.category}</h3>
                <div className="text-xs text-slate-500 mt-0.5">Train: <strong className="text-slate-700">{selectedGrievance.train}</strong> • Coach: <strong className="text-slate-700">{selectedGrievance.coach}</strong></div>
              </div>

              <div className="self-start sm:self-auto sm:text-right">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Severity</span>
                <div className="text-xs font-bold text-rose-600 font-mono">{selectedGrievance.priority}</div>
              </div>
            </div>

            {/* Passenger Info Card */}
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-500 uppercase text-[10px] font-semibold">Passenger Contact</span>
                <div className="font-semibold text-slate-800 mt-0.5">{selectedGrievance.reportedBy}</div>
              </div>
              <div>
                <span className="text-slate-500 uppercase text-[10px] font-semibold">PNR Number</span>
                <div className="font-mono font-bold text-blue-600 mt-0.5">{selectedGrievance.pnr}</div>
              </div>
            </div>

            {/* Resolution Form */}
            <form onSubmit={handleUpdateStatus} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-600 font-semibold uppercase text-[10px]">Staff Remark / Action Taken</label>
                <textarea 
                  rows={3}
                  required
                  placeholder="Detail action taken (e.g. OBHS team sanitised toilet at next stop)..."
                  value={remarkInput}
                  onChange={(e) => setRemarkInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 font-medium outline-none mt-1 focus:bg-white focus:border-rose-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-600 font-semibold uppercase text-[10px]">Change Status</label>
                  <select 
                    value={resolutionStatus}
                    onChange={(e) => setResolutionStatus(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 font-medium outline-none mt-1 focus:bg-white focus:border-rose-500"
                  >
                    <option value="IN_PROGRESS">In Progress (Attending)</option>
                    <option value="RESOLVED">Resolved & Closed</option>
                    <option value="ESCALATED_RPF">Escalated to RPF Police</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <button 
                    type="submit"
                    className="w-full bg-rose-600 hover:bg-rose-700 text-white font-semibold py-2.5 rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Transmit Resolution to Passenger App</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        ) : (
          <div className="xl:col-span-2 admin-card p-8 text-center text-slate-400 w-full">
            Select a complaint from the list to view and resolve.
          </div>
        )}
      </div>
    </div>
  );
}
