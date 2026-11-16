import React, { useState } from 'react';
import { 
  LifeBuoy, 
  Send, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  PhoneCall, 
  ShieldAlert, 
  FileText, 
  Camera, 
  MessageSquare,
  Search,
  ChevronRight,
  Sparkles,
  Info
} from 'lucide-react';

export default function RailMadadPanel({ user, bookings }) {
  const [activeTab, setActiveTab] = useState('LODGE'); // LODGE | TRACK | EMERGENCY
  const [grievanceType, setGrievanceType] = useState('TRAIN'); // TRAIN | STATION
  const [pnrNumber, setPnrNumber] = useState(bookings[0]?.pnr || '');
  const [incidentDate, setIncidentDate] = useState('Today');
  const [complaintCategory, setComplaintCategory] = useState('CLEANLINESS');
  const [complaintSubcategory, setComplaintSubcategory] = useState('Coach / Toilet Cleanliness');
  const [description, setDescription] = useState('');
  const [coachSeat, setCoachSeat] = useState(bookings[0] ? `${bookings[0].coach}-${bookings[0].seat}` : 'B2-23');
  const [contactMobile, setContactMobile] = useState(user?.mobile || '9876543210');

  // Track search state
  const [trackRefInput, setTrackRefInput] = useState('');
  const [trackedGrievance, setTrackedGrievance] = useState(null);
  const [registeredSuccess, setRegisteredSuccess] = useState(null);

  // Sample Grievances list for tracking
  const [grievanceHistory, setGrievanceHistory] = useState([
    {
      refId: 'RM-202611-9481',
      category: 'Coach Cleanliness',
      pnr: '2847193021',
      date: '12 Nov 2026, 09:15 AM',
      status: 'RESOLVED',
      staffRemark: 'Onboard housekeeping service (OBHS) attended coach B2 at Kota Jn. Toilet cleaned & sanitised.'
    },
    {
      refId: 'RM-202611-8204',
      category: 'Electrical / Charging Socket',
      pnr: '3948291048',
      date: '04 Nov 2026, 02:40 PM',
      status: 'CLOSED',
      staffRemark: 'Switchboard fuse repaired by train technician.'
    }
  ]);

  const handleSubmitGrievance = (e) => {
    e.preventDefault();
    if (!description.trim()) {
      alert("Please provide a brief description of the issue.");
      return;
    }

    const newRefId = `RM-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newGrievance = {
      refId: newRefId,
      category: complaintSubcategory,
      pnr: pnrNumber || 'N/A',
      date: 'Just now',
      status: 'IN PROGRESS',
      staffRemark: 'Assigned to Division Control & Train Captain. OBHS team alerted for your coach.'
    };

    setGrievanceHistory(prev => [newGrievance, ...prev]);
    setRegisteredSuccess(newGrievance);
    setDescription('');
  };

  const handleTrackSubmit = (e) => {
    e.preventDefault();
    const clean = trackRefInput.trim().toUpperCase();
    const found = grievanceHistory.find(g => g.refId.toUpperCase() === clean || g.pnr === clean);
    if (found) {
      setTrackedGrievance(found);
    } else {
      setTrackedGrievance({
        refId: trackRefInput || 'RM-202611-5821',
        category: 'Passenger Assistance',
        pnr: pnrNumber || '2847193021',
        date: 'Today, 10:20 AM',
        status: 'UNDER EXAMINATION',
        staffRemark: 'Ticket dispatched to Section Engineer & Train Captain.'
      });
    }
  };

  return (
    <div className="p-4 space-y-4 pb-28">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-rose-700 via-red-800 to-rose-950 text-white p-4 rounded-3xl shadow-lg relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="bg-white text-rose-800 font-black text-[10px] px-2 py-0.5 rounded shadow">CRIS</span>
            <span className="text-xs font-bold uppercase tracking-wider text-rose-200">Rail Madad Portal</span>
          </div>
          <a 
            href="tel:139" 
            className="flex items-center space-x-1 text-[10px] bg-white/15 px-2.5 py-1 rounded-full text-white font-bold border border-white/20 active:scale-95 transition"
          >
            <PhoneCall className="w-3 h-3 text-amber-300" />
            <span>Call 139</span>
          </a>
        </div>
        <h2 className="text-base font-black mt-2 text-white">For Inquiry, Assistance & Grievance</h2>
        <p className="text-[11px] text-rose-100 mt-0.5">
          Fast-track resolution for train & station issues directly by Indian Railways on-duty staff.
        </p>
      </div>

      {/* Mode Switcher */}
      <div className="bg-slate-200 p-1 rounded-2xl flex text-xs font-bold text-slate-700">
        <button
          type="button"
          onClick={() => { setActiveTab('LODGE'); setRegisteredSuccess(null); }}
          className={`flex-1 py-2 rounded-xl transition ${activeTab === 'LODGE' ? 'bg-rose-700 text-white shadow' : 'hover:text-slate-900'}`}
        >
          Lodge Complaint
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('TRACK')}
          className={`flex-1 py-2 rounded-xl transition ${activeTab === 'TRACK' ? 'bg-rose-700 text-white shadow' : 'hover:text-slate-900'}`}
        >
          Track Status
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('EMERGENCY')}
          className={`flex-1 py-2 rounded-xl transition ${activeTab === 'EMERGENCY' ? 'bg-red-700 text-white shadow' : 'hover:text-slate-900'}`}
        >
          Emergency Help
        </button>
      </div>

      {/* 1. LODGE COMPLAINT FORM */}
      {activeTab === 'LODGE' && (
        <>
          {!registeredSuccess ? (
            <form onSubmit={handleSubmitGrievance} className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm space-y-3.5">
              {/* Train vs Station toggle */}
              <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-700">
                <button
                  type="button"
                  onClick={() => setGrievanceType('TRAIN')}
                  className={`flex-1 py-1.5 rounded-lg transition ${grievanceType === 'TRAIN' ? 'bg-white text-rose-700 shadow-sm' : ''}`}
                >
                  Onboard Train
                </button>
                <button
                  type="button"
                  onClick={() => setGrievanceType('STATION')}
                  className={`flex-1 py-1.5 rounded-lg transition ${grievanceType === 'STATION' ? 'bg-white text-rose-700 shadow-sm' : ''}`}
                >
                  At Railway Station
                </button>
              </div>

              {/* PNR & Coach Details */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">PNR / UTS Number</label>
                  <input 
                    type="text"
                    placeholder="10-digit PNR"
                    value={pnrNumber}
                    onChange={(e) => setPnrNumber(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 outline-none mt-1"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Coach & Berth</label>
                  <input 
                    type="text"
                    placeholder="e.g. B2-23"
                    value={coachSeat}
                    onChange={(e) => setCoachSeat(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 outline-none mt-1"
                  />
                </div>
              </div>

              {/* Category selection */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Grievance Category</label>
                <select 
                  value={complaintCategory}
                  onChange={(e) => {
                    setComplaintCategory(e.target.value);
                    if (e.target.value === 'CLEANLINESS') setComplaintSubcategory('Coach / Toilet Cleanliness');
                    if (e.target.value === 'ELECTRICAL') setComplaintSubcategory('AC / Fan / Socket Malfunction');
                    if (e.target.value === 'WATER') setComplaintSubcategory('Water Supply Unavailable');
                    if (e.target.value === 'FOOD') setComplaintSubcategory('Pantry / Food Quality Issue');
                    if (e.target.value === 'SECURITY') setComplaintSubcategory('RPF Security / Nuisance');
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 outline-none mt-1"
                >
                  <option value="CLEANLINESS">Cleanliness (Toilet, Bedroll, Coach Floor)</option>
                  <option value="ELECTRICAL">Electrical (AC, Fan, Charging Points)</option>
                  <option value="WATER">Water Availability (Toilets & Washbasins)</option>
                  <option value="FOOD">Food & Catering (Overcharging, Quality)</option>
                  <option value="SECURITY">Security / Unauthorised Passengers / RPF</option>
                </select>
              </div>

              {/* Mobile for SMS updates */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Passenger Mobile (for SMS Updates)</label>
                <input 
                  type="tel"
                  value={contactMobile}
                  onChange={(e) => setContactMobile(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 outline-none mt-1"
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Describe The Problem</label>
                <textarea 
                  rows={3}
                  placeholder="Detail the issue so onboard staff can bring the right tools or materials..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-800 outline-none mt-1 focus:border-rose-600 focus:bg-white"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-rose-700 hover:bg-rose-800 text-white font-bold py-3 rounded-2xl text-xs shadow-md shadow-rose-700/25 flex items-center justify-center gap-1.5 active:scale-95 transition"
              >
                <Send className="w-4 h-4" />
                <span>Submit Grievance to Train Captain</span>
              </button>
            </form>
          ) : (
            /* Success confirmation card */
            <div className="bg-white p-5 rounded-3xl border border-rose-200 shadow-xl space-y-4 text-center">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-black px-2.5 py-0.5 rounded-full uppercase">
                  Grievance Dispatched
                </span>
                <h3 className="text-base font-black text-slate-900 mt-1">Ref ID: {registeredSuccess.refId}</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Assigned to Train Captain & Control Room. You will receive real-time SMS updates.
                </p>
              </div>

              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-left text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">Category:</span>
                  <span className="font-bold text-slate-800">{registeredSuccess.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Assigned To:</span>
                  <span className="font-bold text-slate-800">Onboard Housekeeping (OBHS)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Expected Time:</span>
                  <span className="font-bold text-emerald-600">Within 15-20 Mins</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setTrackRefInput(registeredSuccess.refId);
                    setActiveTab('TRACK');
                    setTrackedGrievance(registeredSuccess);
                  }}
                  className="flex-1 bg-rose-700 hover:bg-rose-800 text-white font-bold py-2.5 rounded-xl text-xs shadow"
                >
                  Track Live Resolution
                </button>
                <button
                  onClick={() => setRegisteredSuccess(null)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-2.5 rounded-xl text-xs"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* 2. TRACK STATUS TAB */}
      {activeTab === 'TRACK' && (
        <div className="space-y-4">
          <form onSubmit={handleTrackSubmit} className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-2">
            <input 
              type="text"
              placeholder="Enter Grievance Ref ID or PNR"
              value={trackRefInput}
              onChange={(e) => setTrackRefInput(e.target.value)}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none uppercase"
            />
            <button 
              type="submit"
              className="bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1 shadow"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Track</span>
            </button>
          </form>

          {trackedGrievance && (
            <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Reference ID</span>
                  <div className="text-sm font-black text-rose-950 font-mono">{trackedGrievance.refId}</div>
                </div>
                <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase ${
                  trackedGrievance.status === 'RESOLVED' 
                    ? 'bg-emerald-100 text-emerald-800' 
                    : 'bg-amber-100 text-amber-800 animate-pulse'
                }`}>
                  {trackedGrievance.status}
                </span>
              </div>

              <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-1">
                <div className="font-bold text-slate-800">{trackedGrievance.category}</div>
                <div className="text-[11px] text-slate-500">Remarks: {trackedGrievance.staffRemark}</div>
                <div className="text-[10px] text-slate-400 pt-1">Logged on: {trackedGrievance.date}</div>
              </div>
            </div>
          )}

          {/* Past Complaints List */}
          <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Previous Grievances</h3>
            <div className="divide-y divide-slate-100">
              {grievanceHistory.map(g => (
                <div 
                  key={g.refId}
                  onClick={() => setTrackedGrievance(g)}
                  className="py-2.5 flex items-center justify-between cursor-pointer hover:bg-slate-50 px-2 rounded-xl"
                >
                  <div>
                    <div className="text-xs font-bold text-slate-800">{g.category}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{g.refId} • {g.date}</div>
                  </div>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                    g.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {g.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. EMERGENCY HELP TAB */}
      {activeTab === 'EMERGENCY' && (
        <div className="space-y-3">
          <div className="bg-red-50 border border-red-200 p-4 rounded-3xl text-center space-y-2">
            <ShieldAlert className="w-10 h-10 text-red-600 mx-auto" />
            <h3 className="text-sm font-black text-red-950">Immediate Railway Helplines</h3>
            <p className="text-[11px] text-red-800">
              Available 24x7 for security, medical emergency and accident relief.
            </p>
          </div>

          <div className="space-y-2">
            <a 
              href="tel:139" 
              className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between active:scale-98 transition block"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-black">
                  139
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Rail Madad Integrated Helpline</div>
                  <div className="text-[10px] text-slate-500">Security, Medical, Coach, Enquiries</div>
                </div>
              </div>
              <PhoneCall className="w-4 h-4 text-rose-600" />
            </a>

            <a 
              href="tel:182" 
              className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between active:scale-98 transition block"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-black">
                  182
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Railway Protection Force (RPF)</div>
                  <div className="text-[10px] text-slate-500">Women safety & Crime reporting</div>
                </div>
              </div>
              <PhoneCall className="w-4 h-4 text-blue-600" />
            </a>

            <a 
              href="tel:112" 
              className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between active:scale-98 transition block"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black">
                  112
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">National Emergency Services</div>
                  <div className="text-[10px] text-slate-500">Police, Ambulance, Fire</div>
                </div>
              </div>
              <PhoneCall className="w-4 h-4 text-emerald-600" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

