import React, { useState, useEffect } from 'react';
import { 
  Search, 
  ArrowRightLeft, 
  Calendar, 
  Train, 
  Clock, 
  CheckCircle, 
  Users, 
  Zap, 
  CreditCard, 
  Ticket, 
  ChevronRight, 
  ChevronLeft,
  MapPin, 
  X, 
  Loader2, 
  Sparkles, 
  ShieldCheck, 
  UserCheck,
  Download,
  Mail,
  FileText,
  ArrowLeft,
  Edit2,
  Plus,
  Trash2,
  ChevronDown,
  Info
} from 'lucide-react';
import confetti from 'canvas-confetti';

const API_BASE = 'http://localhost:5000/api';

export default function BookingPanel({ 
  user, 
  walletBalance, 
  setWalletBalance, 
  onBookSuccess, 
  onOpenAuth,
  initialFromStation,
  initialToStation,
  onStationsChange
}) {
  const [ticketMode, setTicketMode] = useState('RESERVED'); // RESERVED | UTS | PLATFORM
  const [fromStation, setFromStation] = useState(initialFromStation || { code: 'NDLS', name: 'New Delhi' });
  const [toStation, setToStation] = useState(initialToStation || { code: 'MMCT', name: 'Mumbai Central' });

  // Sync when initialFromStation or initialToStation changes from HomePanel
  useEffect(() => {
    if (initialFromStation) setFromStation(initialFromStation);
  }, [initialFromStation]);

  useEffect(() => {
    if (initialToStation) setToStation(initialToStation);
  }, [initialToStation]);

  const [selectedQuota, setSelectedQuota] = useState('GENERAL');
  
  // Dynamic Journey Date Picker state
  const [journeyDate, setJourneyDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calendarViewMonth, setCalendarViewMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  
  // Dynamic Trains & Stations from Backend API
  const [trainList, setTrainList] = useState([]);
  const [loadingTrains, setLoadingTrains] = useState(false);
  const [selectedTrain, setSelectedTrain] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);

  // Dynamic Station Selector Sheet state
  const [selectingStationType, setSelectingStationType] = useState(null); // 'FROM' | 'TO' | null
  const [stationList, setStationList] = useState([]);
  const [stationSearchFilter, setStationSearchFilter] = useState('');
  const [selectedLetter, setSelectedLetter] = useState('ALL');
  const [loadingStations, setLoadingStations] = useState(false);

  // Multi-Step Reservation Flow: 'SEARCH' | 'PASSENGER_FORM' | 'REVIEW_JOURNEY'
  const [bookingStep, setBookingStep] = useState('SEARCH');

  // Master Passengers (Loaded dynamically for logged in user)
  const [masterPassengers, setMasterPassengers] = useState([]);
  
  // Passengers List (Multi-passenger support matching screenshot)
  const [passengers, setPassengers] = useState([
    {
      id: 'p-1',
      name: user?.name || user?.fullName || 'ZEESHAN',
      age: '27',
      gender: 'M',
      berth: 'Window Side (WS)'
    }
  ]);
  const [showAddPassengerModal, setShowAddPassengerModal] = useState(false);
  const [showExistingPassengerModal, setShowExistingPassengerModal] = useState(false);
  const [newPName, setNewPName] = useState('');
  const [newPAge, setNewPAge] = useState('');
  const [newPGender, setNewPGender] = useState('M');
  const [newPBerth, setNewPBerth] = useState('No Preference');

  // Boarding Station state
  const [selectedBoardingStation, setSelectedBoardingStation] = useState('');

  // Contact Details (from logged in user or customizable)
  const [contactMobile, setContactMobile] = useState(user?.mobile || '+918290818632');
  const [contactEmail, setContactEmail] = useState(user?.email || 'zeeshandivanextechnologies@gmail.com');
  const [isEditingContact, setIsEditingContact] = useState(false);

  // Additional Preferences (Exact match to screenshot)
  const [autoUpgradation, setAutoUpgradation] = useState(false);
  const [confirmBerthsOnly, setConfirmBerthsOnly] = useState(false);
  const [preferredCoach, setPreferredCoach] = useState('');
  const [reservationChoice, setReservationChoice] = useState('None');
  const [travelInsurance, setTravelInsurance] = useState(true); // default checked from screenshot
  const [gstinOptional, setGstinOptional] = useState('');

  // Legacy single passenger state for compatibility
  const [passengerName, setPassengerName] = useState(user ? (user.name || user.fullName) : 'ZEESHAN');
  const [passengerAge, setPassengerAge] = useState('27');
  const [passengerGender, setPassengerGender] = useState('M');
  const [passengerBerth, setPassengerBerth] = useState('WS');
  const [bookingSuccessData, setBookingSuccessData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Format date safely into YYYY-MM-DD in user's local timezone (preventing UTC -1 day shift)
  const toLocalDateString = (d) => {
    if (!d) return '';
    const dateObj = typeof d === 'string' ? new Date(d) : d;
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('-');
      const d = parts.length === 3 
        ? new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10))
        : new Date(dateStr + 'T00:00:00');

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const target = new Date(d);
      target.setHours(0, 0, 0, 0);

      const formatted = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', weekday: 'short' });
      if (target.getTime() === today.getTime()) {
        return `Today, ${formatted}`;
      } else if (target.getTime() === tomorrow.getTime()) {
        return `Tomorrow, ${formatted}`;
      }
      return formatted;
    } catch {
      return dateStr;
    }
  };

  const getMinDate = () => {
    return toLocalDateString(new Date());
  };

  const getMaxDate = () => {
    const max = new Date();
    max.setDate(max.getDate() + 120); // 120 days advance reservation period (ARP)
    return toLocalDateString(max);
  };

  // 1. Fetch dynamic trains from PostgreSQL backend & RailRadar on station change
  useEffect(() => {
    fetchStations();
  }, []);

  useEffect(() => {
    if (fromStation?.code && toStation?.code) {
      fetchTrains(fromStation.code, toStation.code, '', journeyDate);
    } else {
      fetchTrains('', '', '', journeyDate);
    }
  }, [fromStation, toStation, journeyDate]);

  // Fetch master passengers if user is logged in
  useEffect(() => {
    if (user && user.id) {
      fetch(`${API_BASE}/auth/passengers/${user.id}`)
        .then(r => r.json())
        .then(data => {
          if (data && data.passengers) {
            setMasterPassengers(data.passengers);
          }
        })
        .catch(() => {});
    }
  }, [user]);

  const fetchTrains = async (from = '', to = '', searchQuery = '', travelDate = '') => {
    setLoadingTrains(true);
    try {
      let url = `${API_BASE}/trains`;
      const params = new URLSearchParams();
      if (searchQuery && searchQuery.trim().length >= 2) {
        params.append('q', searchQuery.trim());
      } else if (from || to) {
        if (from) params.append('from', from);
        if (to) params.append('to', to);
      }
      if (travelDate) {
        params.append('date', travelDate);
      }
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        // Give each train realistic booking classes if not present
        const formatted = data.map(t => ({
          ...t,
          duration: t.duration || "15h 40m",
          classes: t.classes || [
            { code: "1A", name: "First AC", fare: 4850, available: 12, status: "AVAILABLE" },
            { code: "2A", name: "2 Tier AC", fare: 2980, available: 38, status: "AVAILABLE" },
            { code: "3A", name: "3 Tier AC", fare: 2150, available: 104, status: "AVAILABLE" },
            { code: "SL", name: "Sleeper", fare: 650, available: 42, status: "AVAILABLE" }
          ]
        }));
        setTrainList(formatted);
      }
    } catch (e) {
      console.warn('Error fetching trains:', e.message);
    } finally {
      setLoadingTrains(false);
    }
  };

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
      }
    } catch (_) {}
    finally {
      setLoadingStations(false);
    }
  };

  // Debounced station search via RailRadar API
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
      if (onStationsChange) onStationsChange(stn, toStation);
    } else if (selectingStationType === 'TO') {
      setToStation(stn);
      if (onStationsChange) onStationsChange(fromStation, stn);
    }
    setSelectingStationType(null);
    setStationSearchFilter('');
    setSelectedLetter('ALL');
  };

  const swapStations = () => {
    const temp = fromStation;
    setFromStation(toStation);
    setToStation(temp);
    if (onStationsChange) onStationsChange(toStation, temp);
  };

  const handleSelectClass = (train, cls) => {
    setSelectedTrain(train);
    setSelectedClass(cls);
    setSelectedBoardingStation(`${train.fromName || train.from} - ${train.from}`);
    setBookingStep('PASSENGER_FORM');
  };

  // Add new passenger to list
  const handleAddNewPassengerSubmit = (e) => {
    e.preventDefault();
    if (!newPName.trim() || !newPAge) return;
    const newP = {
      id: `p-${Date.now()}`,
      name: newPName.trim().toUpperCase(),
      age: newPAge.trim(),
      gender: newPGender,
      berth: newPBerth
    };
    setPassengers(prev => [...prev, newP]);
    setNewPName('');
    setNewPAge('');
    setNewPGender('M');
    setNewPBerth('No Preference');
    setShowAddPassengerModal(false);
  };

  const handleRemovePassenger = (id) => {
    if (passengers.length <= 1) {
      alert('At least 1 passenger is required.');
      return;
    }
    setPassengers(prev => prev.filter(p => p.id !== id));
  };

  const handleAddExistingPassenger = (mp) => {
    const exists = passengers.some(p => p.name.toLowerCase() === mp.name.toLowerCase());
    if (exists) {
      alert('Passenger is already added.');
      return;
    }
    const newP = {
      id: `p-${Date.now()}`,
      name: mp.name.toUpperCase(),
      age: String(mp.age || '28'),
      gender: mp.gender || 'M',
      berth: mp.berth || 'No Preference'
    };
    setPassengers(prev => [...prev, newP]);
    setShowExistingPassengerModal(false);
  };

  // Masking helpers matching screenshot: ze****47@gmail.com and +9182****32
  const maskEmail = (em) => {
    if (!em || !em.includes('@')) return 'ze****47@gmail.com';
    const [userPart, domain] = em.split('@');
    if (userPart.length <= 4) return `${userPart[0]}****@${domain}`;
    return `${userPart.slice(0, 2)}****${userPart.slice(-2)}@${domain}`;
  };

  const maskPhone = (ph) => {
    if (!ph) return '+9182****32';
    const clean = ph.replace(/\s+/g, '');
    if (clean.length < 6) return clean;
    return `${clean.slice(0, 5)}****${clean.slice(-2)}`;
  };

  // 1-Click Fill from Master Passenger List
  const handleSelectMasterPassenger = (mp) => {
    setPassengerName(mp.name);
    setPassengerAge(mp.age ? mp.age.toString() : '28');
    setPassengerGender(mp.gender || 'M');
    setPassengerBerth(mp.berth || 'No Preference');
  };

  // Dynamic Ticket Booking Handler (Saves to PostgreSQL bookings table)
  const handleConfirmBooking = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!passengers || passengers.length === 0) {
      setErrorMessage("Please add at least 1 passenger");
      return;
    }

    const perPersonFare = selectedClass 
      ? selectedClass.fare 
      : (ticketMode === 'PLATFORM' ? 10 : 45);
    const insuranceFee = travelInsurance ? (passengers.length * 0.45) : 0;
    const fareAmount = (perPersonFare * passengers.length) + insuranceFee;

    // Check R-Wallet balance
    if (walletBalance !== undefined && walletBalance < fareAmount) {
      setErrorMessage(`Insufficient R-Wallet balance (₹${walletBalance}). Please recharge your wallet.`);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    const randomPnr = Math.floor(1000000000 + Math.random() * 9000000000).toString();
    const primaryPassenger = passengers[0];
    const newBooking = {
      pnr: randomPnr,
      trainNumber: selectedTrain ? selectedTrain.number : "12919",
      trainName: selectedTrain ? selectedTrain.name : "Malwa SF Express",
      passengerName: primaryPassenger.name,
      from: fromStation.code,
      to: ticketMode === 'PLATFORM' ? fromStation.code : toStation.code,
      date: formatDisplayDate(journeyDate),
      departureTime: selectedTrain ? selectedTrain.departure : "11:50",
      arrivalTime: selectedTrain ? selectedTrain.arrival : "16:30",
      classType: selectedClass ? selectedClass.code : (ticketMode === 'UTS' ? 'GEN' : 'PLATFORM'),
      className: selectedClass ? selectedClass.code : (ticketMode === 'UTS' ? 'GEN' : 'PLATFORM'),
      fare: fareAmount,
      paymentMethod: "R-WALLET (Official)",
      status: "CONFIRMED",
      ticketType: ticketMode,
      coach: preferredCoach ? preferredCoach.trim() : (ticketMode === 'PLATFORM' ? 'NA' : 'B2'),
      seat: ticketMode === 'PLATFORM' ? 'Platform Pass' : (primaryPassenger.berth || '23 (MB)'),
      platform: selectedTrain?.platform || 'PF 1',
      quota: selectedQuota,
      age: parseInt(primaryPassenger.age || '27', 10),
      gender: primaryPassenger.gender || 'M',
      userId: user?.id || null,
      email: contactEmail || user?.email || '',
      mobile: contactMobile || user?.mobile || '',
      passengersCount: passengers.length
    };

    try {
      // 1. Save booking to PostgreSQL backend
      await fetch(`${API_BASE}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBooking)
      });

      // 2. Deduct fare from PostgreSQL R-Wallet balance
      if (user && user.id) {
        const nextBalance = Math.max(0, walletBalance - fareAmount);
        setWalletBalance(nextBalance);
        await fetch(`${API_BASE}/profile/${user.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ walletBalance: nextBalance })
        }).catch(() => {});
      }

      onBookSuccess(newBooking);
      setBookingSuccessData(newBooking);

      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (_) {}
    } catch (err) {
      setErrorMessage(err.message || 'Booking submission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const ALPHABETS = ['ALL', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')];

  if (bookingSuccessData) {
    const handleDownloadPdf = () => {
      const downloadUrl = `${API_BASE}/bookings/${encodeURIComponent(bookingSuccessData.pnr)}/download-pdf`;
      window.open(downloadUrl, '_blank');
    };

    return (
      <div className="p-4 space-y-4 text-center animate-in fade-in">
        <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-3xl shadow-sm">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow">
            <CheckCircle className="w-10 h-10" />
          </div>
          <h2 className="text-xl font-black text-emerald-900">Ticket Confirmed!</h2>
          <p className="text-xs text-emerald-700 mt-1">Official IRCTC E-Ticket Generated & Sent to Email</p>
          
          <div className="bg-white p-4 rounded-2xl border border-emerald-100 my-4 text-left space-y-2.5 shadow-sm text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">PNR Number:</span>
              <strong className="text-blue-900 font-mono tracking-wider font-black text-sm">{bookingSuccessData.pnr}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Train:</span>
              <strong className="text-slate-900">{bookingSuccessData.trainNumber} - {bookingSuccessData.trainName}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Route:</span>
              <strong className="text-slate-900">{bookingSuccessData.from} ➔ {bookingSuccessData.to}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Berth / Status:</span>
              <strong className="text-emerald-700 font-bold">{bookingSuccessData.coach}-{bookingSuccessData.seat} ({bookingSuccessData.status})</strong>
            </div>
            <div className="flex justify-between pt-2 border-t border-slate-100">
              <span className="text-slate-400">Passenger:</span>
              <strong className="text-slate-900">{bookingSuccessData.passengerName} ({bookingSuccessData.age} Yrs, {bookingSuccessData.gender})</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Fare Deducted:</span>
              <strong className="text-amber-600 font-bold">₹{bookingSuccessData.fare}.00 (R-Wallet)</strong>
            </div>
          </div>

          {/* Email Confirmation Pill */}
          <div className="bg-blue-50/80 border border-blue-200/80 rounded-2xl p-2.5 flex items-center justify-center gap-2 text-xs text-blue-900 font-semibold mb-3">
            <Mail className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="truncate">E-Ticket PDF sent to {user?.email || 'your registered email'}</span>
          </div>

          {/* Action Buttons: 1-Click Download PDF Ticket & Book Another */}
          <div className="space-y-2">
            <button 
              type="button"
              onClick={handleDownloadPdf}
              className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-3.5 rounded-2xl text-xs shadow-lg shadow-blue-700/25 flex items-center justify-center gap-2 active:scale-95 transition"
            >
              <Download className="w-4 h-4" />
              <span>Download Official IRCTC Ticket (PDF)</span>
            </button>

            <button 
              type="button"
              onClick={() => {
                setBookingSuccessData(null);
                setSelectedTrain(null);
                setSelectedClass(null);
                setPassengerName(user ? user.name : '');
                setPassengerAge('');
              }}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-2xl text-xs active:scale-95 transition"
            >
              Book Another Ticket
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 ">
      {/* Ticket Mode Toggle (Reserved / UTS / Platform) */}
      <div className="bg-slate-200 p-1 rounded-2xl flex text-xs font-bold text-slate-700">
        <button 
          onClick={() => { setTicketMode('RESERVED'); setSelectedTrain(null); setSelectedClass(null); }}
          className={`flex-1 py-2 rounded-xl transition ${ticketMode === 'RESERVED' ? 'bg-blue-700 text-white shadow' : 'hover:text-slate-900'}`}
        >
          Reserved
        </button>
        <button 
          onClick={() => { setTicketMode('UTS'); setSelectedTrain(null); setSelectedClass(null); }}
          className={`flex-1 py-2 rounded-xl transition ${ticketMode === 'UTS' ? 'bg-emerald-700 text-white shadow' : 'hover:text-slate-900'}`}
        >
          UTS (Daily)
        </button>
        <button 
          onClick={() => { setTicketMode('PLATFORM'); setSelectedTrain(null); setSelectedClass(null); }}
          className={`flex-1 py-2 rounded-xl transition ${ticketMode === 'PLATFORM' ? 'bg-amber-600 text-white shadow' : 'hover:text-slate-900'}`}
        >
          Platform
        </button>
      </div>

      {/* Dynamic From/To Station Selector Box */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div 
            className="flex-1 bg-slate-50 hover:bg-slate-100 p-2.5 rounded-2xl border border-slate-200/80 cursor-pointer transition"
            onClick={() => { setSelectingStationType('FROM'); setStationSearchFilter(''); }}
          >
            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">From Station</label>
            <div className="text-sm font-black text-slate-900 mt-0.5">{fromStation.code}</div>
            <div className="text-[10px] text-slate-500 truncate">{fromStation.name}</div>
          </div>

          {ticketMode !== 'PLATFORM' && (
            <button 
              type="button"
              onClick={swapStations}
              className="mx-2 p-2.5 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-600 shadow-sm active:scale-90 transition border border-blue-200"
              title="Swap stations"
            >
              <ArrowRightLeft className="w-4 h-4" />
            </button>
          )}

          {ticketMode !== 'PLATFORM' && (
            <div 
              className="flex-1 bg-slate-50 hover:bg-slate-100 p-2.5 rounded-2xl border border-slate-200/80 cursor-pointer text-right transition"
              onClick={() => { setSelectingStationType('TO'); setStationSearchFilter(''); }}
            >
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">To Station</label>
              <div className="text-sm font-black text-slate-900 mt-0.5">{toStation.code}</div>
              <div className="text-[10px] text-slate-500 truncate">{toStation.name}</div>
            </div>
          )}
        </div>

        {ticketMode === 'RESERVED' && (
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="relative">
              <label className="text-[9px] font-bold text-slate-400 uppercase">Journey Date</label>
              <button
                type="button"
                onClick={() => {
                  const d = journeyDate ? new Date(journeyDate + 'T00:00:00') : new Date();
                  setCalendarViewMonth(new Date(d.getFullYear(), d.getMonth(), 1));
                  setIsCalendarOpen(true);
                }}
                className="w-full flex items-center bg-slate-50 hover:bg-blue-50/50 hover:border-blue-300 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 mt-0.5 cursor-pointer transition text-left active:scale-95"
              >
                <Calendar className="w-3.5 h-3.5 mr-1.5 text-blue-600 shrink-0" />
                <span className="truncate">{formatDisplayDate(journeyDate)}</span>
              </button>
            </div>
            <div>
              <label className="text-[9px] font-bold text-slate-400 uppercase">Quota</label>
              <select 
                value={selectedQuota}
                onChange={(e) => setSelectedQuota(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 outline-none mt-0.5 cursor-pointer"
              >
                <option value="GENERAL">General (GN)</option>
                <option value="TATKAL">Tatkal (TQ)</option>
                <option value="LADIES">Ladies (LD)</option>
                <option value="LOWER_BERTH">Sr. Citizen / Lower</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Error message banner */}
      {errorMessage && (
        <div className="bg-rose-50 border border-rose-200 p-3 rounded-2xl text-xs text-rose-700 font-medium">
          {errorMessage}
        </div>
      )}

      {/* Dynamic Trains Listing (For Reserved Mode) */}
      {ticketMode === 'RESERVED' && !selectedClass && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Available Trains ({trainList.length})
            </span>
            <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
              Live NTES & RailRadar
            </span>
          </div>

          {loadingTrains ? (
            <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center space-y-2">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto" />
              <div className="text-xs text-slate-500 font-semibold">Loading available trains from backend...</div>
            </div>
          ) : trainList.length > 0 ? (
            trainList.map((train) => (
              <div key={train.id || train.number} className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-black text-slate-900">{train.name}</h3>
                    <span className="text-[10px] font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md font-bold border border-blue-100">
                      #{train.number}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-emerald-600 font-black">
                      {train.liveStatus?.delay || 'On Time'}
                    </div>

                    {/* Official Railway Running Days Indicator (M T W T F S S) */}
                    <div className="flex items-center justify-end gap-0.5 mt-1">
                      {[
                        { key: 'MON', label: 'M' },
                        { key: 'TUE', label: 'T' },
                        { key: 'WED', label: 'W' },
                        { key: 'THU', label: 'T' },
                        { key: 'FRI', label: 'F' },
                        { key: 'SAT', label: 'S' },
                        { key: 'SUN', label: 'S' }
                      ].map((d, i) => {
                        const runs = train.runningDays 
                          ? train.runningDays.includes(d.key)
                          : true;
                        return (
                          <span 
                            key={i} 
                            className={`w-4 h-4 rounded-full flex items-center justify-center text-[8.5px] font-black ${
                              runs 
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                                : 'bg-slate-100 text-slate-300'
                            }`}
                            title={`${d.key}: ${runs ? 'Runs' : 'Does not run'}`}
                          >
                            {d.label}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Timing */}
                <div className="flex items-center justify-between text-xs bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
                  <div>
                    <div className="font-black text-slate-900 text-sm">{train.departure}</div>
                    <div className="text-[10px] text-slate-500 font-semibold">{train.from}</div>
                  </div>
                  <div className="text-center text-[10px] text-slate-400">
                    <span className="font-bold">{train.duration || '15h 40m'}</span>
                    <div className="w-16 border-t border-slate-300 my-0.5" />
                    <span>Direct</span>
                  </div>
                  <div className="text-right">
                    <div className="font-black text-slate-900 text-sm">{train.arrival}</div>
                    <div className="text-[10px] text-slate-500 font-semibold">{train.to}</div>
                  </div>
                </div>

                {/* Class Selection Boxes with Real Dynamic API Data */}
                <div className="grid grid-cols-4 gap-1.5">
                  {(train.classes || []).map((cls) => {
                    const isSelected = selectedClass && selectedClass.code === cls.code && selectedTrain?.number === train.number;
                    const isAvailable = cls.status === 'AVAILABLE' || cls.statusText?.startsWith('AVAILABLE');
                    const isRAC = cls.status === 'RAC' || cls.statusText?.startsWith('RAC');
                    const isWL = cls.status === 'WAITLIST' || cls.statusText?.includes('WL');

                    const statusColor = isAvailable 
                      ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                      : isRAC
                      ? 'text-amber-700 bg-amber-50 border-amber-200'
                      : 'text-rose-700 bg-rose-50 border-rose-200';

                    const displayText = cls.statusText || (
                      isAvailable ? `AVAILABLE ${cls.available || ''}`.trim() : (cls.status || 'AVAILABLE')
                    );

                    return (
                      <button 
                        key={cls.code}
                        type="button"
                        onClick={() => handleSelectClass(train, cls)}
                        className={`p-2 rounded-2xl text-left transition flex flex-col justify-between active:scale-95 border ${
                          isSelected 
                            ? 'bg-blue-600 border-blue-700 text-white shadow-md shadow-blue-500/25 ring-2 ring-blue-400' 
                            : 'border-slate-200/80 bg-slate-50/70 hover:bg-blue-50/50 hover:border-blue-300'
                        }`}
                      >
                        <div className="flex justify-between items-center w-full">
                          <span className={`font-black text-xs ${isSelected ? 'text-white' : 'text-slate-900'}`}>{cls.code}</span>
                          <span className={`text-[10px] font-bold ${isSelected ? 'text-blue-100' : 'text-slate-700'}`}>₹{cls.fare}</span>
                        </div>
                        <div className={`text-[8.5px] font-black truncate max-w-full mt-1.5 px-1 py-0.5 rounded ${
                          isSelected ? 'bg-white/20 text-white' : statusColor
                        }`}>
                          {displayText}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white p-6 rounded-3xl border border-slate-200 text-center text-xs text-slate-500">
              No trains found for this route. Try changing stations.
            </div>
          )}
        </div>
      )}

      {/* 2. STEP 2: PASSENGER DETAILS FORM (Exact 1:1 match to screenshot 1 & 2) */}
      {selectedClass && bookingStep === 'PASSENGER_FORM' && selectedTrain && (
        <div className="space-y-3 animate-in fade-in">
          {/* Top Train Summary Header Card */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="font-mono font-bold text-indigo-700">
                {selectedTrain.number} <span className="text-slate-400 font-sans">|</span> <span className="font-black text-slate-900 font-sans uppercase">{selectedTrain.name}</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <div>
                <span className="font-black text-slate-900 text-sm">{selectedTrain.departure}</span>
                <span className="text-[10px] text-blue-600 ml-1.5 font-bold">{formatDisplayDate(journeyDate)}</span>
                <div className="text-[11px] font-black text-slate-800 uppercase mt-0.5">{selectedTrain.fromName || fromStation.name || fromStation.code}</div>
                <div className="text-[10px] text-slate-500 font-bold mt-0.5">
                  Class: <strong className="text-slate-900">{selectedClass.code}</strong>
                </div>
              </div>

              <div className="text-center text-[10px] text-slate-400">
                <span className="font-bold text-blue-600">{selectedTrain.duration || '04h 50min'}</span>
                <div className="w-16 border-t border-slate-300 my-0.5" />
              </div>

              <div className="text-right">
                <span className="text-[10px] text-blue-600 mr-1.5 font-bold">{formatDisplayDate(journeyDate)}</span>
                <span className="font-black text-slate-900 text-sm">{selectedTrain.arrival}</span>
                <div className="text-[11px] font-black text-slate-800 uppercase mt-0.5">{selectedTrain.toName || toStation.name || toStation.code}</div>
                <div className="text-[10px] text-slate-500 font-bold mt-0.5">
                  Quota: <strong className="text-slate-900">{selectedQuota}</strong>
                </div>
              </div>
            </div>

            {/* Boarding Station Dropdown Box */}
            <div className="pt-2">
              <div className="bg-white border border-blue-200 rounded-xl p-2.5 flex items-center justify-between shadow-xs">
                <div>
                  <span className="text-[9px] text-slate-400 font-bold uppercase block leading-tight">Boarding Station</span>
                  <span className="text-xs font-black text-slate-800">{selectedBoardingStation || `${selectedTrain.fromName || fromStation.name} - ${fromStation.code}`}</span>
                </div>
                <ChevronDown className="w-4 h-4 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Select Passenger Section */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-black text-slate-900">Select Passenger</h4>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddPassengerModal(true)}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-0.5"
                >
                  <Plus className="w-3.5 h-3.5" /> Add New
                </button>
                <button
                  type="button"
                  onClick={() => setShowExistingPassengerModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] px-3 py-1.5 rounded-full shadow-xs flex items-center gap-1 active:scale-95 transition"
                >
                  <Plus className="w-3 h-3" /> Add Existing
                </button>
              </div>
            </div>

            {/* Added Passengers List Chips */}
            <div className="space-y-2">
              {passengers.map((p, idx) => (
                <div key={p.id} className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-black text-slate-900 uppercase tracking-tight">{p.name}</div>
                    <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                      {p.age}Y, {p.gender}, {p.berth}
                    </div>
                  </div>
                  {passengers.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemovePassenger(p.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                      title="Remove passenger"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Contact Details Section (Exact match to screenshot) */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-black text-slate-900">Contact Details</h4>
              <div className="flex items-center gap-2 text-xs font-black text-slate-900 font-mono">
                <span>{contactMobile}</span>
                <button 
                  type="button"
                  onClick={() => setIsEditingContact(prev => !prev)}
                  className="text-blue-600 hover:text-blue-800 p-1"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {isEditingContact ? (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase">Mobile</label>
                  <input 
                    type="text" 
                    value={contactMobile}
                    onChange={(e) => setContactMobile(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase">Email</label>
                  <input 
                    type="email" 
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-bold"
                  />
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-600 leading-relaxed">
                Your e-ticket will be sent to <br />
                <strong className="text-slate-800 font-mono">{maskEmail(contactEmail)}</strong> and <strong className="text-slate-800 font-mono">{maskPhone(contactMobile)}</strong>
              </p>
            )}
          </div>

          {/* Additional Preferences Section */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs space-y-3">
            <h4 className="text-sm font-black text-slate-900">Additional Preferences</h4>
            
            <div className="space-y-2.5 text-xs text-slate-700">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={autoUpgradation} 
                  onChange={(e) => setAutoUpgradation(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-0 cursor-pointer"
                />
                <span className="font-medium">Consider for auto upgradation</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={confirmBerthsOnly} 
                  onChange={(e) => setConfirmBerthsOnly(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-0 cursor-pointer"
                />
                <span className="font-medium">Book only if confirm berth are allocated</span>
              </label>

              <div className="pt-1">
                <input 
                  type="text"
                  placeholder="Preferred Coach Number"
                  value={preferredCoach}
                  onChange={(e) => setPreferredCoach(e.target.value.toUpperCase())}
                  className="w-full bg-white border border-blue-300 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-blue-600 placeholder:text-slate-400 placeholder:font-normal"
                />
              </div>
            </div>
          </div>

          {/* Reservation Choice (Optional) */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex items-center justify-between">
            <div>
              <div className="text-xs font-black text-slate-900">Reservation Choice <span className="font-normal text-slate-400">(Optional)</span></div>
              <div className="text-[11px] text-slate-500 mt-0.5">{reservationChoice}</div>
            </div>
            <ChevronDown className="w-4 h-4 text-blue-600" />
          </div>

          {/* Travel Insurance Section (Exact match to screenshot) */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs space-y-2.5">
            <h4 className="text-xs font-black text-slate-900">Travel Ins. Premium (GST Incl.)</h4>
            <p className="text-[11px] text-slate-600">Do you want to take Travel Insurance</p>
            
            <div className="space-y-2 text-xs">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input 
                  type="radio" 
                  name="travel_insurance" 
                  checked={travelInsurance === true} 
                  onChange={() => setTravelInsurance(true)}
                  className="w-4 h-4 text-blue-600 mt-0.5"
                />
                <span className="text-slate-700">
                  Yes, and I accept the travel Insurance. <br />
                  <a href="#" onClick={(e) => { e.preventDefault(); alert('Standard IRCTC Travel Insurance: ₹0.45 per passenger covering personal accidental risks up to ₹10 Lakhs.'); }} className="text-blue-600 font-bold hover:underline">Terms & Conditions</a>
                </span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input 
                  type="radio" 
                  name="travel_insurance" 
                  checked={travelInsurance === false} 
                  onChange={() => setTravelInsurance(false)}
                  className="w-4 h-4 text-slate-600"
                />
                <span className="text-slate-700">No, I do not want travel Insurance.</span>
              </label>
            </div>
          </div>

          {/* GSTIN Details (Optional) */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex items-center justify-between">
            <div className="text-xs font-black text-slate-900">GSTIN Details <span className="font-normal text-slate-400">(Optional)</span></div>
            <ChevronDown className="w-4 h-4 text-blue-600" />
          </div>

          {/* Review Journey Details Big Blue Button (From Screenshot 2) */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                if (!passengers || passengers.length === 0) {
                  alert('Please add at least 1 passenger.');
                  return;
                }
                setBookingStep('REVIEW_JOURNEY');
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-2xl text-sm shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 active:scale-95 transition"
            >
              <span>Review Journey Details</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. STEP 3: REVIEW JOURNEY DETAILS SCREEN (Exact 1:1 match to screenshot 3) */}
      {selectedClass && bookingStep === 'REVIEW_JOURNEY' && selectedTrain && (
        <div className="space-y-3 animate-in fade-in">
          {/* Top Blue Header with Back Button */}
          <div className="bg-blue-600 text-white p-3.5 rounded-2xl flex items-center gap-3 shadow-md shadow-blue-600/20">
            <button
              type="button"
              onClick={() => setBookingStep('PASSENGER_FORM')}
              className="w-8 h-8 rounded-full border border-white/40 flex items-center justify-center hover:bg-white/10 active:scale-90 transition"
            >
              <ArrowLeft className="w-4 h-4 text-white" />
            </button>
            <h3 className="text-base font-black text-white tracking-wide">Review Journey Details</h3>
          </div>

          {/* Train Route Summary Strip */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 space-y-2">
            <div className="font-mono font-bold text-indigo-700 text-xs">
              {selectedTrain.number} <span className="text-slate-400 font-sans">|</span> <span className="font-black text-slate-900 font-sans uppercase">{selectedTrain.name}</span>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <div>
                <span className="font-black text-slate-900 text-sm">{selectedTrain.departure}</span>
                <span className="text-[10px] text-blue-600 ml-1.5 font-bold">{formatDisplayDate(journeyDate)}</span>
                <div className="text-[11px] font-black text-slate-800 uppercase mt-0.5">{selectedTrain.fromName || fromStation.name || fromStation.code}</div>
              </div>

              <div className="text-center text-[10px] text-slate-400">
                <span className="font-bold text-blue-600">{selectedTrain.duration || '04h 50min'}</span>
                <div className="w-16 border-t border-slate-300 my-0.5" />
              </div>

              <div className="text-right">
                <span className="text-[10px] text-blue-600 mr-1.5 font-bold">{formatDisplayDate(journeyDate)}</span>
                <span className="font-black text-slate-900 text-sm">{selectedTrain.arrival}</span>
                <div className="text-[11px] font-black text-slate-800 uppercase mt-0.5">{selectedTrain.toName || toStation.name || toStation.code}</div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-xs">
              <span className="text-slate-600 font-bold text-[11px]">
                {passengers.length} Adult | 0 Child | {formatDisplayDate(journeyDate)} | {selectedClass.code} | {selectedQuota}
              </span>
              <span className="text-emerald-700 font-black text-[11px] bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                {selectedClass.statusText || 'AVAILABLE-681'}
              </span>
            </div>
          </div>

          {/* Passenger Details Section */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs space-y-2">
            <h4 className="text-sm font-black text-slate-900">Passenger Details</h4>
            <div className="space-y-2 pt-1">
              {passengers.map((p, idx) => (
                <div key={p.id}>
                  <div className="text-xs font-black text-slate-900 uppercase tracking-tight">{p.name}</div>
                  <div className="text-[11px] text-slate-500 font-semibold mt-0.5">
                    {p.age}Y, {p.gender}, {p.berth.includes('WS') ? 'WS' : p.berth}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Contact Details Section */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs space-y-1.5">
            <h4 className="text-sm font-black text-slate-900">Contact Details</h4>
            <p className="text-xs text-slate-600 leading-relaxed pt-1">
              Your e-ticket will be sent to <br />
              <strong className="text-slate-800 font-mono">{maskEmail(contactEmail)}</strong> and <strong className="text-slate-800 font-mono">{maskPhone(contactMobile)}</strong>
            </p>
          </div>

          {/* Fare Section with Fare Breakup Button */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Ticket className="w-5 h-5" />
              </div>
              <span className="text-base font-black text-slate-900">Fare</span>
            </div>

            <div className="text-right">
              <div className="text-lg font-black text-slate-900">
                ₹ {((selectedClass.fare * passengers.length) + (travelInsurance ? passengers.length * 0.45 : 0)).toFixed(2)}
              </div>
              <button
                type="button"
                onClick={() => {
                  const baseFare = selectedClass.fare * passengers.length;
                  const ins = travelInsurance ? passengers.length * 0.45 : 0;
                  alert(`FARE BREAKUP:\n• Base Ticket Fare (${passengers.length} Pax): ₹${baseFare.toFixed(2)}\n• IRCTC Convenience Fee: ₹0.00 (Waived via R-Wallet)\n• Travel Insurance: ₹${ins.toFixed(2)}\n• TOTAL PAYABLE: ₹${(baseFare + ins).toFixed(2)}`);
                }}
                className="text-[11px] font-bold text-slate-600 border border-slate-300 px-2.5 py-0.5 rounded-full hover:bg-slate-50 active:scale-95 transition mt-0.5"
              >
                Fare Breakup
              </button>
            </div>
          </div>

          {/* Terms & Book Now Big Blue Button */}
          <div className="pt-2 space-y-2">
            <p className="text-center text-[11px] text-slate-500 font-medium">
              By Clicking Book Now, you agree to our <a href="#" onClick={(e) => { e.preventDefault(); alert('Official Indian Railways Booking Terms & Conditions.'); }} className="text-blue-600 font-bold hover:underline">Terms & Conditions</a>
            </p>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleConfirmBooking}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-2xl text-base shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 active:scale-95 transition"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Confirming Booking in Database...</span>
                </>
              ) : (
                <span>Book Now</span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* MODAL: ADD NEW PASSENGER */}
      {showAddPassengerModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in"
          onClick={() => setShowAddPassengerModal(false)}
        >
          <div 
            className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-5 space-y-3.5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="text-sm font-black text-slate-900">Add Passenger Details</h3>
              <button 
                type="button" 
                onClick={() => setShowAddPassengerModal(false)}
                className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 text-xs"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <form onSubmit={handleAddNewPassengerSubmit} className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Passenger Full Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. MOHAMMAD ZEESHAN"
                  value={newPName}
                  onChange={(e) => setNewPName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 outline-none uppercase mt-1 focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Age</label>
                  <input 
                    type="number" 
                    required
                    min="1"
                    max="120"
                    placeholder="e.g. 27"
                    value={newPAge}
                    onChange={(e) => setNewPAge(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 outline-none mt-1 focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Gender</label>
                  <select 
                    value={newPGender}
                    onChange={(e) => setNewPGender(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 outline-none mt-1"
                  >
                    <option value="M">Male (M)</option>
                    <option value="F">Female (F)</option>
                    <option value="T">Transgender (T)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Berth Preference</label>
                <select 
                  value={newPBerth}
                  onChange={(e) => setNewPBerth(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 outline-none mt-1"
                >
                  <option value="No Preference">No Preference</option>
                  <option value="Window Side (WS)">Window Side (WS)</option>
                  <option value="Lower Berth (LB)">Lower Berth (LB)</option>
                  <option value="Middle Berth (MB)">Middle Berth (MB)</option>
                  <option value="Upper Berth (UB)">Upper Berth (UB)</option>
                  <option value="Side Lower (SL)">Side Lower (SL)</option>
                  <option value="Side Upper (SU)">Side Upper (SU)</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl text-xs shadow-md shadow-blue-600/25 active:scale-95 transition mt-2"
              >
                Add Passenger
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD EXISTING PASSENGER (From Database Master List) */}
      {showExistingPassengerModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in"
          onClick={() => setShowExistingPassengerModal(false)}
        >
          <div 
            className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-5 space-y-3.5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="text-sm font-black text-slate-900">Select Existing Passenger</h3>
              <button 
                type="button" 
                onClick={() => setShowExistingPassengerModal(false)}
                className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 text-xs"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {(masterPassengers && masterPassengers.length > 0 ? masterPassengers : [
                { id: 'mp-1', name: 'ZEESHAN', age: 27, gender: 'M', berth: 'Window Side (WS)' },
                { id: 'mp-2', name: 'MOHAMMAD ZEESHAN', age: 28, gender: 'M', berth: 'Lower Berth (LB)' }
              ]).map((mp) => (
                <div 
                  key={mp.id}
                  onClick={() => handleAddExistingPassenger(mp)}
                  className="p-3 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 cursor-pointer flex items-center justify-between transition"
                >
                  <div>
                    <div className="text-xs font-black text-slate-900">{mp.name}</div>
                    <div className="text-[10px] text-slate-500">{mp.age} Yrs • {mp.gender} • {mp.berth}</div>
                  </div>
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                    + Select
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Station Selector Dropdown Modal with compact height */}
      {selectingStationType && (
        <div 
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in"
          onClick={() => { setSelectingStationType(null); setStationSearchFilter(''); }}
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
                onClick={() => { setSelectingStationType(null); setStationSearchFilter(''); }}
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
                placeholder="Search station name or code (e.g. NDLS, Mumbai)..."
                value={stationSearchFilter}
                onChange={(e) => setStationSearchFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-blue-600 focus:bg-white"
              />
            </div>

            {/* Compact Live Stations List */}
            <div className="overflow-y-auto divide-y divide-slate-100 flex-1 pr-1 max-h-48 min-h-[140px]">
              {loadingStations ? (
                <div className="py-8 flex flex-col items-center justify-center text-xs text-blue-600 space-y-1.5">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-[11px] font-semibold text-slate-400">Searching stations...</span>
                </div>
              ) : stationList.length > 0 ? (
                stationList.map((s) => (
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

            <div className="text-[9px] text-slate-400 text-center pt-1 border-t border-slate-100 flex items-center justify-between">
              <span>{stationList.length} Stations Available</span>
              <span className="text-emerald-600 font-bold">RailRadar Live API</span>
            </div>
          </div>
        </div>
      )}

      {/* Official Railway Interactive Journey Calendar Modal */}
      {isCalendarOpen && (() => {
        const year = calendarViewMonth.getFullYear();
        const month = calendarViewMonth.getMonth();
        const monthName = calendarViewMonth.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
        
        const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 is Sun
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const maxDate = new Date();
        maxDate.setHours(0, 0, 0, 0);
        maxDate.setDate(maxDate.getDate() + 120);

        const currentSelectedDate = journeyDate ? new Date(journeyDate + 'T00:00:00') : null;
        if (currentSelectedDate) currentSelectedDate.setHours(0, 0, 0, 0);

        const handlePrevMonth = () => {
          const prev = new Date(year, month - 1, 1);
          const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
          if (prev >= currentMonthStart) {
            setCalendarViewMonth(prev);
          }
        };

        const handleNextMonth = () => {
          const next = new Date(year, month + 1, 1);
          const maxMonthStart = new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);
          if (next <= maxMonthStart) {
            setCalendarViewMonth(next);
          }
        };

        const handleQuickSelect = (daysFromToday) => {
          const target = new Date();
          target.setDate(target.getDate() + daysFromToday);
          setJourneyDate(toLocalDateString(target));
          setIsCalendarOpen(false);
        };

        const days = [];
        for (let i = 0; i < firstDayOfMonth; i++) {
          days.push(null);
        }
        for (let d = 1; d <= daysInMonth; d++) {
          days.push(new Date(year, month, d));
        }

        const canGoPrev = new Date(year, month, 1) > new Date(today.getFullYear(), today.getMonth(), 1);
        const canGoNext = new Date(year, month + 1, 1) <= new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);

        return (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
            <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-5 space-y-4 shadow-2xl max-h-[90vh] flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-800">Select Journey Date</h3>
                    <p className="text-[10px] text-slate-400">IRCTC 120-Day Advance Reservation Period</p>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => setIsCalendarOpen(false)}
                  className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 text-xs transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Quick Select Buttons: Today, Tomorrow, Day After */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickSelect(0)}
                  className="py-2 px-1 text-center bg-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition active:scale-95"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickSelect(1)}
                  className="py-2 px-1 text-center bg-blue-50 text-blue-700 border border-blue-200 rounded-xl text-xs font-black transition active:scale-95 shadow-xs"
                >
                  Tomorrow
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickSelect(2)}
                  className="py-2 px-1 text-center bg-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition active:scale-95"
                >
                  Day After
                </button>
              </div>

              {/* Month Selector Navigation */}
              <div className="flex items-center justify-between px-2 pt-1">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  disabled={!canGoPrev}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="text-sm font-black text-slate-900 tracking-wide">
                  {monthName}
                </div>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  disabled={!canGoNext}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Day of Week Headers */}
              <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-black text-slate-400 uppercase tracking-wider">
                <div className="text-rose-500">Sun</div>
                <div>Mon</div>
                <div>Tue</div>
                <div>Wed</div>
                <div>Thu</div>
                <div>Fri</div>
                <div className="text-blue-600">Sat</div>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1 text-center text-xs">
                {days.map((dateObj, idx) => {
                  if (!dateObj) {
                    return <div key={`empty-${idx}`} className="h-10" />;
                  }

                  dateObj.setHours(0, 0, 0, 0);
                  const isPast = dateObj < today;
                  const isTooFar = dateObj > maxDate;
                  const isDisabled = isPast || isTooFar;
                  const isSelected = currentSelectedDate && dateObj.getTime() === currentSelectedDate.getTime();
                  const isToday = dateObj.getTime() === today.getTime();
                  const isSunday = dateObj.getDay() === 0;

                  return (
                    <button
                      key={dateObj.getTime()}
                      type="button"
                      disabled={isDisabled}
                      onClick={() => {
                        setJourneyDate(toLocalDateString(dateObj));
                        setIsCalendarOpen(false);
                      }}
                      className={`h-10 rounded-xl flex flex-col items-center justify-center font-bold text-xs transition relative ${
                        isSelected
                          ? 'bg-blue-600 text-white font-black shadow-md shadow-blue-500/30 scale-105 z-10'
                          : isDisabled
                          ? 'text-slate-300 cursor-not-allowed bg-transparent'
                          : isToday
                          ? 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100'
                          : isSunday
                          ? 'text-rose-600 hover:bg-slate-100 font-black'
                          : 'text-slate-800 hover:bg-slate-100'
                      }`}
                    >
                      <span>{dateObj.getDate()}</span>
                      {isToday && (
                        <span className={`text-[8px] leading-none ${isSelected ? 'text-white' : 'text-blue-600 font-extrabold'}`}>
                          Today
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Footer Indicator */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-600 inline-block" />
                  <span>Selected Date</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-100 border border-blue-300 inline-block" />
                  <span>Today</span>
                </div>
                <span className="text-emerald-600 font-bold">120 Days ARP Active</span>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
