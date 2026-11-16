import React, { useState, useEffect } from 'react';
import { 
  Train, 
  Plus, 
  Search, 
  Trash2, 
  CheckCircle, 
  Clock, 
  MapPin, 
  X,
  RefreshCw,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api.js';

export default function TrainOperationsPage({ trains = [], setTrains }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  // New Train Form State
  const [trainNumber, setTrainNumber] = useState('');
  const [trainName, setTrainName] = useState('');
  const [fromStation, setFromStation] = useState('NDLS');
  const [toStation, setToStation] = useState('MMCT');
  const [trainType, setTrainType] = useState('VANDE_BHARAT');
  const [departureTime, setDepartureTime] = useState('06:00');
  const [arrivalTime, setArrivalTime] = useState('14:30');
  const [zone, setZone] = useState('NR');
  const [rakes, setRakes] = useState(16);

  // Fetch real trains from backend API on mount
  const refreshTrainsFromApi = async () => {
    setIsLoading(true);
    try {
      const data = await api.getTrains([]);
      if (Array.isArray(data) && data.length > 0) {
        setTrains(data);
      }
    } catch (err) {
      console.error('Failed to fetch trains from API:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshTrainsFromApi();
  }, []);

  // Handle Search through API if user searches by text
  useEffect(() => {
    if (!searchQuery.trim()) return;
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/trains?q=${encodeURIComponent(searchQuery.trim())}`);
        if (res.ok) {
          const searchResults = await res.json();
          if (Array.isArray(searchResults)) {
            setTrains(prev => {
              const map = new Map(searchResults.map(t => [t.number, t]));
              prev.forEach(t => {
                if (!map.has(t.number)) map.set(t.number, t);
              });
              return Array.from(map.values());
            });
          }
        }
      } catch (_) {}
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const filteredTrains = (trains || []).filter(t => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || 
                          (t.name && t.name.toLowerCase().includes(q)) || 
                          (t.number && t.number.includes(q)) ||
                          (t.from && t.from.toLowerCase().includes(q)) ||
                          (t.to && t.to.toLowerCase().includes(q));
    const matchesFilter = filterType === 'ALL' || t.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const handleCreateTrain = async (e) => {
    e.preventDefault();
    if (!trainNumber.trim() || !trainName.trim()) return;

    setIsSubmitting(true);
    const newTrain = {
      id: trainNumber.trim(),
      number: trainNumber.trim(),
      name: trainName.trim(),
      from: fromStation.trim().toUpperCase(),
      to: toStation.trim().toUpperCase(),
      departure: departureTime,
      arrival: arrivalTime,
      type: trainType,
      zone: zone.trim().toUpperCase(),
      status: "ON_TIME",
      currentLocation: `${fromStation.trim().toUpperCase()} Yard`,
      platform: "PF 1",
      delayMinutes: 0,
      speedKmph: 0,
      occupancyPercent: 100,
      rakes: parseInt(rakes) || 16,
      pantryVendor: "IRCTC Catering"
    };

    try {
      // 1. Send to Backend Database API
      const created = await api.createTrain(newTrain);
      setTrains(prev => [created || newTrain, ...prev.filter(t => t.number !== newTrain.number)]);
      
      setStatusMessage({ type: 'success', text: `Train #${newTrain.number} added successfully to Indian Railways network!` });
      setTimeout(() => setStatusMessage(null), 4000);

      setShowAddModal(false);
      setTrainNumber('');
      setTrainName('');
    } catch (err) {
      console.error('Error creating train:', err);
      setStatusMessage({ type: 'error', text: 'Failed to add train to database. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTrain = async (id, number) => {
    const trainIdentifier = number || id;
    if (confirm(`Are you sure you want to decommission / cancel train service #${trainIdentifier}?`)) {
      try {
        await api.deleteTrain(trainIdentifier);
        setTrains(prev => prev.filter(t => t.id !== id && t.number !== trainIdentifier));
        setStatusMessage({ type: 'success', text: `Train #${trainIdentifier} decommissioned from database.` });
        setTimeout(() => setStatusMessage(null), 3000);
      } catch (err) {
        console.error('Error deleting train:', err);
        setStatusMessage({ type: 'error', text: `Failed to decommission train #${trainIdentifier}.` });
      }
    }
  };

  return (
    <div className="p-4  space-y-5 w-full">
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Train className="w-5 h-5 text-blue-600" />
            Fleet & Timetable Operations
          </h2>
          <p className="text-xs text-slate-500">Live Indian Railways fleet rakes, routes and timetables from Backend API</p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button 
            type="button"
            onClick={refreshTrainsFromApi}
            disabled={isLoading}
            className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition disabled:opacity-50"
            title="Refresh from Database"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg text-xs flex items-center gap-1.5 shadow-sm transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Train</span>
          </button>
        </div>
      </div>

      {/* Status banner */}
      {statusMessage && (
        <div className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 animate-in fade-in ${
          statusMessage.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          {statusMessage.type === 'success' ? (
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 w-full">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search train by name, number, origin or destination..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-500 shadow-xs"
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {['ALL', 'RAJDHANI', 'VANDE_BHARAT', 'SHATABDI'].map(cat => (
            <button
              key={cat}
              onClick={() => setFilterType(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition whitespace-nowrap ${
                filterType === cat 
                  ? 'bg-blue-50 border-blue-200 text-blue-700' 
                  : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {cat.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Train Cards Table */}
      <div className="admin-card overflow-hidden w-full">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-xs min-w-[700px]">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3.5">Train Rake</th>
                <th className="py-2.5 px-3.5">Origin ➔ Destination</th>
                <th className="py-2.5 px-3.5">Schedule</th>
                <th className="py-2.5 px-3.5">Type / Zone</th>
                <th className="py-2.5 px-3.5">Rakes</th>
                <th className="py-2.5 px-3.5">Current Status</th>
                <th className="py-2.5 px-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTrains.map(t => (
                <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-3.5">
                    <div className="font-semibold text-slate-900">{t.name}</div>
                    <div className="text-[10px] text-blue-600 font-mono mt-0.5">#{t.number}</div>
                  </td>
                  <td className="py-3 px-3.5 font-medium text-slate-800">
                    {t.from} <span className="text-slate-400 mx-1">➔</span> {t.to}
                  </td>
                  <td className="py-3 px-3.5">
                    <div className="text-slate-800 font-medium">{t.departure} - {t.arrival}</div>
                    <div className="text-[10px] text-slate-400">Daily Regular</div>
                  </td>
                  <td className="py-3 px-3.5">
                    <span className="bg-slate-100 text-slate-700 text-[10px] font-semibold px-2 py-0.5 rounded border border-slate-200">
                      {t.type} • {t.zone}
                    </span>
                  </td>
                  <td className="py-3 px-3.5 text-slate-700">
                    {t.rakes} Coaches
                  </td>
                  <td className="py-3 px-3.5">
                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                      {t.currentLocation} ({t.status})
                    </span>
                  </td>
                  <td className="py-3 px-3.5 text-right">
                    <button 
                      onClick={() => handleDeleteTrain(t.id, t.number)}
                      className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                      title="Decommission Train"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Train Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 max-w-lg w-full space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Train className="w-4 h-4 text-blue-600" />
                Add Train Service
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTrain} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-500 font-semibold text-[10px] uppercase">Train Number (5 Digit)</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. 20901"
                    value={trainNumber}
                    onChange={(e) => setTrainNumber(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 outline-none mt-1 focus:bg-white focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-slate-500 font-semibold text-[10px] uppercase">Train Name</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. Vande Bharat Express"
                    value={trainName}
                    onChange={(e) => setTrainName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 outline-none mt-1 focus:bg-white focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-500 font-semibold text-[10px] uppercase">Origin Station Code</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. NDLS"
                    value={fromStation}
                    onChange={(e) => setFromStation(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 outline-none mt-1 focus:bg-white focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-slate-500 font-semibold text-[10px] uppercase">Destination Station Code</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. BRC"
                    value={toStation}
                    onChange={(e) => setToStation(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 outline-none mt-1 focus:bg-white focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-500 font-semibold text-[10px] uppercase">Departure Time</label>
                  <input 
                    type="time" 
                    value={departureTime}
                    onChange={(e) => setDepartureTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 outline-none mt-1 focus:bg-white focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-slate-500 font-semibold text-[10px] uppercase">Arrival Time</label>
                  <input 
                    type="time" 
                    value={arrivalTime}
                    onChange={(e) => setArrivalTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 outline-none mt-1 focus:bg-white focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-500 font-semibold text-[10px] uppercase">Category</label>
                  <select 
                    value={trainType} 
                    onChange={(e) => setTrainType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 outline-none mt-1"
                  >
                    <option value="VANDE_BHARAT">Vande Bharat</option>
                    <option value="RAJDHANI">Rajdhani</option>
                    <option value="SHATABDI">Shatabdi</option>
                    <option value="MAIL_EXP">Mail / Express</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-500 font-semibold text-[10px] uppercase">Zone</label>
                  <input 
                    type="text" 
                    value={zone} 
                    onChange={(e) => setZone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 outline-none mt-1"
                  />
                </div>
                <div>
                  <label className="text-slate-500 font-semibold text-[10px] uppercase">Coaches</label>
                  <input 
                    type="number" 
                    value={rakes} 
                    onChange={(e) => setRakes(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 outline-none mt-1"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-xs"
                >
                  Save Train
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
