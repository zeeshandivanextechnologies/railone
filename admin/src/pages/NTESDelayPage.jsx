import React, { useState, useEffect } from 'react';
import { 
  Compass, 
  MapPin, 
  Clock, 
  AlertTriangle, 
  Save, 
  CheckCircle, 
  Radio, 
  Navigation,
  Train,
  RefreshCw,
  Search,
  Loader2
} from 'lucide-react';
import { api } from '../services/api.js';

export default function NTESDelayPage({ trains = [], setTrains }) {
  const [selectedTrainNumber, setSelectedTrainNumber] = useState('');
  const [currentStationInput, setCurrentStationInput] = useState('');
  const [delayMinutesInput, setDelayMinutesInput] = useState(0);
  const [platformInput, setPlatformInput] = useState('PF 1');
  const [speedInput, setSpeedInput] = useState(120);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  // Fetch real trains from backend on mount if not already loaded or to refresh
  const loadTrainsFromBackend = async () => {
    setIsLoading(true);
    try {
      const data = await api.getTrains();
      if (Array.isArray(data) && data.length > 0) {
        if (setTrains) setTrains(data);
        if (!selectedTrainNumber || !data.some(t => t.number === selectedTrainNumber)) {
          const first = data[0];
          setSelectedTrainNumber(first.number);
          populateFields(first);
        }
      }
    } catch (err) {
      console.error('Error fetching trains in NTESDelayPage:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTrainsFromBackend();
  }, []);

  const populateFields = (t) => {
    if (!t) return;
    setCurrentStationInput(t.currentLocation || '');
    setDelayMinutesInput(t.delayMinutes ?? 0);
    setPlatformInput(t.platform || 'PF 1');
    setSpeedInput(t.speedKmph ?? 100);
  };

  // Keep activeTrain resolved strictly from backend data
  const activeTrain = trains.find(t => t.number === selectedTrainNumber) || trains[0] || null;

  // Sync inputs when trains list loads from API
  useEffect(() => {
    if (trains.length > 0) {
      const current = trains.find(t => t.number === selectedTrainNumber) || trains[0];
      if (current) {
        if (selectedTrainNumber !== current.number) {
          setSelectedTrainNumber(current.number);
        }
        populateFields(current);
      }
    }
  }, [trains]);

  const handleSelectTrain = (num) => {
    setSelectedTrainNumber(num);
    const t = trains.find(item => item.number === num);
    if (t) {
      populateFields(t);
    }
  };

  const handleSaveGPSOverride = async (e) => {
    e.preventDefault();
    if (!activeTrain?.number) return;

    setIsSaving(true);
    setErrorMessage(null);
    setSavedSuccess(false);

    const updatePayload = {
      currentLocation: currentStationInput || activeTrain.currentLocation,
      delayMinutes: parseInt(delayMinutesInput, 10) || 0,
      platform: platformInput || activeTrain.platform,
      speedKmph: parseInt(speedInput, 10) || 0,
      status: (parseInt(delayMinutesInput, 10) || 0) > 0 ? 'DELAYED' : 'ON_TIME'
    };

    try {
      // 1. Persist to real backend API (PATCH /api/trains/:number/live)
      await api.updateTrainLive(activeTrain.number, updatePayload);

      // 2. Update state so UI and other pages reflect the change immediately
      if (setTrains) {
        setTrains(prev => prev.map(t => {
          if (t.number === activeTrain.number) {
            return {
              ...t,
              ...updatePayload
            };
          }
          return t;
        }));
      }

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to update train live GPS delay:', err);
      setErrorMessage(err.message || 'Failed to update live telemetry in backend database.');
    } finally {
      setIsSaving(false);
    }
  };

  // Filter trains for fleet list
  const filteredFleet = trains.filter(t => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase().trim();
    return (
      (t.name && t.name.toLowerCase().includes(q)) ||
      (t.number && t.number.includes(q)) ||
      (t.currentLocation && t.currentLocation.toLowerCase().includes(q))
    );
  });

  return (
    <div className="p-4 space-y-6 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Compass className="w-5 h-5 text-blue-600" />
            NTES Live GPS & Train Delay Controller
          </h2>
          <p className="text-xs text-slate-500">Override train live coordinates, platform arrival and delay times visible on passenger apps</p>
        </div>

        <button
          type="button"
          onClick={loadTrainsFromBackend}
          disabled={isLoading}
          className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-xs"
          title="Refresh live data from server"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Sync Realtime</span>
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 w-full">
        {/* Left: Train Selector List */}
        <div className="admin-card p-4 sm:p-5 space-y-3 w-full">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Select Active Fleet Rake</h3>
            <span className="text-[10px] text-slate-400 font-mono">({filteredFleet.length} Rakes)</span>
          </div>

          {/* Quick Filter */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search train # or name..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:border-blue-500 transition"
            />
          </div>

          <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
            {filteredFleet.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                No matching trains found.
              </div>
            ) : (
              filteredFleet.map(t => (
                <div 
                  key={t.number}
                  onClick={() => handleSelectTrain(t.number)}
                  className={`p-3 rounded-lg border cursor-pointer transition ${
                    selectedTrainNumber === t.number
                      ? 'bg-blue-50 border-blue-300 text-blue-900 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-900 truncate pr-2">{t.name}</span>
                    <span className="font-mono text-[10px] text-blue-600 font-bold shrink-0">#{t.number}</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px] mt-1 text-slate-500">
                    <span className="truncate pr-1">At: {t.currentLocation || 'En-Route'}</span>
                    <span className={(t.delayMinutes || 0) === 0 ? 'text-emerald-600 font-semibold shrink-0' : 'text-amber-600 font-semibold shrink-0'}>
                      {(t.delayMinutes || 0) === 0 ? 'On Time' : `+${t.delayMinutes}m`}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: GPS Override Controller Form */}
        <div className="xl:col-span-2 admin-card p-6 sm:p-7 space-y-5 w-full">
          {!activeTrain ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-2">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              <p className="text-xs font-semibold">Loading real train telemetry from backend API...</p>
            </div>
          ) : (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Navigation className="w-4 h-4 text-emerald-600 animate-spin" />
                    Live Telemetry Control: {activeTrain.name} (#{activeTrain.number})
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Section Control: Western Railway Operations Division</p>
                </div>

                <span className="bg-emerald-50 text-emerald-700 text-[10px] font-semibold px-2.5 py-1 rounded-full border border-emerald-200 self-start sm:self-auto">
                  GPS Satellite Active
                </span>
              </div>

              {savedSuccess && (
                <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>NTES Data Synced! Passenger RailOne app now displays the updated location & delay.</span>
                </div>
              )}

              {errorMessage && (
                <div className="bg-rose-50 border border-rose-200 p-3 rounded-lg text-xs text-rose-800 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleSaveGPSOverride} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-slate-600 font-semibold uppercase text-[10px]">Current Station / Section Halt</label>
                    <input 
                      type="text" 
                      placeholder={activeTrain.currentLocation}
                      value={currentStationInput}
                      onChange={(e) => setCurrentStationInput(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 font-medium outline-none mt-1 focus:bg-white focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-600 font-semibold uppercase text-[10px]">Expected Platform</label>
                    <input 
                      type="text" 
                      placeholder={activeTrain.platform}
                      value={platformInput}
                      onChange={(e) => setPlatformInput(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 font-medium outline-none mt-1 focus:bg-white focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-slate-600 font-semibold uppercase text-[10px]">Running Delay (Minutes Late)</label>
                    <input 
                      type="number" 
                      placeholder="0 for Right Time"
                      value={delayMinutesInput}
                      onChange={(e) => setDelayMinutesInput(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 font-semibold text-sm outline-none mt-1 focus:bg-white focus:border-blue-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-slate-600 font-semibold uppercase text-[10px]">Section Speed (km/h)</label>
                    <input 
                      type="number" 
                      value={speedInput}
                      onChange={(e) => setSpeedInput(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-blue-700 font-mono font-semibold text-sm outline-none mt-1 focus:bg-white focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-end">
                  <button 
                    type="submit"
                    disabled={isSaving}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-lg text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition disabled:opacity-50"
                  >
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    <span>{isSaving ? 'Updating NTES Engine...' : 'Transmit Realtime Update to RailOne Engine'}</span>
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
