import React, { useState, useEffect, useMemo } from 'react';
import { 
  Ticket, 
  MapPin, 
  QrCode, 
  Smartphone, 
  Clock, 
  CreditCard, 
  CheckCircle, 
  ShieldCheck, 
  Info, 
  Sparkles,
  ArrowRight,
  Layers,
  RefreshCw,
  Navigation,
  ArrowRightLeft,
  Search,
  X,
  Loader2
} from 'lucide-react';
import confetti from 'canvas-confetti';

const API_BASE = 'http://localhost:5000/api';

export default function UTSPlatformPanel({ 
  stations = [], 
  user,
  walletBalance = 480, 
  setWalletBalance,
  onBookSuccess, 
  onOpenTicketModal,
  onOpenAuth,
  onUpdateUser 
}) {
  const [ticketCategory, setTicketCategory] = useState('JOURNEY'); // JOURNEY (Unreserved) | PLATFORM | SEASON
  const [ticketSubtype, setTicketSubtype] = useState('PAPERLESS'); // PAPERLESS (Show on Phone) | PAPER (Print at Kiosk)
  
  // Dynamic Station State
  const [fromStation, setFromStation] = useState({ code: 'NDLS', name: 'New Delhi' });
  const [toStation, setToStation] = useState({ code: 'CNB', name: 'Kanpur Central' });
  const [platformStation, setPlatformStation] = useState({ code: 'NDLS', name: 'New Delhi' });

  // Station picker modal state
  const [selectingStationType, setSelectingStationType] = useState(null); // 'FROM' | 'TO' | 'PLATFORM' | null
  const [stationList, setStationList] = useState(stations && stations.length > 0 ? stations : []);
  const [stationSearchFilter, setStationSearchFilter] = useState('');
  const [selectedLetter, setSelectedLetter] = useState('ALL');
  const [loadingStations, setLoadingStations] = useState(false);

  // Sync stationList when parent stations prop updates
  useEffect(() => {
    if (stations && stations.length > 0 && stationList.length === 0) {
      setStationList(stations);
    }
  }, [stations]);

  // Form selections
  const [passengerCount, setPassengerCount] = useState(1);
  const [trainType, setTrainType] = useState('ORDINARY'); // ORDINARY | MAIL_EXP | SUPERFAST
  const [paymentMode, setPaymentMode] = useState('R_WALLET'); // R_WALLET | UPI
  
  // Platform Ticket Specifics
  const [platformDuration, setPlatformDuration] = useState('2 Hours');
  const [platformPersons, setPlatformPersons] = useState(1);

  // Season Ticket Specifics
  const [seasonDuration, setSeasonDuration] = useState('MONTHLY'); // MONTHLY | QUARTERLY
  const [seasonClass, setSeasonClass] = useState('SECOND'); // SECOND | FIRST

  // Dynamic Fare & Route state from API
  const [apiFareData, setApiFareData] = useState(null);
  const [loadingFare, setLoadingFare] = useState(false);

  const [lastGeneratedTicket, setLastGeneratedTicket] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // 1. Fetch dynamic stations from backend
  useEffect(() => {
    fetchStations();
  }, []);

  // Fetch dynamic fare directly from Railway UTS Fare API whenever selections change
  useEffect(() => {
    const fetchDynamicFare = async () => {
      setLoadingFare(true);
      try {
        const params = new URLSearchParams({
          category: ticketCategory,
          from: fromStation?.code || 'NDLS',
          to: toStation?.code || 'CNB',
          platformStation: platformStation?.code || 'NDLS',
          trainType: trainType,
          passengerCount: ticketCategory === 'PLATFORM' ? platformPersons : passengerCount,
          duration: seasonDuration,
          seasonClass: seasonClass
        });
        const res = await fetch(`${API_BASE}/trains/uts/fare?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setApiFareData(data);
          }
        }
      } catch (err) {
        console.warn('Fare API warning:', err.message);
      } finally {
        setLoadingFare(false);
      }
    };

    fetchDynamicFare();
  }, [ticketCategory, fromStation?.code, toStation?.code, platformStation?.code, trainType, passengerCount, platformPersons, seasonDuration, seasonClass]);

  const fetchStations = async (query = '', letter = 'ALL') => {
    setLoadingStations(true);
    let url = `${API_BASE}/trains/stations`;
    if (query && query.trim().length >= 2) {
      url += `?q=${encodeURIComponent(query.trim())}`;
    } else if (letter && letter !== 'ALL') {
      url += `?letter=${letter}`;
    }

    try {
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setStationList(data);
        if (data.length > 0 && !fromStation?.name) {
          const ndls = data.find(s => s.code === 'NDLS') || data[0];
          const cnb = data.find(s => s.code === 'CNB') || data[1] || data[0];
          setFromStation(ndls);
          setToStation(cnb);
          setPlatformStation(ndls);
        }
      }
    } catch (_) {}
    finally {
      setLoadingStations(false);
    }
  };

  // Debounced live station search
  useEffect(() => {
    if (!selectingStationType) return;
    if (stationSearchFilter.trim().length >= 2) {
      const timer = setTimeout(() => {
        fetchStations(stationSearchFilter);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [stationSearchFilter, selectingStationType]);

  const handleLetterClick = (ltr) => {
    setSelectedLetter(ltr);
    setStationSearchFilter('');
    fetchStations('', ltr);
  };

  const handleSelectStation = (stn) => {
    if (selectingStationType === 'FROM') {
      setFromStation(stn);
    } else if (selectingStationType === 'TO') {
      setToStation(stn);
    } else if (selectingStationType === 'PLATFORM') {
      setPlatformStation(stn);
    }
    setSelectingStationType(null);
    setStationSearchFilter('');
    setSelectedLetter('ALL');
  };

  const swapStations = () => {
    const temp = fromStation;
    setFromStation(toStation);
    setToStation(temp);
  };

  // Fare calculations: Uses dynamic fare from API with fallback
  const calculateFare = () => {
    if (apiFareData && typeof apiFareData.totalFare === 'number') {
      return apiFareData.totalFare;
    }
    if (ticketCategory === 'PLATFORM') {
      return platformPersons * 10;
    }
    if (ticketCategory === 'SEASON') {
      const base = seasonDuration === 'MONTHLY' ? 180 : 490;
      return seasonClass === 'FIRST' ? Math.round(base * 2.8) : base;
    }
    // General journey ticket base calculation
    let baseRate = 35;
    if (trainType === 'MAIL_EXP') baseRate = 55;
    if (trainType === 'SUPERFAST') baseRate = 75;
    return baseRate * passengerCount;
  };

  const finalFare = calculateFare();
  const rWalletDiscount = paymentMode === 'R_WALLET' ? Math.round(finalFare * 0.03) : 0;
  const payableAmount = Math.max(1, finalFare - rWalletDiscount);

  // Dynamic booking handler: updates PostgreSQL bookings & R-Wallet
  const handleBookTicket = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    // If R-Wallet selected, check balance
    if (paymentMode === 'R_WALLET' && walletBalance !== undefined && walletBalance < payableAmount) {
      setErrorMessage(`Insufficient R-Wallet balance (₹${walletBalance}). Please recharge your wallet or choose UPI.`);
      return;
    }

    setIsSubmitting(true);

    const randomPnr = "UTS" + Math.floor(10000000 + Math.random() * 90000000).toString();
    const isPlatform = ticketCategory === 'PLATFORM';
    const isSeason = ticketCategory === 'SEASON';

    const originCode = isPlatform ? platformStation.code : fromStation.code;
    const destCode = isPlatform ? platformStation.code : toStation.code;

    // Use API validity & coach descriptions
    const seasonValidityLabel = apiFareData?.validity || (seasonDuration === 'QUARTERLY' ? '90 Days Validity' : '30 Days Validity');
    const seasonValidUntil = apiFareData?.validUntil || new Date(Date.now() + (seasonDuration === 'QUARTERLY' ? 90 : 30) * 24 * 3600 * 1000).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

    const newTicket = {
      pnr: randomPnr,
      ticketType: isPlatform ? 'PLATFORM' : (isSeason ? 'SEASON' : 'UTS'),
      from: originCode,
      to: destCode,
      trainNumber: isPlatform ? 'PLATFORM-PASS' : (isSeason ? 'SUBURBAN-PASS' : 'ALL-UNRESERVED'),
      trainName: isPlatform 
        ? `Platform Pass (${platformStation.name})` 
        : (isSeason 
            ? `${seasonDuration === 'QUARTERLY' ? 'Quarterly' : 'Monthly'} Suburban Pass (${fromStation.code}-${toStation.code})` 
            : `General Second Class (${trainType})`),
      date: 'Valid Today',
      departureTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      arrivalTime: isPlatform ? '+2 Hours' : (isSeason ? seasonValidityLabel : 'Same Day Midnight'),
      coach: isPlatform ? 'Platform Entry' : (isSeason ? (seasonClass === 'FIRST' ? 'First Class FC' : 'General II') : 'General GS/II'),
      seat: isPlatform ? `${platformPersons} Person(s)` : (isSeason ? 'Pass Holder (Unreserved)' : `${passengerCount} Seat(s) Unreserved`),
      className: isPlatform ? 'PLATFORM' : (isSeason ? (seasonClass === 'FIRST' ? 'First Class (FC)' : 'Second Class (II)') : 'GEN / II'),
      quota: isSeason ? 'SEASON' : 'GENERAL',
      status: 'ACTIVE & VALID',
      platform: 'Any Platform',
      passengerName: user ? user.name : (isPlatform ? `${platformPersons} Person(s)` : (isSeason ? 'Pass Holder' : `${passengerCount} Passenger(s)`)),
      fare: payableAmount,
      bookingDate: 'Just now',
      isPaperless: ticketSubtype === 'PAPERLESS',
      validUntil: isPlatform 
        ? new Date(Date.now() + 2 * 3600 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
        : (isSeason ? seasonValidUntil : 'Today Midnight'),
      userId: user?.id || null
    };

    try {
      // 1. Save ticket into PostgreSQL bookings table
      await fetch(`${API_BASE}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTicket)
      });

      // 2. Deduct fare from R-Wallet if paid via wallet & log in passbook ledger
      if (paymentMode === 'R_WALLET' && setWalletBalance) {
        const nextBalance = Math.max(0, walletBalance - payableAmount);
        setWalletBalance(nextBalance);
        if (user && user.id) {
          if (onUpdateUser) {
            onUpdateUser({ ...user, wallet: nextBalance });
          }
          await fetch(`${API_BASE}/wallet/debit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              userId: user.id, 
              amount: payableAmount, 
              pnr: newTicket.utsNumber || newTicket.ticketNo,
              title: `${newTicket.ticketType || 'UTS'} Ticket (${newTicket.sourceCode || newTicket.sourceStation || ''} to ${newTicket.destCode || newTicket.destinationStation || 'PF'})` 
            })
          }).catch(() => {});
        }
      }

      if (onBookSuccess) onBookSuccess(newTicket);
      setLastGeneratedTicket(newTicket);

      try {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 }
        });
      } catch (_) {}
    } catch (err) {
      setErrorMessage(err.message || 'Ticket generation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const ALPHABETS = ['ALL', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')];

  return (
    <div className="p-4 space-y-4 pb-28">
      {/* Banner CRIS UTS Official System */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 text-white p-4 rounded-3xl shadow-lg relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="bg-amber-400 text-blue-950 font-black text-[10px] px-2 py-0.5 rounded shadow">UTS</span>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-200">Paperless Ticketing</span>
          </div>
          <div className="flex items-center space-x-1 text-[10px] bg-white/10 px-2.5 py-1 rounded-full text-emerald-300 font-bold border border-white/15">
            <Navigation className="w-3 h-3 text-emerald-400 animate-spin" />
            <span>GPS Geofence: Active</span>
          </div>
        </div>
        <h2 className="text-base font-black mt-2 text-white">Unreserved & Platform Engine</h2>
        <p className="text-[11px] text-emerald-100 mt-0.5">
          Zero queue. Instant QR ticket on mobile with 3% R-Wallet incentive.
        </p>
      </div>

      {/* Primary Category Switcher */}
      <div className="bg-slate-200 p-1 rounded-2xl flex text-xs font-bold text-slate-700">
        <button
          type="button"
          onClick={() => { setTicketCategory('JOURNEY'); setLastGeneratedTicket(null); setErrorMessage(''); }}
          className={`flex-1 py-2 rounded-xl transition ${ticketCategory === 'JOURNEY' ? 'bg-emerald-700 text-white shadow' : 'hover:text-slate-900'}`}
        >
          General Journey
        </button>
        <button
          type="button"
          onClick={() => { setTicketCategory('PLATFORM'); setLastGeneratedTicket(null); setErrorMessage(''); }}
          className={`flex-1 py-2 rounded-xl transition ${ticketCategory === 'PLATFORM' ? 'bg-emerald-700 text-white shadow' : 'hover:text-slate-900'}`}
        >
          Platform Ticket
        </button>
        <button
          type="button"
          onClick={() => { setTicketCategory('SEASON'); setLastGeneratedTicket(null); setErrorMessage(''); }}
          className={`flex-1 py-2 rounded-xl transition ${ticketCategory === 'SEASON' ? 'bg-emerald-700 text-white shadow' : 'hover:text-slate-900'}`}
        >
          Season Pass
        </button>
      </div>

      {/* Paperless vs Paper Option */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900">Book & Travel (Paperless)</div>
            <div className="text-[10px] text-slate-500">Show QR to TTE directly on screen</div>
          </div>
        </div>
        <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
          Recommended
        </span>
      </div>

      {errorMessage && (
        <div className="bg-rose-50 border border-rose-200 p-3 rounded-2xl text-xs text-rose-700 font-medium">
          {errorMessage}
        </div>
      )}

      {/* Main Form based on category */}
      {!lastGeneratedTicket ? (
        <form onSubmit={handleBookTicket} className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm space-y-3.5">
          {ticketCategory === 'JOURNEY' && (
            <>
              {/* Dynamic Station Selection with 1-Click Picker */}
              <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-2xl border border-slate-200">
                <div 
                  className="flex-1 cursor-pointer hover:bg-slate-100 p-2 rounded-xl transition"
                  onClick={() => { setSelectingStationType('FROM'); setStationSearchFilter(''); }}
                >
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">From Station</label>
                  <div className="text-sm font-black text-slate-900 mt-0.5">{fromStation.code}</div>
                  <div className="text-[10px] text-slate-500 truncate">{fromStation.name}</div>
                </div>

                <button 
                  type="button"
                  onClick={swapStations}
                  className="mx-2 p-2 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 shadow-sm active:scale-90 transition border border-emerald-200"
                  title="Swap stations"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                </button>

                <div 
                  className="flex-1 cursor-pointer text-right hover:bg-slate-100 p-2 rounded-xl transition"
                  onClick={() => { setSelectingStationType('TO'); setStationSearchFilter(''); }}
                >
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">To Station</label>
                  <div className="text-sm font-black text-slate-900 mt-0.5">{toStation.code}</div>
                  <div className="text-[10px] text-slate-500 truncate">{toStation.name}</div>
                </div>
              </div>

              {/* Train Type & Passenger Count */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Train Type</label>
                  <select 
                    value={trainType}
                    onChange={(e) => setTrainType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 outline-none mt-1"
                  >
                    <option value="ORDINARY">Ordinary / Passenger</option>
                    <option value="MAIL_EXP">Mail / Express</option>
                    <option value="SUPERFAST">Superfast Express</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Passengers</label>
                  <select 
                    value={passengerCount}
                    onChange={(e) => setPassengerCount(parseInt(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 outline-none mt-1"
                  >
                    <option value={1}>1 Adult</option>
                    <option value={2}>2 Adults</option>
                    <option value={3}>3 Adults</option>
                    <option value={4}>4 Adults</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {ticketCategory === 'PLATFORM' && (
            <>
              {/* Dynamic Platform Station Selection */}
              <div 
                className="bg-slate-50 hover:bg-slate-100 p-3 rounded-2xl border border-slate-200 cursor-pointer transition"
                onClick={() => { setSelectingStationType('PLATFORM'); setStationSearchFilter(''); }}
              >
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Platform Station</label>
                <div className="flex items-center justify-between mt-0.5">
                  <div>
                    <div className="text-sm font-black text-slate-900">{platformStation.code}</div>
                    <div className="text-[10px] text-slate-500 truncate">{platformStation.name}</div>
                  </div>
                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
                    Change Station
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Number of Persons</label>
                  <select 
                    value={platformPersons}
                    onChange={(e) => setPlatformPersons(parseInt(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 outline-none mt-1"
                  >
                    <option value={1}>1 Person</option>
                    <option value={2}>2 Persons</option>
                    <option value={3}>3 Persons</option>
                    <option value={4}>4 Persons</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Validity Period</label>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-700 mt-1 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    <span>2 Hours from Booking</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {ticketCategory === 'SEASON' && (
            <>
              {/* Dynamic From/To Station Selection */}
              <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-2xl border border-slate-200">
                <div 
                  className="flex-1 cursor-pointer hover:bg-slate-100 p-2 rounded-xl transition"
                  onClick={() => { setSelectingStationType('FROM'); setStationSearchFilter(''); }}
                >
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">From Station</label>
                  <div className="text-sm font-black text-slate-900 mt-0.5">{fromStation.code}</div>
                  <div className="text-[10px] text-slate-500 truncate">{fromStation.name}</div>
                </div>

                <button 
                  type="button"
                  onClick={swapStations}
                  className="mx-2 p-2 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 shadow-sm active:scale-90 transition border border-emerald-200"
                  title="Swap stations"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                </button>

                <div 
                  className="flex-1 cursor-pointer text-right hover:bg-slate-100 p-2 rounded-xl transition"
                  onClick={() => { setSelectingStationType('TO'); setStationSearchFilter(''); }}
                >
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">To Station</label>
                  <div className="text-sm font-black text-slate-900 mt-0.5">{toStation.code}</div>
                  <div className="text-[10px] text-slate-500 truncate">{toStation.name}</div>
                </div>
              </div>

              {/* Train Type Selection for MST (Passenger / Mail Exp / Superfast) */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Train Type Allowed</label>
                <select 
                  value={trainType}
                  onChange={(e) => setTrainType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 outline-none mt-1"
                >
                  {apiFareData?.availableTrainTypes && apiFareData.availableTrainTypes.length > 0 ? (
                    apiFareData.availableTrainTypes.map(tt => (
                      <option key={tt.code} value={tt.code}>
                        {tt.label}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="ORDINARY">Ordinary / Passenger Trains</option>
                      <option value="MAIL_EXP">Mail / Express Trains</option>
                      <option value="SUPERFAST">Superfast Express Trains (+₹45 SF Levy)</option>
                    </>
                  )}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Pass Duration</label>
                  <select 
                    value={seasonDuration}
                    onChange={(e) => setSeasonDuration(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 outline-none mt-1"
                  >
                    {apiFareData?.availableDurations && apiFareData.availableDurations.length > 0 ? (
                      apiFareData.availableDurations.map(dur => (
                        <option key={dur.code} value={dur.code}>
                          {dur.label}
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="MONTHLY">Monthly Pass (MST - 30 Days)</option>
                        <option value="QUARTERLY">Quarterly Pass (QST - 90 Days)</option>
                      </>
                    )}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Travel Class</label>
                  <select 
                    value={seasonClass}
                    onChange={(e) => setSeasonClass(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 outline-none mt-1"
                  >
                    <option value="SECOND">Second Class (II / GS - Daily MST)</option>
                  </select>
                </div>
              </div>

              {/* Dynamic Season Pass Details Banner from API */}
              {apiFareData && ticketCategory === 'SEASON' && (
                <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-emerald-700" />
                    <div>
                      <span className="text-[10px] font-bold text-emerald-800 block">Pass Validity:</span>
                      <span className="font-bold text-emerald-900 text-[11px]">{apiFareData.validity || `${apiFareData.validityDays} Days`}</span>
                    </div>
                  </div>
                  {apiFareData.distanceKm && (
                    <span className="text-[10px] font-bold bg-white text-emerald-800 px-2 py-0.5 rounded-lg border border-emerald-200 shadow-2xs">
                      {apiFareData.distanceKm} km Suburban
                    </span>
                  )}
                </div>
              )}
            </>
          )}

          {/* Payment Selection */}
          <div className="pt-2 border-t border-slate-100">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Payment Mode</label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <button
                type="button"
                onClick={() => setPaymentMode('R_WALLET')}
                className={`p-2.5 rounded-xl border text-left transition flex flex-col ${paymentMode === 'R_WALLET' ? 'border-emerald-600 bg-emerald-50 text-emerald-950 ring-1 ring-emerald-500' : 'border-slate-200 bg-slate-50 text-slate-700'}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold flex items-center gap-1">
                    <CreditCard className="w-3.5 h-3.5 text-emerald-600" /> R-Wallet
                  </span>
                  <span className="text-[9px] bg-amber-400 text-blue-950 font-black px-1 rounded">3% OFF</span>
                </div>
                <span className="text-[10px] text-slate-500 mt-0.5">Bal: ₹{walletBalance}</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMode('UPI')}
                className={`p-2.5 rounded-xl border text-left transition flex flex-col ${paymentMode === 'UPI' ? 'border-emerald-600 bg-emerald-50 text-emerald-950 ring-1 ring-emerald-500' : 'border-slate-200 bg-slate-50 text-slate-700'}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">UPI / GPay</span>
                </div>
                <span className="text-[10px] text-slate-500 mt-0.5">Net Banking & Cards</span>
              </button>
            </div>
          </div>

          {/* Fare Summary & Button */}
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-slate-500 font-semibold">Total Fare:</span>
                {apiFareData?.distanceKm && ticketCategory !== 'PLATFORM' && (
                  <span className="text-[9px] font-bold text-slate-400 bg-slate-200/60 px-1.5 py-0.2 rounded">
                    {apiFareData.distanceKm} km
                  </span>
                )}
              </div>
              <div className="flex items-baseline space-x-1.5">
                <span className="text-base font-black text-slate-900">
                  {loadingFare ? '...' : `₹${payableAmount}`}
                </span>
                {rWalletDiscount > 0 && (
                  <span className="text-[10px] text-emerald-600 font-bold">Saved ₹{rWalletDiscount}</span>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow-md shadow-emerald-700/20 flex items-center gap-1.5 active:scale-95 transition"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>Book Ticket</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </form>
      ) : (
        /* Instant Paperless Digital Ticket Display */
        <div className="bg-white p-5 rounded-3xl border border-emerald-300 shadow-xl space-y-4 text-center animate-in fade-in">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle className="w-7 h-7" />
          </div>

          <div>
            <div className="inline-block bg-emerald-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider mb-1">
              Active Paperless Ticket
            </div>
            <h3 className="text-base font-black text-slate-900">{lastGeneratedTicket.trainName}</h3>
            <p className="text-[11px] text-emerald-700 font-mono font-bold mt-0.5">{lastGeneratedTicket.pnr}</p>
          </div>

          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex justify-between text-left text-xs">
            <div>
              <span className="text-[9px] font-bold text-slate-400 uppercase">Station / Route</span>
              <div className="font-bold text-slate-800">
                {lastGeneratedTicket.ticketType === 'PLATFORM' ? lastGeneratedTicket.from : `${lastGeneratedTicket.from} ➔ ${lastGeneratedTicket.to}`}
              </div>
            </div>
            <div className="text-right">
              <span className="text-[9px] font-bold text-slate-400 uppercase">Valid Up to</span>
              <div className="font-bold text-emerald-700">{lastGeneratedTicket.validUntil}</div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => onOpenTicketModal(lastGeneratedTicket)}
              className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow"
            >
              <QrCode className="w-4 h-4" />
              <span>Show Full QR</span>
            </button>
            <button
              onClick={() => { setLastGeneratedTicket(null); setErrorMessage(''); }}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-2.5 rounded-xl text-xs"
            >
              Book Another
            </button>
          </div>
        </div>
      )}

      {/* Dynamic Station Selector Modal with Live RailRadar API Search & A-Z Carousel */}
      {selectingStationType && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-5 space-y-3 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-black text-slate-800">
                  Select {selectingStationType === 'FROM' ? 'Origin (From)' : (selectingStationType === 'TO' ? 'Destination (To)' : 'Platform')} Station
                </h3>
              </div>
              <button 
                onClick={() => { setSelectingStationType(null); setStationSearchFilter(''); setSelectedLetter('ALL'); }}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 text-xs"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Live Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input 
                type="text"
                autoFocus
                placeholder="Search station code, city or junction (e.g. NDLS, Mumbai)..."
                value={stationSearchFilter}
                onChange={(e) => setStationSearchFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-emerald-600 focus:bg-white"
              />
            </div>

            {/* Official Railway A to Z Alphabetic Carousel Filter */}
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none py-1 border-b border-slate-100">
              {ALPHABETS.map((ltr) => (
                <button
                  key={ltr}
                  type="button"
                  onClick={() => handleLetterClick(ltr)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-black shrink-0 transition ${
                    selectedLetter === ltr
                      ? 'bg-emerald-600 text-white shadow-sm scale-105'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  {ltr}
                </button>
              ))}
            </div>

            {/* Live Stations List */}
            <div className="overflow-y-auto divide-y divide-slate-100 flex-1 pr-1 min-h-[200px]">
              {loadingStations ? (
                <div className="py-12 flex flex-col items-center justify-center text-xs text-emerald-600 space-y-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="font-semibold text-slate-500">Searching RailRadar Network...</span>
                </div>
              ) : stationList.length > 0 ? (
                stationList.map((s) => (
                  <button
                    key={s.code}
                    type="button"
                    onClick={() => handleSelectStation(s)}
                    className="w-full py-2.5 px-2 flex items-center justify-between hover:bg-emerald-50/50 rounded-xl transition text-left group"
                  >
                    <div>
                      <div className="text-xs font-black text-slate-800 group-hover:text-emerald-700 transition">
                        {s.name}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {s.city ? `${s.city}, ${s.state || ''}` : (s.state || 'Indian Railways Junction')}
                      </div>
                    </div>
                    <span className="font-mono text-xs font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-lg border border-emerald-100">
                      {s.code}
                    </span>
                  </button>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-slate-400">
                  No matching station found.
                </div>
              )}
            </div>

            <div className="text-[10px] text-slate-400 text-center pt-1 border-t border-slate-100 flex items-center justify-between">
              <span>{stationList.length} Stations Available</span>
              <span className="text-emerald-600 font-bold">RailRadar Live API</span>
            </div>
          </div>
        </div>
      )}

      {/* Railway Instructions Note */}
      <div className="bg-amber-50 border border-amber-200 p-3 rounded-2xl text-[11px] text-amber-900 flex items-start space-x-2">
        <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <div>
          <strong>CRIS Travel Rule:</strong> Paperless tickets are valid only when shown directly inside the RailOne app. Screenshots are not accepted by traveling ticket examiners (TTE).
        </div>
      </div>
    </div>
  );
}
