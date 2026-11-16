import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Plus, 
  Trash2, 
  Clock, 
  Train, 
  MapPin, 
  Radio, 
  RefreshCw 
} from 'lucide-react';

export default function AdminPanel({ trains, onUpdateTrainDelay, onAddTrain }) {
  const [selectedTrainNumber, setSelectedTrainNumber] = useState(trains[0]?.number || '');
  const [newDelay, setNewDelay] = useState('On Time');
  const [newCurrentStation, setNewCurrentStation] = useState('');
  const [newPlatform, setNewPlatform] = useState('PF 1');

  // New Train Form State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTrainNumber, setNewTrainNumber] = useState('');
  const [newTrainName, setNewTrainName] = useState('');
  const [newFrom, setNewFrom] = useState('NDLS');
  const [newTo, setNewTo] = useState('HWH');
  const [newDep, setNewDep] = useState('08:00');
  const [newArr, setNewArr] = useState('20:00');

  const handleUpdateStatus = (e) => {
    e.preventDefault();
    onUpdateTrainDelay(selectedTrainNumber, {
      delay: newDelay,
      currentStation: newCurrentStation || "En Route",
      platform: newPlatform
    });
    alert(`Train #${selectedTrainNumber} live status updated!`);
  };

  const handleCreateTrain = (e) => {
    e.preventDefault();
    if (!newTrainNumber || !newTrainName) return;

    const createdTrain = {
      id: newTrainNumber,
      number: newTrainNumber,
      name: newTrainName,
      from: newFrom,
      to: newTo,
      departure: newDep,
      arrival: newArr,
      duration: "12h 00m",
      runsOn: ["M", "T", "W", "T", "F", "S", "S"],
      classes: [
        { code: "3A", name: "3 Tier AC", fare: 1450, available: 60, status: "AVAILABLE" },
        { code: "SL", name: "Sleeper", fare: 480, available: 120, status: "AVAILABLE" }
      ],
      liveStatus: {
        currentStation: `${newFrom} Jn`,
        delay: "On Time",
        nextStation: `${newTo} Jn`,
        platform: "PF 1",
        updatedAt: "Just now"
      }
    };

    onAddTrain(createdTrain);
    setShowAddModal(false);
    setNewTrainNumber('');
    setNewTrainName('');
    alert("New Train added to Indian Railways inventory!");
  };

  return (
    <div className="p-4 space-y-4 pb-24">
      {/* Admin Header Notice */}
      <div className="bg-slate-900 text-white p-4 rounded-3xl border border-slate-800 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="text-sm font-black">CRIS Operational Controller</h2>
              <span className="text-[10px] text-slate-400">Manage Live Delays & Inventory</span>
            </div>
          </div>
          <button 
            onClick={() => setShowAddModal(!showAddModal)}
            className="bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs px-2.5 py-1.5 rounded-xl flex items-center gap-1 shadow"
          >
            <Plus className="w-3.5 h-3.5" /> Add Train
          </button>
        </div>
      </div>

      {/* Add Train Inline Modal */}
      {showAddModal && (
        <form onSubmit={handleCreateTrain} className="bg-white p-4 rounded-3xl border-2 border-amber-300 shadow-lg space-y-3">
          <h3 className="text-xs font-black text-slate-900 uppercase">Deploy New Train</h3>
          
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[9px] font-bold text-slate-400 uppercase">Train Number</label>
              <input 
                type="text" 
                required 
                placeholder="e.g. 12424" 
                value={newTrainNumber} 
                onChange={(e) => setNewTrainNumber(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-bold"
              />
            </div>
            <div>
              <label className="text-[9px] font-bold text-slate-400 uppercase">Train Name</label>
              <input 
                type="text" 
                required 
                placeholder="e.g. Tejas Superfast" 
                value={newTrainName} 
                onChange={(e) => setNewTrainName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[9px] font-bold text-slate-400 uppercase">Departure Time</label>
              <input 
                type="text" 
                value={newDep} 
                onChange={(e) => setNewDep(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-bold"
              />
            </div>
            <div>
              <label className="text-[9px] font-bold text-slate-400 uppercase">Arrival Time</label>
              <input 
                type="text" 
                value={newArr} 
                onChange={(e) => setNewArr(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-bold"
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 rounded-xl text-xs"
          >
            Save & Publish to RailOne
          </button>
        </form>
      )}

      {/* Update Live Status Form */}
      <form onSubmit={handleUpdateStatus} className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b pb-2">
          <h3 className="text-xs font-black text-slate-900 uppercase flex items-center gap-1.5">
            <Radio className="w-4 h-4 text-rose-500 animate-pulse" />
            Live Delay & Location Broadcaster
          </h3>
        </div>

        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase">Select Active Train</label>
          <select 
            value={selectedTrainNumber}
            onChange={(e) => setSelectedTrainNumber(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 outline-none"
          >
            {trains.map(t => (
              <option key={t.number} value={t.number}>{t.name} ({t.number})</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase">Delay Status</label>
            <select 
              value={newDelay}
              onChange={(e) => setNewDelay(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-bold text-slate-800 outline-none"
            >
              <option value="On Time">On Time</option>
              <option value="15 mins late">15 mins late</option>
              <option value="35 mins late">35 mins late</option>
              <option value="1 hour late">1 hour late</option>
              <option value="2.5 hours late">2.5 hours late</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase">Assigned Platform</label>
            <input 
              type="text"
              value={newPlatform}
              onChange={(e) => setNewPlatform(e.target.value)}
              placeholder="e.g. PF 2"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-bold text-slate-800 outline-none"
            />
          </div>
        </div>

        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase">Current Station Location</label>
          <input 
            type="text"
            value={newCurrentStation}
            onChange={(e) => setNewCurrentStation(e.target.value)}
            placeholder="e.g. Mathura Jn or Kota Jn"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 outline-none"
          />
        </div>

        <button 
          type="submit"
          className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-2.5 rounded-xl text-xs shadow flex items-center justify-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Broadcast Live Update to App
        </button>
      </form>
    </div>
  );
}

