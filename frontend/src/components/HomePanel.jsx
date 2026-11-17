import React, { useState, useEffect, useMemo } from 'react';
import { 
  Train, 
  Search, 
  MapPin, 
  Ticket, 
  CreditCard, 
  AlertCircle, 
  Clock, 
  ChevronRight, 
  Zap, 
  Coffee, 
  LifeBuoy, 
  QrCode,
  ArrowRightLeft,
  Calendar,
  Sparkles,
  ShieldCheck,
  ChevronDown,
  Navigation,
  Layers,
  UtensilsCrossed,
  X,
  Loader2
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.jsx';

export default function HomePanel({ 
  onNavigate, 
  bookings, 
  trains, 
  openTicketModal, 
  walletBalance = 480,
  fromStation: propFromStation,
  setFromStation: propSetFromStation,
  toStation: propToStation,
  setToStation: propSetToStation
}) {
  const { t } = useLanguage();
  const nextJourney = bookings[0];

  // Dynamic Station Selection state fetched live from RailCore Tech API
  const [stationList, setStationList] = useState([]);
  const [internalFromStation, setInternalFromStation] = useState(null);
  const [internalToStation, setInternalToStation] = useState(null);

  const fromStation = propFromStation || internalFromStation || { code: '---', name: 'Select Origin' };
  const setFromStation = propSetFromStation || setInternalFromStation;
  const toStation = propToStation || internalToStation || { code: '---', name: 'Select Destination' };
  const setToStation = propSetToStation || setInternalToStation;

  const [selectingStationType, setSelectingStationType] = useState(null); // 'FROM' | 'TO' | null
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedLetter, setSelectedLetter] = useState('ALL'); // A to Z filter
  const [loadingStations, setLoadingStations] = useState(false);
  const [liveFeaturedTrains, setLiveFeaturedTrains] = useState([]);

  // Fetch real-time live trains from RailCore API gateway
  useEffect(() => {
    fetch('http://localhost:5000/api/trains/featured-live')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setLiveFeaturedTrains(data);
        }
      })
      .catch(() => {});
  }, []);

  // 1. Initial Load: Fetch default active network stations from RailCore API via backend
  useEffect(() => {
    setLoadingStations(true);
    fetch('http://localhost:5000/api/trains/stations')
      .then(r => r.json())
      .then(data => {
        if (data && data.length > 0) {
          setStationList(data);
          if (!propFromStation && !propToStation) {
            setFromStation(data[0]);
            if (data.length > 1) {
              setToStation(data[1]);
            }
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoadingStations(false));
  }, []);

  // 2. Dynamic Fetch on Search (Debounced live lookup via RailRadar API)
  useEffect(() => {
    if (!selectingStationType) return;
    if (searchFilter.trim().length >= 2) {
      const timer = setTimeout(() => {
        setLoadingStations(true);
        fetch(`http://localhost:5000/api/trains/stations?q=${encodeURIComponent(searchFilter.trim())}`)
          .then(r => r.json())
          .then(data => {
            if (data && data.length > 0) {
              setStationList(data);
            }
          })
          .catch(() => {})
          .finally(() => setLoadingStations(false));
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [searchFilter, selectingStationType]);

  // 3. Dynamic Fetch on Letter Click (A-Z live filter via RailRadar API)
  const handleLetterFilterClick = (letter) => {
    setSelectedLetter(letter);
    setSearchFilter('');
    setLoadingStations(true);

    const url = letter === 'ALL' 
      ? 'http://localhost:5000/api/trains/stations' 
      : `http://localhost:5000/api/trains/stations?letter=${letter}`;

    fetch(url)
      .then(r => r.json())
      .then(data => {
        if (data && data.length > 0) {
          setStationList(data);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingStations(false));
  };

  const handleSwapStations = (e) => {
    e.stopPropagation();
    const temp = fromStation;
    setFromStation(toStation);
    setToStation(temp);
  };

  const handleSelectStation = (station) => {
    if (selectingStationType === 'FROM') {
      setFromStation(station);
    } else if (selectingStationType === 'TO') {
      setToStation(station);
    }
    setSelectingStationType(null);
    setSearchFilter('');
    setSelectedLetter('ALL');
  };

  // Alphabet letters A through Z
  const ALPHABETS = ['ALL', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')];

  const filteredStations = useMemo(() => {
    return stationList;
  }, [stationList]);

  return (
    <div className="space-y-4 bg-slate-50 min-h-screen">
      {/* Premium Gradient Hero & Search Header */}
      <div className="bg-gradient-to-b from-blue-900 via-indigo-900 to-blue-950 px-5 pt-3 pb-6 rounded-b-[32px] text-white shadow-xl shadow-blue-950/20 relative">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-[11px] font-medium text-blue-200">{t('welcomeToRailOne')}</div>
            <div className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
              {t('helloTraveler')}
            </div>
          </div>
          <div 
            className="bg-white/10 hover:bg-white/15 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center space-x-1.5 border border-white/15 transition cursor-pointer active:scale-95" 
            onClick={() => onNavigate('wallet')}
          >
            <CreditCard className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-semibold tracking-wide">₹{walletBalance}</span>
            <span className="text-[9px] bg-amber-400 text-blue-950 font-black px-1 rounded ml-1">R-WALLET</span>
          </div>
        </div>

        {/* Floating Modern Train Search Card */}
        <div className="bg-white text-slate-800 p-4 rounded-3xl shadow-xl border border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Train className="w-3.5 h-3.5 text-blue-600" /> {t('bookTicket')}
            </span>
            <span 
              onClick={() => onNavigate('booking')}
              className="text-blue-600 font-semibold text-xs flex items-center gap-0.5 cursor-pointer hover:underline"
            >
              Advanced <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>

          {/* From / To Stations Pill (Fully Dynamic) */}
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80 flex items-center justify-between relative">
            <div 
              className="flex-1 cursor-pointer hover:bg-slate-100/70 p-1.5 rounded-xl transition" 
              onClick={() => setSelectingStationType('FROM')}
              title="Click to change origin station"
            >
              <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{t('fromStation')}</div>
              <div className="text-sm font-bold text-slate-900 leading-tight mt-0.5">{fromStation.code}</div>
              <div className="text-[10px] text-slate-500 truncate">{fromStation.name}</div>
            </div>

            <button 
              type="button"
              onClick={handleSwapStations}
              className="w-8 h-8 rounded-full bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mx-2 hover:bg-blue-100 transition shadow-sm active:scale-90"
              title="Swap From and To stations"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
            </button>

            <div 
              className="flex-1 text-right cursor-pointer hover:bg-slate-100/70 p-1.5 rounded-xl transition" 
              onClick={() => setSelectingStationType('TO')}
              title="Click to change destination station"
            >
              <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{t('toStation')}</div>
              <div className="text-sm font-bold text-slate-900 leading-tight mt-0.5">{toStation.code}</div>
              <div className="text-[10px] text-slate-500 truncate">{toStation.name}</div>
            </div>
          </div>

          {/* Action buttons: Reserved search & Quick UTS */}
          <div className="grid grid-cols-2 gap-2 mt-3.5">
            <button 
              onClick={() => onNavigate('booking')}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-2xl text-xs shadow-lg shadow-blue-600/30 flex items-center justify-center gap-1.5 transition active:scale-95"
            >
              <Search className="w-4 h-4" />
              {t('searchTrains')}
            </button>
            <button 
              onClick={() => onNavigate('uts')}
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold py-3 rounded-2xl text-xs shadow-lg shadow-emerald-700/25 flex items-center justify-center gap-1.5 transition active:scale-95"
            >
              <Ticket className="w-4 h-4" />
              {t('utsSuburban')}
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 space-y-4">
        {/* Active Journey Card */}
        {nextJourney && (
          <div className="bg-white border border-amber-200/70 p-4 rounded-3xl shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-500 to-amber-400 text-slate-950 font-black text-[9px] px-3 py-1 rounded-bl-xl uppercase tracking-wider shadow-sm">
              Active Trip
            </div>

            <div className="flex items-center space-x-2 text-xs font-semibold text-slate-800 mb-2">
              <div className="w-6 h-6 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700">
                <Train className="w-3.5 h-3.5" />
              </div>
              <span className="font-bold">{nextJourney.trainNumber} • {nextJourney.trainName}</span>
            </div>

            <div className="flex items-center justify-between my-2 bg-amber-50/50 p-3 rounded-2xl border border-amber-100/60">
              <div>
                <div className="text-base font-bold text-slate-900 leading-tight">{nextJourney.from}</div>
                <div className="text-[11px] font-medium text-slate-500">{nextJourney.departureTime}</div>
              </div>
              <div className="flex flex-col items-center px-2">
                <span className="text-[10px] text-amber-800 font-bold bg-amber-100/80 px-2 py-0.5 rounded-full">{nextJourney.platform}</span>
                <div className="w-16 border-t-2 border-dashed border-amber-300 my-1 relative">
                  <div className="w-2 h-2 rounded-full bg-amber-600 absolute -top-1 left-1/2 -translate-x-1/2" />
                </div>
                <span className="text-[9px] text-slate-400 font-medium">Coach {nextJourney.coach}</span>
              </div>
              <div className="text-right">
                <div className="text-base font-bold text-slate-900 leading-tight">{nextJourney.to}</div>
                <div className="text-[11px] font-medium text-slate-500">{nextJourney.arrivalTime}</div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 mt-1">
              <span className="text-xs text-slate-500 font-medium">
                PNR: <strong className="font-mono font-bold text-slate-800">{nextJourney.pnr}</strong>
              </span>
              <button 
                onClick={() => openTicketModal(nextJourney)}
                className="bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-semibold px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 shadow transition active:scale-95"
              >
                <QrCode className="w-3.5 h-3.5 text-amber-400" />
                View Ticket QR
              </button>
            </div>
          </div>
        )}

        {/* 6 Essential Services Grid */}
        <div>
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 px-1">
            CRIS Super App Services
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            <button 
              onClick={() => onNavigate('booking')}
              className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col items-center text-center hover:border-blue-400 transition active:scale-95"
            >
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-1.5">
                <Train className="w-5 h-5 stroke-[1.8]" />
              </div>
              <span className="text-xs font-bold text-slate-800">Reserved</span>
              <span className="text-[9px] text-slate-400 mt-0.5">IRCTC Booking</span>
            </button>

            <button 
              onClick={() => onNavigate('uts')}
              className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col items-center text-center hover:border-emerald-400 transition active:scale-95"
            >
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-1.5">
                <Ticket className="w-5 h-5 stroke-[1.8]" />
              </div>
              <span className="text-xs font-bold text-slate-800">UTS Tickets</span>
              <span className="text-[9px] text-slate-400 mt-0.5">General & Daily</span>
            </button>

            <button 
              onClick={() => onNavigate('uts')}
              className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col items-center text-center hover:border-amber-400 transition active:scale-95"
            >
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-1.5">
                <Zap className="w-5 h-5 stroke-[1.8]" />
              </div>
              <span className="text-xs font-bold text-slate-800">Platform</span>
              <span className="text-[9px] text-slate-400 mt-0.5">₹10 Entry Pass</span>
            </button>

            <button 
              onClick={() => onNavigate('tracking')}
              className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col items-center text-center hover:border-indigo-400 transition active:scale-95"
            >
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-1.5">
                <MapPin className="w-5 h-5 stroke-[1.8]" />
              </div>
              <span className="text-xs font-bold text-slate-800">Live Status</span>
              <span className="text-[9px] text-slate-400 mt-0.5">GPS & Delays</span>
            </button>

            <button 
              onClick={() => onNavigate('ecatering')}
              className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col items-center text-center hover:border-orange-400 transition active:scale-95"
            >
              <div className="w-10 h-10 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center mb-1.5">
                <UtensilsCrossed className="w-5 h-5 stroke-[1.8]" />
              </div>
              <span className="text-xs font-bold text-slate-800">e-Catering</span>
              <span className="text-[9px] text-slate-400 mt-0.5">Food on Track</span>
            </button>

            <button 
              onClick={() => onNavigate('madad')}
              className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col items-center text-center hover:border-rose-400 transition active:scale-95"
            >
              <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-1.5">
                <LifeBuoy className="w-5 h-5 stroke-[1.8]" />
              </div>
              <span className="text-xs font-bold text-slate-800">Rail Madad</span>
              <span className="text-[9px] text-slate-400 mt-0.5">Help & RPF</span>
            </button>
          </div>
        </div>

        {/* Realtime Live Train Updates (Powered by RailCore GPS API) */}
        <div className="bg-slate-900 text-white p-4 rounded-3xl shadow-md border border-slate-800">
          <div className="flex items-center justify-between text-xs mb-3">
            <span className="text-amber-400 font-bold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              Live Train Updates
            </span>
            <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">
              RailCore Satellite GPS
            </span>
          </div>

          <div className="space-y-2.5">
            {liveFeaturedTrains && liveFeaturedTrains.length > 0 ? (
              liveFeaturedTrains.map((t) => (
                <div 
                  key={t.id || t.number} 
                  onClick={() => onNavigate('tracking', { trainNumber: t.number || t.id })}
                  className="bg-slate-800/80 hover:bg-slate-800 p-3 rounded-2xl flex items-center justify-between text-xs border border-slate-700/50 cursor-pointer transition active:scale-[0.99]"
                >
                  <div>
                    <div className="font-bold text-slate-100 flex items-center gap-1.5">
                      <span>{t.name}</span>
                      <span className="font-mono text-slate-400 font-normal">({t.number})</span>
                      {t.liveStatus?.isRailRadarLive && (
                        <span className="text-[8px] whitespace-nowrap font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-500/40 px-1.5 py-0.2 rounded">
                          GPS LIVE
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-500" />
                      <span>At {t.liveStatus?.currentStation || t.currentLocation || 'In Transit'}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-bold ${
                      (t.liveStatus?.delay === 'On Time' || t.liveStatus?.delay?.startsWith('0'))
                        ? 'text-emerald-400' 
                        : 'text-amber-400'
                    }`}>
                      {t.liveStatus?.delay || 'On Time'}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5 flex items-center justify-end gap-1">
                      <span>{t.liveStatus?.platform || 'PF 1'}</span>
                      <ChevronRight className="w-3 h-3 text-slate-500" />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-800 text-center text-xs text-slate-400">
                <span className="text-amber-400 font-bold block mb-1">Live Updates Fetching...</span>
                <span>Connecting to RailCore satellite live feed.</span>
              </div>
            )}
          </div>
        </div>

        {/* 139 Helpline Strip */}
        <div className="bg-rose-50 border border-rose-200/80 p-3.5 rounded-2xl flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600 flex-shrink-0">
              <AlertCircle className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-rose-900">Emergency Helpline 139</div>
              <div className="text-[10px] text-rose-700">Security, Medical & Travel Assistance</div>
            </div>
          </div>
          <a href="tel:139" className="bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl shadow-sm transition active:scale-95">
            Call 139
          </a>
        </div>
      </div>

      {/* Dynamic Station Selector Dropdown Modal with compact height */}
      {selectingStationType && (
        <div 
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in"
          onClick={() => { setSelectingStationType(null); setSearchFilter(''); }}
        >
          <div 
            className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-4 space-y-2.5 shadow-2xl max-h-[55vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs font-black text-slate-800">
                  Select {selectingStationType === 'FROM' ? 'Origin (From)' : 'Destination (To)'} Station
                </h3>
              </div>
              <button 
                type="button"
                onClick={() => { setSelectingStationType(null); setSearchFilter(''); }}
                className="w-6 h-6 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 text-xs transition active:scale-90"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Live Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input 
                type="text"
                autoFocus
                placeholder="Search station name or code (e.g. NDLS, MMCT, Jaipur)..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-blue-600 focus:bg-white"
              />
            </div>

            {/* Compact Station Dropdown List */}
            <div className="overflow-y-auto divide-y divide-slate-100 flex-1 pr-1 max-h-48 min-h-[140px]">
              {loadingStations ? (
                <div className="py-8 flex flex-col items-center justify-center text-xs text-blue-600 space-y-1.5">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-[11px] font-semibold text-slate-400">Searching stations...</span>
                </div>
              ) : filteredStations.length > 0 ? (
                filteredStations.map((s) => (
                  <button
                    key={s.code}
                    type="button"
                    onClick={() => handleSelectStation(s)}
                    className="w-full py-2 px-2 flex items-center justify-between hover:bg-blue-50/60 rounded-xl transition text-left group"
                  >
                    <div>
                      <div className="text-xs font-black text-slate-800 group-hover:text-blue-700 transition">
                        {s.name}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {s.city ? `${s.city}` : (s.state || 'Indian Railways')}
                      </div>
                    </div>
                    <span className="font-mono text-[11px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-lg border border-blue-100">
                      {s.code}
                    </span>
                  </button>
                ))
              ) : (
                <div className="py-6 text-center text-xs text-slate-400">
                  No matching station found.
                </div>
              )}
            </div>

            {/* Compact Footer station count */}
            <div className="text-[9px] text-slate-400 text-center pt-1 border-t border-slate-100 flex items-center justify-between">
              <span>{filteredStations.length} Stations Available</span>
              <span className="text-emerald-600 font-bold">RailRadar Live Network</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
