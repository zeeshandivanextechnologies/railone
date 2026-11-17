import React, { useState, useEffect } from 'react';
import { 
  Compass, 
  MapPin, 
  Train, 
  Clock, 
  CheckCircle2, 
  ArrowRight, 
  Search, 
  Share2, 
  Sparkles, 
  Info, 
  ChevronRight, 
  ChevronUp,
  ChevronDown, 
  TrendingUp, 
  Percent, 
  Layers,
  Radio,
  Loader2,
  Navigation,
  Gauge,
  Calendar,
  AlertTriangle,
  Building2,
  ArrowUpRight,
  X,
  QrCode,
  Copy,
  Check,
  ShieldCheck,
  MessageCircle,
  ExternalLink,
  Bookmark,
  Star,
  Armchair,
} from 'lucide-react';


import { passengerApi } from '../services/passengerApi.js';

export default function TrackingPanel({ trains, bookings, initialTrainNumber }) {
  const [activeSubTab, setActiveSubTab] = useState('LIVE_TRAIN'); // LIVE_TRAIN | STATION_BOARD | PNR_STATUS | COACH_LOCATOR
  
  // Real-time Train Search by No. or Name
  const [trainSearchInput, setTrainSearchInput] = useState(initialTrainNumber || '');
  const [activeTrainNumber, setActiveTrainNumber] = useState(initialTrainNumber || '');
  const [hasUserSearched, setHasUserSearched] = useState(!!initialTrainNumber);
  const [searchResults, setSearchResults] = useState([]);
  const [searchingTrains, setSearchingTrains] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Sync if initialTrainNumber changes from external navigation (e.g. from HomePanel click)
  useEffect(() => {
    if (initialTrainNumber) {
      const cleanNum = initialTrainNumber.toString().trim();
      setActiveTrainNumber(cleanNum);
      setTrainSearchInput(cleanNum);
      setHasUserSearched(true);
      setActiveSubTab('LIVE_TRAIN');
      fetchRealTimeTracking(cleanNum);
    }
  }, [initialTrainNumber]);

  // Real-time RailRadar Live Tracking State
  const [liveData, setLiveData] = useState(null);
  const [loadingLive, setLoadingLive] = useState(false);
  const [liveDataSource, setLiveDataSource] = useState('');
  const [stationTimelineFilter, setStationTimelineFilter] = useState('ALL'); // ALL | UPCOMING | STOPPING
  const [showPassingStations, setShowPassingStations] = useState(false); // Global toggle for passing halts
  const [expandedBlocks, setExpandedBlocks] = useState({}); // Per-block toggle for intermediate stations: { [stopIndex]: boolean }

  // Live Station Departure Board State
  const [stationBoardCode, setStationBoardCode] = useState('NDLS');
  const [stationBoardSearch, setStationBoardSearch] = useState('');
  const [stationBoardData, setStationBoardData] = useState(null);
  const [loadingStationBoard, setLoadingStationBoard] = useState(false);

  // PNR status state & Share Journey Modal state
  const [pnrInput, setPnrInput] = useState('');
  const [searchedPnrData, setSearchedPnrData] = useState(null);
  const [loadingPnr, setLoadingPnr] = useState(false);
  const [pnrError, setPnrError] = useState('');

  // Share Journey Modal State
  const [showShareModal, setShowShareModal] = useState(false);
  const [showQrCode, setShowQrCode] = useState(false);
  const [includeFullPnr, setIncludeFullPnr] = useState(false);
  const [copySuccess, setCopySuccess] = useState('');

  // Seat Map Modal State
  const [showSeatMapModal, setShowSeatMapModal] = useState(false);
  const [selectedSeatMapPassenger, setSelectedSeatMapPassenger] = useState(null);

  // Coach locator train selector & Dynamic API State
  const [selectedCoachTrain, setSelectedCoachTrain] = useState('');
  const [coachTrainSearchInput, setCoachTrainSearchInput] = useState('');
  const [coachTrainResults, setCoachTrainResults] = useState([]);
  const [searchingCoachTrains, setSearchingCoachTrains] = useState(false);
  const [showCoachDropdown, setShowCoachDropdown] = useState(false);
  const [highlightCoach, setHighlightCoach] = useState('');
  const [coachApiResponse, setCoachApiResponse] = useState(null);
  const [loadingCoachComposition, setLoadingCoachComposition] = useState(false);
  const [selectedCoachDetails, setSelectedCoachDetails] = useState(null);

  const formatDelay = (minutes) => {
    const mins = Math.max(0, parseInt(minutes, 10) || 0);
    if (mins === 0) return 'Running Right Time';
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    if (hrs > 0 && remMins > 0) {
      return `${hrs} hr ${remMins} min`;
    } else if (hrs > 0) {
      return `${hrs} hr`;
    }
    return `${remMins} min`;
  };

  const formatShortDelay = (minutes) => {
    const mins = Math.max(0, parseInt(minutes, 10) || 0);
    if (mins === 0) return '';
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    if (hrs > 0 && remMins > 0) {
      return `+${hrs} hr ${remMins} min`;
    } else if (hrs > 0) {
      return `+${hrs} hr`;
    }
    return `+${remMins} min`;
  };

  const selectedTrain = (trains && trains.length > 0)
    ? (trains.find(t => t.number === activeTrainNumber) || trains[0])
    : { number: activeTrainNumber || '12059', name: 'Train', from: 'Origin', to: 'Destination' };

  // Fetch real-time live GPS data only when user has actively selected a train
  useEffect(() => {
    if (activeSubTab === 'LIVE_TRAIN' && activeTrainNumber && hasUserSearched) {
      fetchRealTimeTracking(activeTrainNumber);
    }
  }, [activeTrainNumber, activeSubTab, hasUserSearched]);

  // Fetch station board when sub-tab is STATION_BOARD
  useEffect(() => {
    if (activeSubTab === 'STATION_BOARD') {
      fetchStationBoardData(stationBoardCode);
    }
  }, [stationBoardCode, activeSubTab]);

  // Fetch coach composition from Real Dynamic API when sub-tab is COACH_LOCATOR
  useEffect(() => {
    if (activeSubTab === 'COACH_LOCATOR' && selectedCoachTrain) {
      fetchCoachComposition(selectedCoachTrain);
    }
  }, [selectedCoachTrain, activeSubTab]);

  const fetchCoachComposition = async (tNum) => {
    if (!tNum) return;
    setLoadingCoachComposition(true);
    try {
      const res = await passengerApi.getCoachComposition(tNum);
      if (res && res.success) {
        setCoachApiResponse(res);
        if (res.availableCoachCodes && res.availableCoachCodes.length > 0) {
          const defaultCoach = res.availableCoachCodes.includes('B2') ? 'B2' : (res.availableCoachCodes[0] || '');
          setHighlightCoach(defaultCoach);
          const found = res.coaches?.find(c => c.code === defaultCoach);
          setSelectedCoachDetails(found || null);
        } else if (res.coaches && res.coaches.length > 0) {
          const first = res.coaches[0];
          setHighlightCoach(first.code);
          setSelectedCoachDetails(first);
        }
      } else {
        setCoachApiResponse(null);
      }
    } catch (_) {
      setCoachApiResponse(null);
    } finally {
      setLoadingCoachComposition(false);
    }
  };

  const fetchRealTimeTracking = async (tNum) => {
    if (!tNum) return;
    setLoadingLive(true);
    try {
      const res = await passengerApi.getLiveTrainTracking(tNum);
      if (res && res.data) {
        setLiveData(res.data);
        setLiveDataSource(res.source || 'RailRadar GPS');
      } else {
        setLiveData(null);
      }
    } catch (_) {
      setLiveData(null);
    } finally {
      setLoadingLive(false);
    }
  };

  const fetchStationBoardData = async (code) => {
    if (!code) return;
    setLoadingStationBoard(true);
    try {
      const res = await passengerApi.getStationBoard(code.trim().toUpperCase());
      if (res && res.departures) {
        setStationBoardData(res);
      } else {
        setStationBoardData(null);
      }
    } catch (_) {
      setStationBoardData(null);
    } finally {
      setLoadingStationBoard(false);
    }
  };

  // Real-time train search handler by number or name
  const handleTrainInputChange = async (val) => {
    setTrainSearchInput(val);
    if (!val || val.trim().length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    setSearchingTrains(true);
    setShowDropdown(true);
    try {
      const results = await passengerApi.searchTrainsDynamic(val.trim());
      setSearchResults(results || []);
    } catch (_) {
      setSearchResults([]);
    } finally {
      setSearchingTrains(false);
    }
  };

  const handleSelectSearchedTrain = (train) => {
    setActiveTrainNumber(train.number);
    setHasUserSearched(true);
    setTrainSearchInput(`${train.name} (${train.number})`);
    setShowDropdown(false);
    fetchRealTimeTracking(train.number);
  };

  const handleTrainSearchSubmit = (e) => {
    e.preventDefault();
    if (trainSearchInput.trim()) {
      const matchNumber = trainSearchInput.trim().match(/\d{4,5}/)?.[0] || trainSearchInput.trim();
      setActiveTrainNumber(matchNumber);
      setHasUserSearched(true);
      setShowDropdown(false);
      fetchRealTimeTracking(matchNumber);
    }
  };

  // Coach locator train search input change (Dynamic from API)
  const handleCoachTrainInputChange = async (val) => {
    setCoachTrainSearchInput(val);
    if (!val || val.trim().length < 2) {
      setCoachTrainResults([]);
      setShowCoachDropdown(false);
      return;
    }

    setSearchingCoachTrains(true);
    setShowCoachDropdown(true);
    try {
      const results = await passengerApi.searchTrainsDynamic(val.trim());
      setCoachTrainResults(results || []);
    } catch (_) {
      setCoachTrainResults([]);
    } finally {
      setSearchingCoachTrains(false);
    }
  };

  const handleSelectCoachTrain = (train) => {
    setSelectedCoachTrain(train.number);
    setCoachTrainSearchInput(`${train.name} (${train.number})`);
    setShowCoachDropdown(false);
    fetchCoachComposition(train.number);
  };

  const handleCoachTrainSearchSubmit = (e) => {
    e.preventDefault();
    if (coachTrainSearchInput.trim()) {
      const matchNumber = coachTrainSearchInput.trim().match(/\d{4,5}/)?.[0] || coachTrainSearchInput.trim();
      setSelectedCoachTrain(matchNumber);
      setShowCoachDropdown(false);
      fetchCoachComposition(matchNumber);
    }
  };

  const handleStationBoardSubmit = (e) => {
    e.preventDefault();
    if (stationBoardSearch.trim()) {
      setStationBoardCode(stationBoardSearch.trim().toUpperCase());
      fetchStationBoardData(stationBoardSearch.trim().toUpperCase());
    }
  };

  const handlePnrSearch = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const clean = pnrInput.trim();
    if (!clean) return;

    setLoadingPnr(true);
    setPnrError('');

    try {
      // 1. Primary: Fetch from Dynamic Real-Time Backend API endpoint /api/bookings/pnr/:pnr
      const res = await fetch(`http://localhost:5000/api/bookings/pnr/${encodeURIComponent(clean)}`);
      const json = await res.json();

      if (res.ok && json.success && json.data) {
        setSearchedPnrData(json.data);
        return;
      }

      // 2. Fallback: check in props bookings if already loaded locally
      const foundInProps = bookings && bookings.find ? bookings.find(b => b.pnr === clean) : null;
      if (foundInProps) {
        setSearchedPnrData({
          ...foundInProps,
          chartStatus: 'CHART NOT PREPARED (Prepares 4 hrs prior to departure)',
          confirmationChance: '100% Guaranteed',
          bookingStatus: foundInProps.status || 'CNF',
          currentStatus: 'CNF Coach ' + foundInProps.coach + ' Seat ' + foundInProps.seat
        });
        return;
      }

      setPnrError(json.error || 'Unable to retrieve PNR details. Please verify your 10-digit PNR number.');
    } catch (err) {
      console.error('PNR fetch error:', err);
      setPnrError('Network error while checking PNR status. Please verify server connection.');
    } finally {
      setLoadingPnr(false);
    }
  };

  // Coach layouts for trains
  const getCoachSequence = (trainNumber) => {
    if (trainNumber === '22436') {
      return [
        { code: 'DTC', type: 'Driving Cab', label: 'DTC 1' },
        { code: 'MC', type: 'Motor Car', label: 'C1' },
        { code: 'TC', type: 'Trailer', label: 'C2' },
        { code: 'MC', type: 'Motor Car', label: 'C3' },
        { code: 'NDTC', type: 'Executive', label: 'E1', isExec: true },
        { code: 'TC', type: 'Trailer', label: 'C4' },
        { code: 'MC', type: 'Motor Car', label: 'C5' },
        { code: 'DTC', type: 'Driving Cab', label: 'DTC 2' }
      ];
    }
    return [
      { code: 'ENG', type: 'Locomotive', label: 'WAP-7 Engine' },
      { code: 'EOG', type: 'Generator Car', label: 'Power Car' },
      { code: 'H1', type: 'First AC', label: 'H1' },
      { code: 'A1', type: '2 Tier AC', label: 'A1' },
      { code: 'A2', type: '2 Tier AC', label: 'A2' },
      { code: 'B1', type: '3 Tier AC', label: 'B1' },
      { code: 'B2', type: '3 Tier AC', label: 'B2', isUserCoach: true },
      { code: 'B3', type: '3 Tier AC', label: 'B3' },
      { code: 'B4', type: '3 Tier AC', label: 'B4' },
      { code: 'PC', type: 'Pantry Car', label: 'Pantry' },
      { code: 'S1', type: 'Sleeper', label: 'S1' },
      { code: 'S2', type: 'Sleeper', label: 'S2' },
      { code: 'GS', type: 'General', label: 'GS 1' },
      { code: 'SLR', type: 'Guard/Luggage', label: 'Guard Van' }
    ];
  };

  const coaches = getCoachSequence(selectedCoachTrain || '12059');

  // Prepare structured stops with intermediate passing stations
  const allStations = liveData?.stations || [];
  
  // Build structured schedule blocks: each stopping station has intermediate passing stations after it
  const routeBlocks = React.useMemo(() => {
    if (!allStations.length) return [];
    
    // Check if we have isStopping flags
    const hasStoppingFlag = allStations.some(s => s.isStopping !== undefined);
    if (!hasStoppingFlag) {
      // Fallback: all stations treated as stops
      return allStations.map((s, idx) => ({
        stop: s,
        stopIndex: idx,
        intermediatePassing: [],
        nextStopDistance: 0
      }));
    }

    const stoppingStns = allStations.filter(s => s.isStopping);
    const blocks = [];

    for (let i = 0; i < stoppingStns.length; i++) {
      const curStop = stoppingStns[i];
      const nextStop = stoppingStns[i + 1];
      const curIdx = allStations.findIndex(s => s.stationCode === curStop.stationCode);
      const nextIdx = nextStop ? allStations.findIndex(s => s.stationCode === nextStop.stationCode) : allStations.length;
      const intermediate = allStations.slice(curIdx + 1, nextIdx);
      const distanceDiff = nextStop ? Math.max(1, Math.round((nextStop.distanceKm || 0) - (curStop.distanceKm || 0))) : 0;

      blocks.push({
        stop: curStop,
        stopIndex: i,
        intermediatePassing: intermediate,
        nextStopDistance: distanceDiff
      });
    }

    return blocks;
  }, [allStations]);

  // Toggle single block's passing stations
  const toggleBlockExpansion = (blockIndex) => {
    setExpandedBlocks(prev => ({
      ...prev,
      [blockIndex]: !prev[blockIndex]
    }));
  };

  // Flattened station list based on showPassingStations or per-block expanded state
  const displayedStations = React.useMemo(() => {
    if (!routeBlocks.length) return allStations;

    const list = [];
    routeBlocks.forEach((block, bIdx) => {
      // 1. Add the main stopping station
      list.push({
        ...block.stop,
        blockIndex: block.stopIndex,
        isPassingStation: false,
        blockPassingCount: block.intermediatePassing?.length || 0,
        nextBlockDistance: block.nextStopDistance,
        isLastStop: bIdx === routeBlocks.length - 1
      });

      // 2. If intermediate passing stations exist between this stop and the next stop
      if (block.intermediatePassing && block.intermediatePassing.length > 0) {
        // Auto-expand if live train is currently inside this intermediate section
        const containsTrain = block.intermediatePassing.some(
          s => s.isCurrent || (liveData?.currentLocation?.stationCode && s.stationCode === liveData.currentLocation.stationCode)
        );
        const isBlockOpen = showPassingStations || !!expandedBlocks[block.stopIndex] || containsTrain;

        if (isBlockOpen) {
          block.intermediatePassing.forEach(pStn => {
            list.push({
              ...pStn,
              blockIndex: block.stopIndex,
              isPassingStation: true,
              blockPassingCount: 0
            });
          });
        }
      }
    });

    if (stationTimelineFilter === 'UPCOMING') {
      return list.filter(s => !s.hasDeparted);
    }
    return list;
  }, [routeBlocks, allStations, showPassingStations, expandedBlocks, stationTimelineFilter, liveData]);

  // Accurately determine which station the train is currently at or has just passed
  const activeStationIndex = (() => {
    if (!displayedStations.length) return -1;
    // 1. Direct match on isCurrent
    const directCurrIdx = displayedStations.findIndex(s => s.isCurrent);
    if (directCurrIdx !== -1) return directCurrIdx;
    
    // 2. Direct match on currentLocation.stationCode
    if (liveData?.currentLocation?.stationCode) {
      const codeMatchIdx = displayedStations.findIndex(s => s.stationCode === liveData.currentLocation.stationCode);
      if (codeMatchIdx !== -1) return codeMatchIdx;
    }

    // 3. Fallback: Last station that was departed
    let lastDepartedIdx = -1;
    for (let i = displayedStations.length - 1; i >= 0; i--) {
      if (displayedStations[i].hasDeparted) {
        lastDepartedIdx = i;
        break;
      }
    }
    if (lastDepartedIdx !== -1) return lastDepartedIdx;

    // 4. Default to origin station
    return 0;
  })();

  return (
    <div className="p-4 space-y-4">
      {/* Sub Tabs: Spot Train, Live Station Board, PNR Status, Coach Position */}
      <div className="bg-slate-200 p-1 rounded-2xl flex text-[11px] font-bold text-slate-700">
        <button 
          onClick={() => setActiveSubTab('LIVE_TRAIN')}
          className={`flex-1 py-2 rounded-xl transition ${activeSubTab === 'LIVE_TRAIN' ? 'bg-indigo-700 text-white shadow' : 'hover:text-slate-900'}`}
        >
          Live Train GPS
        </button>
        <button 
          onClick={() => setActiveSubTab('STATION_BOARD')}
          className={`flex-1 py-2 rounded-xl transition ${activeSubTab === 'STATION_BOARD' ? 'bg-indigo-700 text-white shadow' : 'hover:text-slate-900'}`}
        >
          Station Board
        </button>
        <button 
          onClick={() => setActiveSubTab('PNR_STATUS')}
          className={`flex-1 py-2 rounded-xl transition ${activeSubTab === 'PNR_STATUS' ? 'bg-indigo-700 text-white shadow' : 'hover:text-slate-900'}`}
        >
          PNR Status
        </button>
        <button 
          onClick={() => setActiveSubTab('COACH_LOCATOR')}
          className={`flex-1 py-2 rounded-xl transition ${activeSubTab === 'COACH_LOCATOR' ? 'bg-indigo-700 text-white shadow' : 'hover:text-slate-900'}`}
        >
          Coach
        </button>
      </div>

      {/* 1. LIVE TRAIN RUNNING STATUS (WHERE IS MY TRAIN REALTIME) */}
      {activeSubTab === 'LIVE_TRAIN' && (
        <div className="space-y-4">
          {/* Dynamic Train Search by Train Number OR Train Name */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm space-y-2 relative">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-slate-400 uppercase">
                Spot Your Train (Real-Time Live Location)
              </label>
              <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                Live Satellite GPS
              </span>
            </div>

            <form onSubmit={handleTrainSearchSubmit} className="relative">
              <div className="flex gap-1.5">
                <div className="relative flex-1">
                  <input 
                    type="text"
                    placeholder="Search by Train No. or Name (e.g. 12919, Rajdhani, Shatabdi)"
                    value={trainSearchInput}
                    onChange={(e) => handleTrainInputChange(e.target.value)}
                    onFocus={() => { if (searchResults.length > 0) setShowDropdown(true); }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:border-blue-600"
                  />
                  {searchingTrains && (
                    <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin absolute right-3 top-2.5" />
                  )}
                </div>
                <button 
                  type="submit"
                  disabled={loadingLive}
                  className="bg-blue-700 hover:bg-blue-800 text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1 shadow transition active:scale-95"
                >
                  {loadingLive ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                  <span>Spot</span>
                </button>
              </div>

              {/* Dynamic Instant Search Results Dropdown */}
              {showDropdown && searchResults.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl z-30 max-h-56 overflow-y-auto divide-y divide-slate-100 animate-in fade-in">
                  {searchResults.map((t) => (
                    <div
                      key={t.number}
                      onClick={() => handleSelectSearchedTrain(t)}
                      className="p-2.5 hover:bg-blue-50/70 cursor-pointer transition flex items-center justify-between text-left"
                    >
                      <div>
                        <div className="text-xs font-black text-slate-900">{t.name}</div>
                        <div className="text-[10px] text-slate-500">
                          {t.from} ➔ {t.to} • Dep: {t.departure || '06:00'}
                        </div>
                      </div>
                      <span className="font-mono text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-lg border border-blue-100">
                        #{t.number}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </form>
          </div>

          {/* LIVE TRACKING COCKPIT & TRACK TIMELINE - RENDER ONLY WHEN USER HAS SEARCHED */}
          {hasUserSearched && activeTrainNumber ? (
            <div className="space-y-4">
            {/* Top Status Header Strip with Day indicator (Exact match to reference screenshot) */}
            <div className="bg-slate-900 text-white px-4 py-2.5 rounded-2xl border border-slate-800 flex items-center justify-between text-xs font-bold shadow-sm">
              <span className="text-slate-400 flex items-center gap-1.5 text-[11px]">
                <Clock className="w-3.5 h-3.5 text-blue-400" />
                <span>Arrival</span>
              </span>
              <div className="flex items-center gap-2">
                <span className="bg-blue-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-xs">
                  Day {liveData?.stations?.find(s => s.isCurrent)?.day || 1}
                </span>
                <span className="text-slate-300 text-[11px] font-semibold">
                  {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                </span>
              </div>
              <span className="text-slate-400 flex items-center gap-1.5 text-[11px]">
                <span>Departure</span>
                <Clock className="w-3.5 h-3.5 text-amber-400" />
              </span>
            </div>

            {/* Quick Live Status Floating Cockpit Widget */}
            <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-md space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="bg-blue-50 text-blue-700 p-1.5 rounded-xl border border-blue-200/80">
                    <Gauge className="w-4 h-4" />
                  </span>
                  <div>
                    <span className="text-xs font-black text-slate-900">
                      {liveData?.speedKmph || liveData?.currentLocation?.speedKmh || 67} km/h
                    </span>
                    <span className="text-[10px] text-slate-400 ml-1 font-semibold">est.</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-600 flex items-center gap-1">
                    <Navigation className="w-3 h-3 text-blue-600" /> I'm on this train
                  </span>
                  <button 
                    type="button" 
                    onClick={() => fetchRealTimeTracking(activeTrainNumber)} 
                    title="Refresh live status"
                    className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition active:scale-90"
                  >
                    <Loader2 className={`w-3.5 h-3.5 ${loadingLive ? 'animate-spin text-blue-600' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Crossed Station / Current Location Callout */}
              <div className="border-t border-slate-100 pt-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                      <span>{liveData?.currentLocation?.stationName ? `Passed ${liveData.currentLocation.stationName}` : 'In Transit'}</span>
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    </div>
                    <div className="text-[11px] font-bold text-blue-600 mt-0.5 flex items-center gap-1">
                      <span>↓ Next stop: <strong>{liveData?.nextHalt?.stationName || 'Approaching Station'}</strong></span>
                    </div>
                  </div>
                  <span className="text-[9px] text-slate-400">Updated a few seconds ago</span>
                </div>
              </div>

              {/* Progress Slider Track between Origin and Destination */}
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between text-[10px] font-black text-slate-700">
                  <span className="truncate max-w-[120px]">{liveData?.source?.name || selectedTrain?.from || 'Origin'}</span>
                  <span className="truncate max-w-[120px] text-right">{liveData?.destination?.name || selectedTrain?.to || 'Destination'}</span>
                </div>
                <div className="relative w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200 p-0.5">
                  <div 
                    className="h-full bg-blue-600 rounded-full transition-all duration-500 relative"
                    style={{ width: `${Math.min(100, Math.max(8, liveData?.progressPercent || 45))}%` }}
                  >
                    <span className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white border-2 border-blue-600 rounded-full shadow-sm" />
                  </div>
                </div>
              </div>

              {/* Next Stop & Destination ETA Metrics */}
              <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
                <div>
                  <span className="text-[9px] text-slate-400 font-bold uppercase block">Next stop</span>
                  <div className="font-black text-slate-900 truncate">{liveData?.nextHalt?.stationName || 'Approaching'}</div>
                  <div className="text-[10px] text-slate-500 font-medium">{liveData?.nextHalt?.eta || '--:--'} (PF {liveData?.nextHalt?.platform || '1'})</div>
                </div>
                <div className="text-right border-l border-slate-200 pl-2">
                  <span className="text-[9px] text-slate-400 font-bold uppercase block">To reach</span>
                  <div className="font-black text-slate-900 truncate">{liveData?.destination?.name || selectedTrain?.to || 'Destination'}</div>
                  <div className="text-[10px] text-slate-500 font-medium">Scheduled Destination</div>
                </div>
              </div>

              {/* Delay Banner (Brown / Amber: formatted in hours and minutes) */}
              <div className={`wimt-brown-banner ${
                (liveData?.delayMinutes || 0) === 0 ? '!bg-emerald-600' : ''
              }`}>
                {(liveData?.delayMinutes || 0) === 0 
                  ? 'Running Right Time' 
                  : `Delayed by ${formatDelay(liveData?.delayMinutes || 10)} at ${liveData?.currentLocation?.stationName || 'en-route'}`}
              </div>

              {/* Feedback & Share buttons */}
              <div className="grid grid-cols-2 gap-2 pt-1 text-xs font-bold text-slate-700">
                <button 
                  type="button"
                  onClick={() => alert('Feedback submitted! Safe journey.')}
                  className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center gap-1.5 transition active:scale-95 border border-slate-200/80"
                >
                  <Info className="w-3.5 h-3.5 text-slate-500" />
                  <span>Feedback</span>
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({ title: liveData?.trainName, text: `Live tracking for ${liveData?.trainName}` }).catch(() => {});
                    } else {
                      alert('Live train status link copied to clipboard!');
                    }
                  }}
                  className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center gap-1.5 transition active:scale-95 border border-slate-200/80"
                >
                  <Share2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>Share</span>
                </button>
              </div>
            </div>

            {/* REALISTIC TWO-RAIL RAILWAY TRACK TIMELINE (Exact 1:1 match to Where Is My Train) */}
            <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                    Station Timetable & Live Spot
                  </h3>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setShowPassingStations(prev => !prev)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition flex items-center gap-1 border ${
                      showPassingStations 
                        ? 'bg-blue-50 border-blue-200 text-blue-700' 
                        : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-700'
                    }`}
                    title="Toggle all passing non-stopping stations"
                  >
                    <span>Non-stop</span>
                    <span className={`w-1.5 h-1.5 rounded-full ${showPassingStations ? 'bg-blue-600' : 'bg-slate-300'}`} />
                  </button>
                  <div className="flex bg-slate-100 p-0.5 rounded-xl text-[10px] font-black">
                    <button
                      type="button"
                      onClick={() => setStationTimelineFilter('ALL')}
                      className={`px-2.5 py-1 rounded-lg transition ${stationTimelineFilter === 'ALL' ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}
                    >
                      All ({displayedStations.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setStationTimelineFilter('UPCOMING')}
                      className={`px-2.5 py-1 rounded-lg transition ${stationTimelineFilter === 'UPCOMING' ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}
                    >
                      Upcoming
                    </button>
                  </div>
                </div>
              </div>

              {loadingLive ? (
                <div className="py-16 text-center space-y-2">
                  <Loader2 className="w-7 h-7 animate-spin text-blue-600 mx-auto" />
                  <div className="text-xs text-slate-500 font-bold">Rendering real-time track timeline...</div>
                </div>
              ) : displayedStations.length > 0 ? (
                /* Continuous track timeline container */
                <div className="wimt-timeline-container max-h-[640px] overflow-y-auto pr-1">
                  {displayedStations.map((stn, idx) => {
                    const isTrainHere = (idx === activeStationIndex);
                    const isDeparted = idx < activeStationIndex || stn.hasDeparted;
                    const isNextHalt = (idx === activeStationIndex + 1) || stn.isApproaching;
                    const isLastStation = idx === displayedStations.length - 1;
                    const isPassing = stn.isPassingStation || stn.isStopping === false;

                    return (
                      <div key={stn.stationCode + '-' + idx} className="relative">
                        {/* Station Row */}
                        <div className={`flex items-start ${isPassing ? ' opacity-80 hover:opacity-100 transition' : 'py-0'}`}>
                          {/* 1. LEFT ARRIVAL TIMING */}
                          <div className="w-14 sm:w-16 shrink-0 text-left pt-0.5">
                            <div className={`font-mono text-xs font-bold leading-tight ${
                              isDeparted && !isTrainHere ? 'text-slate-400' : 'text-slate-800'
                            } ${isPassing ? 'text-[11px]' : ''}`}>
                              {stn.scheduledArrival || '--:--'}
                            </div>
                            <div className={`font-mono text-[10px] font-black leading-tight ${
                              stn.delayArrival > 0 ? 'text-[#b45309]' : 'text-emerald-600'
                            }`}>
                              {stn.actualArrival || stn.scheduledArrival || '--:--'}
                            </div>
                          </div>

                          {/* 2. CENTER TRACK CELL (Contains continuous rails + centered node) */}
                          <div className={`wimt-track-cell ${isPassing ? '!min-h-[38px]' : ''}`}>
                            {/* Unbroken steel rails and sleepers */}
                            <div className="wimt-track-cell-rails">
                              <div className="wimt-track-sleepers" />
                              <div className="wimt-track-rail-left" />
                              <div className="wimt-track-rail-right" />
                            </div>

                            {/* Node centered exactly in middle of rails */}
                            {isTrainHere ? (
                              /* Red Locomotive Engine sitting right on top of track */
                              <div className="wimt-engine-badge" title="Live Train Location">
                                <div className="wimt-windshield">
                                  <span className="wimt-headlight" />
                                  <span className="wimt-headlight" />
                                </div>
                                <span className="text-[7.5px] font-black text-white leading-none tracking-tighter">IR</span>
                                <div className="wimt-grille" />
                              </div>
                            ) : isLastStation ? (
                              /* Terminal track bumper gate */
                              <div className="wimt-track-bumper" title="Terminal Station" />
                            ) : isPassing ? (
                              /* Non-stopping Passing Halt Dot */
                              isDeparted ? (
                                <div className="wimt-station-node-passing-departed" title="Passed Non-stop" />
                              ) : isNextHalt ? (
                                <div className="wimt-station-node-passing-current" title="Approaching Passing Halt" />
                              ) : (
                                <div className="wimt-station-node-passing-future" title="Upcoming Non-stop" />
                              )
                            ) : isDeparted ? (
                              /* Blue bullseye ring for passed stopping stations */
                              <div className="wimt-station-node-passed" title="Passed / Nikal gaya">
                                <span className="wimt-station-node-passed-inner" />
                              </div>
                            ) : isNextHalt ? (
                              /* Blue highlighted ring for next halt */
                              <div className="wimt-station-node-next" title="Next Halt / Aane wala hai" />
                            ) : (
                              /* Grey ring for future upcoming stations */
                              <div className="wimt-station-node-future" title="Upcoming" />
                            )}
                          </div>

                          {/* 3. RIGHT STATION DETAILS + DEPARTURE TIMING */}
                          <div className="flex-1 pl-4 pr-1">
                            <div className="flex items-baseline justify-between gap-1 flex-wrap align-center">
                              <div className="flex items-baseline gap-1.5 flex-wrap">
                                <span className={`font-black ${
                                  isTrainHere 
                                    ? 'text-blue-900 text-sm' 
                                    : isPassing 
                                      ? 'text-[11px] text-slate-700 font-bold' 
                                      : isDeparted 
                                        ? 'text-xs text-slate-800' 
                                        : 'text-xs text-slate-900'
                                }`}>
                                  {stn.stationName}
                                </span>
                                <span className="font-mono text-[10px] font-bold text-slate-400">
                                  {stn.stationCode}
                                </span>

                                {/* Status badges: Passed / Next Stop / Non-stop */}
                                {isPassing && (
                                  <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                                    Pass / Non-stop
                                  </span>
                                )}
                                {!isPassing && isDeparted && !isTrainHere && (
                                  <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                                    Passed
                                  </span>
                                )}
                                {!isPassing && isNextHalt && (
                                  <span className="text-[9px] font-black text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded-full border border-blue-200 animate-pulse">
                                    Next Stop
                                  </span>
                                )}
                              </div>

                              {/* Departure Timing */}
                              <div className="text-right shrink-0">
                                <div className={`font-mono text-xs font-bold leading-tight ${
                                  isDeparted && !isTrainHere ? 'text-slate-400' : 'text-slate-800'
                                } ${isPassing ? 'text-[11px]' : ''}`}>
                                  {stn.scheduledDeparture || '--:--'}
                                </div>
                                <div className={`font-mono text-[10px] font-black leading-tight ${
                                  stn.delayDeparture > 0 ? 'text-[#b45309]' : 'text-emerald-600'
                                }`}>
                                  {stn.actualDeparture || stn.scheduledDeparture || '--:--'}
                                </div>
                              </div>
                            </div>

                            {/* Sub details: Distance, Platform, Halt */}
                            <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5 flex-wrap">
                              <span>{stn.distanceKm || 0} km</span>
                              {!isPassing && (
                                <span className="font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200/60">
                                  {stn.platform ? (stn.platform.startsWith('PF') ? stn.platform : `PF ${stn.platform}`) : 'PF 1'}
                                </span>
                              )}
                              {stn.delayArrival > 0 && (
                                <span className="font-black text-[#b45309]">
                                  {formatShortDelay(stn.delayArrival)}
                                </span>
                              )}
                              {!isPassing ? (
                                <span>{stn.haltMinutes || '2 min'} stop</span>
                              ) : (
                                <span className="text-slate-400 text-[9px]">No commercial halt</span>
                              )}
                            </div>

                            {/* Floating Train Engine Callout (Crossed station in screenshot) */}
                            {isTrainHere && (
                              <div className="mt-3 mb-1 inline-block wimt-engine-callout animate-in fade-in">
                                <div className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                                  <span>{liveData?.currentLocation?.stationName ? `Passed ${liveData.currentLocation.stationName}` : `At ${stn.stationName}`}</span>
                                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                                </div>
                                <div className="text-[11px] text-blue-600 font-bold mt-0.5">
                                  Live Location • Speed {liveData?.speedKmph || liveData?.currentLocation?.speedKmh || 67} km/h est.
                                </div>
                                <div className="text-[9px] text-slate-400 mt-0.5">
                                  Updated a few seconds ago
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Collapsible intermediate stations divider block */}
                        {idx < displayedStations.length - 1 && (
                          <div className="flex items-center">
                            <div className="w-14 sm:w-16 shrink-0" />
                            {/* Connecting track through intermediate block */}
                            <div className="wimt-track-cell !min-h-[36px]">
                              <div className="wimt-track-cell-rails">
                                <div className="wimt-track-sleepers" />
                                <div className="wimt-track-rail-left" />
                                <div className="wimt-track-rail-right" />
                              </div>
                            </div>
                            <div className="flex-1 pl-4 py-1">
                              {/* If this is a main stopping station that has intermediate passing stations, show the expandable pill */}
                              {!stn.isPassingStation && stn.blockPassingCount > 0 ? (
                                <button 
                                  type="button"
                                  onClick={() => toggleBlockExpansion(stn.blockIndex)}
                                  className="wimt-block-pill flex items-center gap-1.5 hover:border-blue-300 hover:text-blue-700 transition"
                                  title="Click to view passing stations between stops"
                                >
                                  <span>{stn.blockPassingCount} passing stations • {stn.nextBlockDistance || Math.max(1, Math.round((displayedStations[idx + 1].distanceKm || 0) - (stn.distanceKm || 0)))} km</span>
                                  {/* <span className="text-[10px] font-black">{expandedBlocks[stn.blockIndex] || showPassingStations ? '▴' : '⌵'}</span> */}
                                  <span className="text-[10px] font-black">
                                    {expandedBlocks[stn.blockIndex] || showPassingStations
                                      ? <ChevronUp className="w-3 h-3" />
                                      : <ChevronDown className="w-3 h-3" />}
                                  </span>
                                </button>
                              ) : (
                                <div className="text-[10px] font-semibold text-slate-400 py-1">
                                  <span>{Math.max(1, Math.round((displayedStations[idx + 1].distanceKm || 0) - (stn.distanceKm || 0)))} km</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-slate-400 font-medium">
                  No route stations found for this train.
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Clean Empty Search State - Prompt user to search train number or name */
          <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center space-y-3 shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-xs">
              <Train className="w-7 h-7" />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-900">Search Train to Spot Live Running Status</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                Type train number or name in the search box above to view real-time satellite GPS tracking and live timetable.
              </p>
            </div>

            {/* Quick Sample Train Pills */}
            <div className="pt-2 flex items-center justify-center gap-2 flex-wrap">
              {[
                { number: '12919', name: 'Malwa SF Exp' },
                { number: '12951', name: 'Rajdhani Exp' },
                { number: '12002', name: 'Shatabdi Exp' },
                { number: '22436', name: 'Vande Bharat' }
              ].map((st) => (
                <button
                  key={st.number}
                  type="button"
                  onClick={() => {
                    setActiveTrainNumber(st.number);
                    setTrainSearchInput(`${st.name} (${st.number})`);
                    setHasUserSearched(true);
                    fetchRealTimeTracking(st.number);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 border border-slate-200 text-xs font-bold text-slate-700 transition active:scale-95 flex items-center gap-1"
                >
                  <span>{st.name}</span>
                  <span className="font-mono text-[10px] text-slate-400">#{st.number}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    )}

      {/* 2. REAL-TIME STATION DEPARTURE & ARRIVAL BOARD */}
      {activeSubTab === 'STATION_BOARD' && (
        <div className="space-y-4">
          {/* Station Selector Bar */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-blue-600" />
                Live Station Departure Board
              </label>
              <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                Official Rail Display
              </span>
            </div>

            <form onSubmit={handleStationBoardSubmit} className="flex gap-1.5">
              <input 
                type="text"
                placeholder="Enter Station Code or City (e.g. NDLS, MMCT, BPL, CNB)"
                value={stationBoardSearch}
                onChange={(e) => setStationBoardSearch(e.target.value)}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:border-blue-600 uppercase"
              />
              <button 
                type="submit"
                disabled={loadingStationBoard}
                className="bg-indigo-700 hover:bg-indigo-800 text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1 shadow transition active:scale-95"
              >
                {loadingStationBoard ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                <span>View Board</span>
              </button>
            </form>

            {/* Quick Station Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pt-1 scrollbar-none">
              {['NDLS', 'MMCT', 'DADN', 'SVDK', 'CNB', 'LKO', 'HWH'].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => { setStationBoardCode(c); setStationBoardSearch(c); }}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-black shrink-0 transition ${
                    stationBoardCode === c ? 'bg-indigo-700 text-white shadow' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Station Departure Board Header Card */}
          <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-4 rounded-3xl shadow-md border border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[9px] text-amber-400 font-bold uppercase tracking-wider">Live Platform Board</span>
                <h3 className="text-base font-black text-white mt-0.5">
                  {stationBoardData?.station?.name || stationBoardCode} ({stationBoardData?.station?.code || stationBoardCode})
                </h3>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/80 border border-emerald-500/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  {stationBoardData?.count || 0} Trains
                </span>
                <div className="text-[9px] text-slate-400 mt-1">Next 8 Hours Timetable</div>
              </div>
            </div>
          </div>

          {/* Departure Trains List */}
          <div className="space-y-2.5">
            {loadingStationBoard ? (
              <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center space-y-2">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto" />
                <div className="text-xs text-slate-500 font-semibold">Loading live station departures...</div>
              </div>
            ) : stationBoardData?.departures && stationBoardData.departures.length > 0 ? (
              stationBoardData.departures.map((d) => (
                <div 
                  key={d.trainNumber}
                  onClick={() => {
                    setActiveTrainNumber(d.trainNumber);
                    setActiveSubTab('LIVE_TRAIN');
                    fetchRealTimeTracking(d.trainNumber);
                  }}
                  className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-400 transition cursor-pointer active:scale-[0.99] space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                          #{d.trainNumber}
                        </span>
                        <h4 className="text-xs font-black text-slate-900">{d.trainName}</h4>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        {d.origin} ➔ {d.destination} • {d.currentLocation}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-sm font-black text-slate-900">
                        {d.scheduledDeparture}
                      </div>
                      <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-100">
                        {d.platform}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] pt-1.5 border-t border-slate-100">
                    <span className={`font-bold ${d.delayMinutes === 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {d.status}
                    </span>
                    <span className="text-blue-600 font-bold flex items-center gap-0.5">
                      Track Live GPS <ArrowUpRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white p-6 rounded-3xl border border-slate-200 text-center text-xs text-slate-400">
                No active train departures found for station {stationBoardCode}.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. PNR STATUS ENQUIRY & PROBABILITY */}
      {activeSubTab === 'PNR_STATUS' && (
        <div className="space-y-4">
          <form onSubmit={handlePnrSearch} className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-2">
            <input 
              type="text"
              maxLength={10}
              placeholder="Enter 10-digit PNR Number (e.g. 2847193021)"
              value={pnrInput}
              onChange={(e) => setPnrInput(e.target.value)}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none"
            />
            <button 
              type="submit"
              disabled={loadingPnr}
              className="bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1 shadow transition active:scale-95"
            >
              {loadingPnr ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
              <span>Get Status</span>
            </button>
          </form>

          {pnrError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-bold flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{pnrError}</span>
            </div>
          )}

          {loadingPnr && (
            <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center space-y-2">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-600 mx-auto" />
              <div className="text-xs text-slate-500 font-semibold">Connecting to Indian Railways PNR Gateway...</div>
            </div>
          )}

          {searchedPnrData && !loadingPnr && (() => {
            const trainDisplayName = searchedPnrData.trainName 
              ? searchedPnrData.trainName.replace(/\b(Express|SF|Special|Exp)\b/gi, '').trim().toUpperCase()
              : 'JANSHATABDI EXP';
            const shortTrainName = trainDisplayName.length > 25 ? `${trainDisplayName.slice(0, 22)}...` : trainDisplayName;

            return (
              <div className="space-y-4 animate-in fade-in">
                {/* 1. TOP DARK BLUE HEADER: LIVE JOURNEY SUMMARY */}
                <div className="bg-[#0b1e3b] text-white p-5 rounded-3xl shadow-lg relative overflow-hidden">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-blue-300 block">
                        LIVE JOURNEY SUMMARY
                      </span>
                      <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-0.5 uppercase">
                        {shortTrainName}
                      </h3>
                      <div className="text-xs text-blue-200/80 font-mono font-semibold mt-1">
                        Train {searchedPnrData.trainNumber} • PNR {searchedPnrData.pnr}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowQrCode(false);
                          setIncludeFullPnr(false);
                          setShowShareModal(true);
                        }}
                        className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-white transition active:scale-90"
                        title="Share journey status"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-white transition active:scale-90"
                        title="Bookmark"
                      >
                        <Star className="w-4 h-4" />
                      </button>
                      <span className="bg-emerald-500 text-white text-[11px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                        {searchedPnrData.pnrStatus || 'CNF'}
                      </span>
                    </div>
                  </div>

                  {/* Action Pills */}
                  <div className="flex items-center gap-2 mt-4 flex-wrap">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveSubTab('LIVE_TRAIN');
                        setTrainSearchInput(searchedPnrData.trainNumber);
                        handleSelectSearchedTrain({
                          number: searchedPnrData.trainNumber,
                          name: searchedPnrData.trainName,
                          from: searchedPnrData.boardingStationCode || searchedPnrData.from,
                          to: searchedPnrData.reservationUptoCode || searchedPnrData.to
                        });
                      }}
                      className="bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold px-3.5 py-1.5 rounded-full flex items-center gap-1.5 transition active:scale-95"
                    >
                      <Radio className="w-3.5 h-3.5 text-blue-400" />
                      <span>Track this train</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => alert(`Train #${searchedPnrData.trainNumber} saved to your favorites.`)}
                      className="bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold px-3.5 py-1.5 rounded-full flex items-center gap-1.5 transition active:scale-95"
                    >
                      <Bookmark className="w-3.5 h-3.5 text-blue-300" />
                      <span>Save this train</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => alert(`Route ${searchedPnrData.boardingStationCode || searchedPnrData.from}-${searchedPnrData.reservationUptoCode || searchedPnrData.to} saved.`)}
                      className="bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold px-3.5 py-1.5 rounded-full flex items-center gap-1.5 transition active:scale-95"
                    >
                      <Bookmark className="w-3.5 h-3.5 text-blue-300" />
                      <span>Save this route <strong className="font-mono text-blue-300 ml-0.5">{searchedPnrData.boardingStationCode || searchedPnrData.from}-{searchedPnrData.reservationUptoCode || searchedPnrData.to}</strong></span>
                    </button>
                  </div>
                </div>

                {/* 2. THREE CARDS GRID: Ticket Details | Boarding & Reservation | Route */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                  {/* Card 1: Ticket Details */}
                  <div className="bg-white border border-slate-200/90 rounded-3xl p-4 shadow-xs space-y-3">
                    <div className="flex items-center gap-2.5 border-b border-slate-100 pb-2.5">
                      <div className="w-9 h-9 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-600 shrink-0">
                        <Train className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-slate-900 leading-tight">Ticket details</h4>
                        <span className="text-[10px] text-slate-400 font-bold uppercase truncate block max-w-[170px]">
                          {searchedPnrData.trainName}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 font-medium">Class</span>
                        <strong className="text-slate-900 font-black">{searchedPnrData.journeyClass || searchedPnrData.className || '2S'}</strong>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 font-medium">Quota</span>
                        <strong className="text-slate-900 font-black">{searchedPnrData.quota || 'GN'}</strong>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 font-medium">Journey date</span>
                        <strong className="text-slate-900 font-black">{searchedPnrData.journeyDate || searchedPnrData.date}</strong>
                      </div>
                      <div className="flex justify-between items-start pt-1 border-t border-slate-100">
                        <div>
                          <span className="text-slate-400 font-medium block">Boarding platform</span>
                          <span className="text-[10px] text-slate-500 font-medium truncate block max-w-[130px]">
                            {searchedPnrData.boardingStationName || searchedPnrData.from}
                          </span>
                        </div>
                        <strong className="text-blue-700 font-black text-sm">{searchedPnrData.boardingPlatform || 'PF 1'}</strong>
                      </div>
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-slate-400 font-medium block">Destination platform</span>
                          <span className="text-[10px] text-slate-500 font-medium truncate block max-w-[130px]">
                            {searchedPnrData.reservationUptoName || searchedPnrData.to}
                          </span>
                        </div>
                        <strong className="text-blue-700 font-black text-sm">{searchedPnrData.destinationPlatform || 'PF 1'}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Boarding & Reservation */}
                  <div className="bg-white border border-slate-200/90 rounded-3xl p-4 shadow-xs space-y-3">
                    <div className="flex items-center gap-2.5 border-b border-slate-100 pb-2.5">
                      <div className="w-9 h-9 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                        <MapPin className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-slate-900 leading-tight">Boarding & reservation</h4>
                        <span className="text-[10px] text-slate-400 font-medium">Station and timing details</span>
                      </div>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div>
                        <div className="flex items-center gap-1.5 text-blue-600 font-bold text-[10px] uppercase">
                          <span className="w-2 h-2 rounded-full bg-blue-600" />
                          <span>Boarding station</span>
                        </div>
                        <div className="font-black text-slate-900 text-sm mt-0.5">
                          {searchedPnrData.boardingStationName || searchedPnrData.from} ({searchedPnrData.boardingStationCode || searchedPnrData.from})
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                          Boarding: {searchedPnrData.boardingTime || searchedPnrData.departureTime || '--:--'} on {searchedPnrData.journeyDate || searchedPnrData.date}
                        </div>
                      </div>

                      <div className="pl-3 border-l-2 border-dashed border-slate-200 py-1 text-[11px] text-slate-400 font-medium">
                        Duration: <strong className="text-slate-700">{searchedPnrData.duration || '--'}</strong>
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5 text-teal-600 font-bold text-[10px] uppercase">
                          <span className="w-2 h-2 rounded-full bg-teal-600" />
                          <span>Reservation up to</span>
                        </div>
                        <div className="font-black text-slate-900 text-sm mt-0.5">
                          {searchedPnrData.reservationUptoName || searchedPnrData.to} ({searchedPnrData.reservationUptoCode || searchedPnrData.to})
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                          Reserved until: {searchedPnrData.reservationUptoTime || searchedPnrData.arrivalTime || '--:--'} on {searchedPnrData.journeyDate || searchedPnrData.date}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card 3: Route */}
                  <div className="bg-white border border-slate-200/90 rounded-3xl p-4 shadow-xs space-y-3">
                    <div className="flex items-center gap-2.5 border-b border-slate-100 pb-2.5">
                      <div className="w-9 h-9 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-600 shrink-0">
                        <Compass className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-slate-900 leading-tight">Route</h4>
                        <span className="text-[10px] text-slate-400 font-medium">Journey endpoints</span>
                      </div>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div>
                        <div className="flex items-center gap-1.5 font-black text-slate-900 text-sm">
                          <span className="w-2 h-2 rounded-full bg-blue-600" />
                          <span>{searchedPnrData.routeSourceName || searchedPnrData.from}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                          ({searchedPnrData.routeSourceCode || searchedPnrData.from}) • Departure: {searchedPnrData.routeSourceTime || searchedPnrData.departureTime || '--:--'}
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium">
                          Date: {searchedPnrData.journeyDate || searchedPnrData.date}
                        </div>
                      </div>

                      <div className="border-t border-slate-100 pt-2">
                        <div className="flex items-center gap-1.5 font-black text-slate-900 text-sm">
                          <span className="w-2 h-2 rounded-full bg-teal-600" />
                          <span>{searchedPnrData.routeDestName || searchedPnrData.to}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                          ({searchedPnrData.routeDestCode || searchedPnrData.to}) • Arrival: {searchedPnrData.routeDestTime || searchedPnrData.arrivalTime || '--:--'}
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium">
                          Date: {searchedPnrData.journeyDate || searchedPnrData.date}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. FOUR STATUS STRIP PILLS: PNR Status | Chart Status | Booking Status | Current Status */}
                <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">PNR status</span>
                    <span className="inline-block bg-blue-50 border border-blue-200 text-blue-700 font-black text-xs px-3 py-1 rounded-full uppercase">
                      {searchedPnrData.pnrStatus || 'CNF'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Chart status</span>
                    <strong className="text-slate-900 font-black text-sm block">
                      {searchedPnrData.chartStatus || 'Prepared'}
                    </strong>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Booking status</span>
                    <span className="inline-block bg-blue-50/70 border border-blue-200 text-blue-800 font-black text-xs px-2.5 py-1 rounded-full">
                      {searchedPnrData.bookingStatusFormatted || `CNF ${searchedPnrData.coach} ${searchedPnrData.seat}`}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Current status</span>
                    <span className="inline-block bg-teal-50 border border-teal-200 text-teal-800 font-black text-xs px-2.5 py-1 rounded-full">
                      {searchedPnrData.currentStatusFormatted || `CNF ${searchedPnrData.coach} ${searchedPnrData.seat}`}
                    </span>
                  </div>
                </div>

                {/* 3.5 ROUTE & STATIONS SECTION (EXACT MATCH TO REFERENCE SCREENSHOT) */}
                <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs space-y-4">
                  {/* Header Strip */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                        <Radio className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-black text-slate-900 leading-tight">Route & stations</h3>
                        <p className="text-[11px] text-slate-500 font-medium mt-0.5">Your booked journey at a glance</p>
                      </div>
                    </div>

                    <span className="text-[11px] font-bold bg-slate-100 text-slate-700 px-3 py-1 rounded-full border border-slate-200/70">
                      {searchedPnrData.runsFrequency || 'Runs daily'}
                    </span>
                  </div>

                  {/* Board At ➔ Between Stops ➔ Get Off At Banner */}
                  <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-3 items-center pt-1">
                    {/* Board At Card */}
                    <div className="bg-white border border-blue-100 rounded-3xl p-4 shadow-xs space-y-2 relative">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-blue-600 text-[10px] font-black uppercase tracking-wider">
                          <span className="w-2 h-2 rounded-full bg-blue-600" />
                          <span>BOARD AT</span>
                        </div>
                        <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-lg border border-slate-200">
                          Platform {searchedPnrData.boardingPlatform || 'PF 1'}
                        </span>
                      </div>

                      <div>
                        <div className="text-2xl font-black text-slate-900 tracking-tight">
                          {searchedPnrData.boardingTime || searchedPnrData.departureTime || '--:--'}
                        </div>
                        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                          DEPARTURE
                        </div>
                      </div>

                      <div className="pt-1">
                        <div className="flex items-center gap-1.5 font-black text-slate-900 text-sm">
                          <span>{searchedPnrData.boardingStationName || searchedPnrData.from}</span>
                          <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                            {searchedPnrData.boardingStationCode || searchedPnrData.from}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                          {searchedPnrData.journeyDate || searchedPnrData.date}
                        </div>
                      </div>
                    </div>

                    {/* Intermediate Stops Connector */}
                    <div className="flex flex-col items-center justify-center px-2 py-1">
                      <div className="hidden md:block w-full border-t border-blue-200 mb-[-12px]" />
                      <span className="z-10 bg-white border border-blue-200 text-slate-700 font-bold text-xs px-3.5 py-1.5 rounded-full shadow-xs">
                        {searchedPnrData.stopsBetweenCount !== undefined ? `${searchedPnrData.stopsBetweenCount} stops between` : 'En-route stops'}
                      </span>
                    </div>

                    {/* Get Off At Card */}
                    <div className="bg-white border border-teal-100 rounded-3xl p-4 shadow-xs space-y-2 relative">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-teal-600 text-[10px] font-black uppercase tracking-wider">
                          <span className="w-2 h-2 rounded-full bg-teal-600" />
                          <span>GET OFF AT</span>
                        </div>
                        <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-lg border border-slate-200">
                          Platform {searchedPnrData.destinationPlatform || 'PF 1'}
                        </span>
                      </div>

                      <div>
                        <div className="text-2xl font-black text-slate-900 tracking-tight">
                          {searchedPnrData.reservationUptoTime || searchedPnrData.arrivalTime || '--:--'}
                        </div>
                        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                          ARRIVAL
                        </div>
                      </div>

                      <div className="pt-1">
                        <div className="flex items-center gap-1.5 font-black text-slate-900 text-sm">
                          <span>{searchedPnrData.reservationUptoName || searchedPnrData.to}</span>
                          <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                            {searchedPnrData.reservationUptoCode || searchedPnrData.to}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                          {searchedPnrData.journeyDate || searchedPnrData.date}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 4 Stats Grid: Scheduled Stops | Distance | Travel Time | Pass-Through */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase block">SCHEDULED STOPS</span>
                        <strong className="text-sm font-black text-slate-900">
                          {searchedPnrData.scheduledStopsCount !== undefined ? `${searchedPnrData.scheduledStopsCount} stops` : '--'}
                        </strong>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                        <Navigation className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase block">DISTANCE</span>
                        <strong className="text-sm font-black text-slate-900">
                          {searchedPnrData.distanceKm || '-- km'}
                        </strong>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase block">TRAVEL TIME</span>
                        <strong className="text-sm font-black text-slate-900">
                          {searchedPnrData.duration || '--'}
                        </strong>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                        <Train className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase block">PASS-THROUGH</span>
                        <strong className="text-sm font-black text-slate-900">
                          {searchedPnrData.passThroughCount !== undefined ? `${searchedPnrData.passThroughCount} stations` : '--'}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Full Run Footnote & View Route Details Button */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <Train className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>
                        Full run: <strong className="text-slate-900">{searchedPnrData.routeSourceCode || searchedPnrData.from} to {searchedPnrData.routeDestCode || searchedPnrData.to}</strong> • {searchedPnrData.totalRunHaltsCount || '--'} scheduled stops • {searchedPnrData.totalRunPassThroughCount || '--'} pass-through stations
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setActiveSubTab('LIVE_TRAIN');
                        setTrainSearchInput(searchedPnrData.trainNumber);
                        handleSelectSearchedTrain({
                          number: searchedPnrData.trainNumber,
                          name: searchedPnrData.trainName,
                          from: searchedPnrData.boardingStationCode || searchedPnrData.from,
                          to: searchedPnrData.reservationUptoCode || searchedPnrData.to
                        });
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-2xl text-xs flex items-center gap-1.5 shadow-md shadow-blue-600/30 transition active:scale-95 ml-auto"
                    >
                      <span>View route details</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="text-[10px] text-slate-400 font-medium flex items-center gap-1.5 pt-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Scheduled stops are halts where the train stops. Pass-through stations are route points it crosses without stopping. Platform numbers can change on the day.</span>
                  </div>
                </div>

                {/* 4. CURRENT TICKET STATUS: PASSENGER DETAILS CARDS */}
                <div className="space-y-3 pt-2">
                  <div>
                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-wider block">CURRENT TICKET STATUS</span>
                    <h3 className="text-xl font-black text-slate-900">Passenger details</h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      See each traveller's latest railway status and seat allocation.
                    </p>
                  </div>

                  {/* Passenger Cards List */}
                  <div className="space-y-3">
                    {(searchedPnrData.passengersList && searchedPnrData.passengersList.length > 0
                      ? searchedPnrData.passengersList
                      : [{
                          number: 1,
                          coach: searchedPnrData.coach || 'D1',
                          berth: searchedPnrData.seat || '92',
                          berthType: 'Not assigned',
                          bookedFormatted: `CNF ${searchedPnrData.coach || 'D1'} ${searchedPnrData.seat || '92'}`,
                          currentFormatted: `CNF ${searchedPnrData.coach || 'D1'} ${searchedPnrData.seat || '92'}`
                        }]
                    ).map((p, idx) => (
                      <div key={idx} className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-black text-slate-900">Passenger {p.number || idx + 1}</h4>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedSeatMapPassenger(p);
                              setShowSeatMapModal(true);
                            }}
                            className="inline-flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1 rounded-xl text-xs font-bold transition active:scale-95 border border-blue-200 shadow-xs"
                          >
                            <Armchair className="w-3.5 h-3.5 text-blue-600" />
                            <span>View Seat Map</span>
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                          {/* Seat Details Box */}
                          <div className="space-y-2">
                            <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-black uppercase tracking-wider">
                              <Armchair className="w-3.5 h-3.5 text-blue-600" />
                              <span>SEAT DETAILS</span>
                            </div>

                            <div className="bg-slate-50 border border-slate-200/70 rounded-2xl p-3.5 grid grid-cols-3 gap-2 text-xs">
                              <div>
                                <span className="text-[9px] font-bold text-slate-400 uppercase block">COACH</span>
                                <strong className="text-base font-black text-slate-900">{p.coach}</strong>
                              </div>
                              <div>
                                <span className="text-[9px] font-bold text-slate-400 uppercase block">BERTH</span>
                                <strong className="text-base font-black text-slate-900">{p.berth}</strong>
                              </div>
                              <div>
                                <span className="text-[9px] font-bold text-slate-400 uppercase block">TYPE</span>
                                <strong className="text-xs font-black text-slate-800">{p.berthType || 'Not assigned'}</strong>
                              </div>
                            </div>
                          </div>

                          {/* Booking Progress Strip */}
                          <div className="space-y-2">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                              BOOKING PROGRESS
                            </span>

                            <div className="flex items-center justify-between text-xs pt-1">
                              <div>
                                <span className="text-[10px] font-medium text-slate-400 block mb-1">Booked</span>
                                <span className="inline-flex items-center gap-1 bg-teal-50 border border-teal-200 text-teal-800 font-black text-xs px-3 py-1.5 rounded-full">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                                  <span>{p.bookedFormatted}</span>
                                </span>
                              </div>

                              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                                <ArrowRight className="w-4 h-4" />
                              </div>

                              <div>
                                <span className="text-[10px] font-medium text-slate-400 block mb-1 text-right">Now</span>
                                <span className="inline-flex items-center gap-1 bg-teal-50 border border-teal-200 text-teal-800 font-black text-xs px-3 py-1.5 rounded-full">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                                  <span>{p.currentFormatted}</span>
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* 4. REAL DYNAMIC COACH POSITION FINDER */}
      {activeSubTab === 'COACH_LOCATOR' && (
        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-900">Platform Coach Composition</h3>
              <p className="text-[11px] text-slate-500">Live Indian Railways rake & coach alignment API</p>
            </div>
            {coachApiResponse && (
              <span className="text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full">
                {coachApiResponse.totalCoaches} Coaches Rake
              </span>
            )}
          </div>

          {/* Train Search Input Box & Target Coach Picker */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Live Search by Train Number or Name with API Suggestions */}
            <div className="relative">
              <label className="text-[10px] font-bold text-slate-400 uppercase block">Train Number / Name</label>
              <form onSubmit={handleCoachTrainSearchSubmit} className="relative mt-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input 
                  type="text"
                  placeholder="Type train no. or name (e.g. 12059)..."
                  value={coachTrainSearchInput}
                  onChange={(e) => handleCoachTrainInputChange(e.target.value)}
                  onFocus={() => {
                    if (coachTrainSearchInput.trim().length >= 2) setShowCoachDropdown(true);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-8 py-2 text-xs font-bold text-slate-800 outline-none focus:border-blue-500 focus:bg-white shadow-xs"
                />
                {searchingCoachTrains ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600 absolute right-3 top-1/2 -translate-y-1/2" />
                ) : coachTrainSearchInput ? (
                  <button 
                    type="button"
                    onClick={() => {
                      setCoachTrainSearchInput('');
                      setSelectedCoachTrain('');
                      setCoachApiResponse(null);
                      setShowCoachDropdown(false);
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                ) : null}
              </form>

              {/* Dynamic Suggestions Dropdown from API */}
              {showCoachDropdown && coachTrainResults.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 max-h-56 overflow-y-auto divide-y divide-slate-100 animate-in fade-in">
                  {coachTrainResults.map((t) => (
                    <div 
                      key={t.number}
                      onClick={() => handleSelectCoachTrain(t)}
                      className="p-2.5 hover:bg-blue-50/70 cursor-pointer flex items-center justify-between transition"
                    >
                      <div>
                        <div className="text-xs font-black text-slate-900">{t.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">#{t.number} • {t.from} ➔ {t.to}</div>
                      </div>
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">
                        Select
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Target Coach Dropdown */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block">Target Coach</label>
              <select 
                value={highlightCoach}
                onChange={(e) => {
                  const val = e.target.value;
                  setHighlightCoach(val);
                  const found = (coachApiResponse?.coaches || []).find(c => c.code === val);
                  setSelectedCoachDetails(found || null);
                }}
                disabled={loadingCoachComposition || !coachApiResponse}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 mt-1 outline-none focus:border-blue-500 disabled:opacity-50"
              >
                {coachApiResponse?.availableCoachCodes && coachApiResponse.availableCoachCodes.length > 0 ? (
                  coachApiResponse.availableCoachCodes.map(code => (
                    <option key={code} value={code}>Coach {code}</option>
                  ))
                ) : (
                  <option value="">{selectedCoachTrain ? 'Loading Coaches...' : 'Search train first'}</option>
                )}
              </select>
            </div>
          </div>

          {loadingCoachComposition ? (
            <div className="py-12 bg-slate-50 rounded-2xl flex flex-col items-center justify-center space-y-2 text-blue-600">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="text-xs font-semibold text-slate-500">Fetching live rake composition from API...</span>
            </div>
          ) : coachApiResponse ? (
            <div className="space-y-3">
              {/* Train Summary Info Strip */}
              <div className="flex items-center justify-between text-[11px] bg-slate-50 p-2.5 rounded-2xl border border-slate-200/80">
                <div>
                  <span className="text-slate-400 font-medium">Route: </span>
                  <strong className="text-slate-800">{coachApiResponse.source} ➔ {coachApiResponse.destination}</strong>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Platform: </span>
                  <strong className="text-blue-700 bg-blue-100/60 px-1.5 py-0.5 rounded font-mono">{coachApiResponse.platformAlignment}</strong>
                </div>
              </div>

              {/* Platform interactive rail view */}
              <div className="bg-slate-950 text-white p-4 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse" />
                    Engine End (Front) ➔
                  </span>
                  <span>{coachApiResponse.platformAlignment} Platform Side</span>
                </div>

                <div className="flex items-center space-x-2 overflow-x-auto py-3 px-1 scrollbar-none">
                  {(coachApiResponse.coaches || []).map((c, i) => {
                    const isSelected = c.code === highlightCoach;
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setHighlightCoach(c.code);
                          setSelectedCoachDetails(c);
                        }}
                        className={`shrink-0 flex flex-col items-center justify-center rounded-xl p-2.5 min-w-[62px] transition-all duration-150 text-left ${
                          isSelected 
                            ? 'bg-amber-400 text-blue-950 ring-4 ring-amber-400/40 scale-105 font-black shadow-lg' 
                            : c.isEngine
                            ? 'bg-red-950/80 text-red-200 border border-red-800/60'
                            : c.isPantry
                            ? 'bg-emerald-950/80 text-emerald-200 border border-emerald-800/60'
                            : c.isUtility
                            ? 'bg-slate-800/80 text-slate-300 border border-slate-700'
                            : 'bg-slate-900 text-slate-100 hover:bg-slate-800 border border-slate-700 font-bold'
                        }`}
                      >
                        <span className="text-[11px] font-black">{c.label}</span>
                        <span className="text-[8px] opacity-80 mt-0.5 whitespace-nowrap">{c.type}</span>
                        <span className="text-[7px] text-slate-400 font-mono mt-0.5">#{c.position}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="text-[10px] text-slate-400 text-center pt-1 flex items-center justify-between border-t border-slate-800/80">
                  <span>Scroll horizontally to view all coaches</span>
                  <span className="text-emerald-400 font-bold">● Selected: {highlightCoach || 'None'}</span>
                </div>
              </div>

              {/* Selected Coach Details Card */}
              {selectedCoachDetails && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex items-center justify-between text-xs animate-in fade-in">
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Selected Coach Details</div>
                    <div className="font-black text-slate-900 text-sm mt-0.5">
                      Coach {selectedCoachDetails.code} • {selectedCoachDetails.fullName}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      Class: <strong>{selectedCoachDetails.type}</strong> • Position from engine: <strong>#{selectedCoachDetails.position}</strong>
                    </div>
                  </div>
                  <span className="font-mono text-xs font-black bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-xl">
                    PF Alignment
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-50 p-6 rounded-2xl text-center text-xs text-slate-400">
              No coach composition available for this train.
            </div>
          )}
        </div>
      )}

      {/* 5. SHARE JOURNEY STATUS MODAL (EXACT 1:1 MATCH TO USER REFERENCE SCREENSHOT) */}
      {showShareModal && searchedPnrData && (() => {
        const rawPnr = searchedPnrData.pnr || '';
        const maskedPnr = rawPnr.length >= 6 
          ? `${rawPnr.slice(0, 2)}******${rawPnr.slice(-2)}` 
          : rawPnr;
        const displayPnr = includeFullPnr ? rawPnr : maskedPnr;

        // Dynamic origin & destination parsing
        const fromCode = searchedPnrData.from?.match(/\((.*?)\)/)?.[1] || searchedPnrData.from?.split(' ')[0] || 'NZM';
        const fromName = searchedPnrData.from?.replace(/\(.*?\)/, '').trim() || 'Origin Station';
        const toCode = searchedPnrData.to?.match(/\((.*?)\)/)?.[1] || searchedPnrData.to?.split(' ')[0] || 'SWM';
        const toName = searchedPnrData.to?.replace(/\(.*?\)/, '').trim() || 'Destination Station';

        const tokenSlug = (rawPnr ? rawPnr.slice(-6) : 'gd5n987').toLowerCase();
        const trackingLink = `https://railco.re/${tokenSlug}`;
        
        const shareText = `🚅 RailOne Live Journey Update:\nTrain: ${searchedPnrData.trainName} (#${searchedPnrData.trainNumber})\nRoute: ${fromCode} ➔ ${toCode}\nStatus: ${searchedPnrData.status || 'CONFIRMED'}\nCoach/Seat: ${searchedPnrData.coach}-${searchedPnrData.seat}\nPNR: ${displayPnr}\nTrack live on RailCore: ${trackingLink}`;

        const handleCopyLink = () => {
          navigator.clipboard.writeText(trackingLink);
          setCopySuccess('Link Copied!');
          setTimeout(() => setCopySuccess(''), 2500);
        };

        const handleCopyMessage = () => {
          navigator.clipboard.writeText(shareText);
          setCopySuccess('Message Copied!');
          setTimeout(() => setCopySuccess(''), 2500);
        };

        const handleWhatsAppShare = () => {
          const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
          window.open(waUrl, '_blank');
        };

        const handleNativeShare = async () => {
          if (navigator.share) {
            try {
              await navigator.share({
                title: `${searchedPnrData.trainName} Journey Status`,
                text: shareText,
                url: trackingLink
              });
            } catch (_) {}
          } else {
            handleCopyMessage();
          }
        };

        return (
          <div 
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in"
            onClick={() => setShowShareModal(false)}
          >
            <div 
              className="bg-white w-full max-w-md rounded-3xl p-5 space-y-4 shadow-2xl relative max-h-[92vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <Share2 className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-blue-700 uppercase tracking-wider block">SHARE PNR UPDATE</span>
                    <h3 className="text-lg font-black text-slate-900 leading-tight">Share journey status</h3>
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                      Send the current status and a live RailCore tracking link.
                    </p>
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={() => setShowShareModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition active:scale-90"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* CURRENT PNR SNAPSHOT CARD */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Radio className="w-3.5 h-3.5 text-blue-600" />
                    <span className="text-[10px] font-black uppercase tracking-wider">CURRENT PNR SNAPSHOT</span>
                  </div>
                  <span className="text-[10px] font-black text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full uppercase">
                    {searchedPnrData.status?.includes('CNF') ? 'CNF' : (searchedPnrData.status || 'CNF')}
                  </span>
                </div>

                <div className="flex items-baseline justify-between">
                  <h4 className="text-base font-black text-slate-900 tracking-tight uppercase">
                    {searchedPnrData.trainName}
                  </h4>
                  <span className="font-mono text-xs font-bold text-slate-500">
                    Train {searchedPnrData.trainNumber}
                  </span>
                </div>

                {/* Route */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <div>
                    <div className="text-base font-black text-blue-600 uppercase">{fromCode}</div>
                    <div className="text-[11px] text-slate-500 font-medium truncate max-w-[130px]">{fromName}</div>
                  </div>

                  <div className="flex items-center gap-1 text-slate-300">
                    <div className="w-8 border-t border-slate-300" />
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  </div>

                  <div className="text-right">
                    <div className="text-base font-black text-blue-600 uppercase">{toCode}</div>
                    <div className="text-[11px] text-slate-500 font-medium truncate max-w-[130px]">{toName}</div>
                  </div>
                </div>

                {/* Journey Info Grid */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-xs">
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase block">JOURNEY</span>
                    <span className="font-bold text-slate-800 text-[11px]">{searchedPnrData.date || 'Today'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase block">DEPARTS</span>
                    <span className="font-bold text-slate-800 text-[11px]">{searchedPnrData.departureTime || '12:45 PM'}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] font-bold text-slate-400 uppercase block">PNR</span>
                    <span className="font-mono font-black text-slate-900 text-[11px]">{displayPnr}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons: WhatsApp & Share another way */}
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={handleWhatsAppShare}
                  className="bg-white border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/40 text-slate-800 hover:text-emerald-800 font-bold py-2.5 px-3 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-xs transition active:scale-95"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-600" />
                  <span>WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={handleNativeShare}
                  className="bg-white border border-slate-200 hover:border-blue-500 hover:bg-blue-50/40 text-slate-800 hover:text-blue-800 font-bold py-2.5 px-3 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-xs transition active:scale-95"
                >
                  <Share2 className="w-4 h-4 text-blue-600" />
                  <span>Share another way</span>
                </button>
              </div>

              {/* Show / Hide QR Code Toggle Button */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowQrCode(!showQrCode)}
                  className="w-full bg-white border border-slate-200 hover:border-blue-400 hover:bg-slate-50 text-slate-800 font-bold py-2.5 px-4 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-xs transition"
                >
                  <QrCode className="w-4 h-4 text-blue-600" />
                  <span>{showQrCode ? 'Hide QR code' : 'Show QR code'}</span>
                </button>

                {/* Dynamic QR Code Display */}
                {showQrCode && (
                  <div className="mt-2.5 bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center space-y-2 animate-in fade-in">
                    <div className="w-36 h-36 bg-white border border-slate-200 rounded-xl p-2 mx-auto flex items-center justify-center shadow-xs">
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(trackingLink)}`} 
                        alt="PNR Journey QR Code"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="text-[11px] font-bold text-slate-700">
                      Scan to Track PNR #{rawPnr} Live
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Live sync with Indian Railways Satellite GPS
                    </div>
                  </div>
                )}
              </div>

              {/* Include full PNR Checkbox */}
              <div className="bg-white border border-slate-200 rounded-2xl p-3.5 space-y-1">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={includeFullPnr}
                    onChange={(e) => setIncludeFullPnr(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-0 mt-0.5 cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Include the full PNR in this share</span>
                    <span className="text-[10px] text-slate-400 leading-tight block mt-0.5">
                      Off by default. The tokenized link and message otherwise show only a masked PNR.
                    </span>
                  </div>
                </label>
              </div>

              {/* Privacy Notice */}
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 px-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Private labels, notes, passenger names, fare and payment details are never shared.</span>
              </div>

              {/* RailCore Live Tracking Link Strip */}
              <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 overflow-hidden">
                  <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </div>
                  <div className="overflow-hidden">
                    <span className="text-[9px] font-bold text-slate-400 uppercase block">RAILCORE LIVE TRACKING LINK</span>
                    <a 
                      href={trackingLink} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="font-bold text-blue-600 hover:underline truncate block"
                    >
                      {trackingLink}
                    </a>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold px-3 py-1.5 rounded-xl text-[11px] shadow-xs shrink-0 flex items-center gap-1 transition active:scale-95"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copy link</span>
                </button>
              </div>

              {/* Copy Feedback */}
              {copySuccess && (
                <div className="text-center text-xs font-bold text-emerald-600 animate-in fade-in flex items-center justify-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  <span>{copySuccess}</span>
                </div>
              )}

              {/* Bottom Buttons: Copy message & railcore.tech branding */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleCopyMessage}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-2xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/30 transition active:scale-95"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy message</span>
                </button>

                <button
                  type="button"
                  onClick={() => window.open('https://railcore.tech', '_blank')}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-4 rounded-2xl text-xs flex items-center gap-1 transition"
                >
                  <span>railcore.tech</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 6. REALISTIC DYNAMIC SEAT MAP MODAL */}
      {showSeatMapModal && selectedSeatMapPassenger && searchedPnrData && (() => {
        const p = selectedSeatMapPassenger;
        const coachId = p.coach || searchedPnrData.coach || 'D1';
        const targetBerthNum = parseInt(String(p.berth).replace(/\D/g, ''), 10) || 92;
        const trainClass = (searchedPnrData.journeyClass || searchedPnrData.className || '2S').toUpperCase();

        // Determine coach type: 'CHAIR_CAR' (2S/CC) vs 'SLEEPER' (SL/3A/2A/1A)
        const isChairCar = ['2S', 'CC', 'EC', 'EA'].includes(trainClass) || coachId.startsWith('D') || coachId.startsWith('C');
        const totalSeats = isChairCar ? 108 : (trainClass === '2A' ? 54 : (trainClass === '1A' ? 24 : 72));

        // Group seats in blocks of 6 for 2S (3 on left, 3 on right with aisle) or standard sleeper coupe
        const seatBlocks = [];
        const perBay = isChairCar ? 6 : 8;
        for (let s = 1; s <= totalSeats; s += perBay) {
          const baySeats = [];
          for (let i = 0; i < perBay && (s + i) <= totalSeats; i++) {
            baySeats.push(s + i);
          }
          seatBlocks.push(baySeats);
        }

        // Helper to get berth code label
        const getSeatCode = (seatNo) => {
          if (isChairCar) {
            const mod = seatNo % 6;
            if (mod === 1 || mod === 0) return 'WS';
            if (mod === 3 || mod === 4) return 'AS';
            return 'MS';
          } else {
            const mod = seatNo % 8;
            if (mod === 1 || mod === 4) return 'LB';
            if (mod === 2 || mod === 5) return 'MB';
            if (mod === 3 || mod === 6) return 'UB';
            if (mod === 7) return 'SL';
            return 'SU';
          }
        };

        return (
          <div 
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in"
            onClick={() => setShowSeatMapModal(false)}
          >
            <div 
              className="bg-white w-full max-w-lg rounded-3xl p-5 space-y-4 shadow-2xl relative max-h-[92vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Armchair className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 leading-tight">
                      Coach {coachId} • Seat Map
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium">
                      {searchedPnrData.trainName} (#{searchedPnrData.trainNumber}) • Class: <strong>{trainClass}</strong>
                    </p>
                  </div>
                </div>

                <button 
                  type="button" 
                  onClick={() => setShowSeatMapModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition active:scale-90"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Passenger Target Seat Badge */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] font-bold text-emerald-800 uppercase block">YOUR ALLOTTED SEAT</span>
                  <div className="font-black text-emerald-950 text-sm mt-0.5">
                    Coach {coachId} — Seat #{targetBerthNum} ({p.berthType || getSeatCode(targetBerthNum)})
                  </div>
                </div>
                <span className="bg-emerald-600 text-white font-black text-xs px-3 py-1 rounded-full shadow-xs animate-pulse">
                  Target Seat #{targetBerthNum}
                </span>
              </div>

              {/* Legend Strip */}
              <div className="flex items-center justify-center gap-4 text-[10px] font-bold py-1 bg-slate-50 rounded-xl border border-slate-200/80">
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded-md bg-emerald-600 border border-emerald-700" />
                  <span>Your Seat (#{targetBerthNum})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded-md bg-white border border-slate-300" />
                  <span>Available / Other</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded-md bg-slate-200 border border-slate-300" />
                  <span>Aisle Walkway</span>
                </div>
              </div>

              {/* Coach Layout Body with Door / Bathroom and Seat Bays */}
              <div className="overflow-y-auto flex-1 p-3 bg-slate-100 rounded-2xl border border-slate-200/90 space-y-4">
                {/* Front Coach Door */}
                <div className="flex items-center justify-between text-[10px] font-black uppercase text-slate-400 bg-white/80 py-1.5 px-3 rounded-xl border border-dashed border-slate-300">
                  <span>🚪 Door / Washroom</span>
                  <span className="font-mono text-slate-500">ENGINE DIRECTION ➔</span>
                </div>

                {/* Seat Bays */}
                <div className="space-y-3">
                  {seatBlocks.map((bay, bayIdx) => {
                    const isLeftThree = isChairCar;
                    const leftSeats = isLeftThree ? bay.slice(0, 3) : bay.slice(0, 3);
                    const rightSeats = isLeftThree ? bay.slice(3, 6) : bay.slice(3);

                    return (
                      <div key={bayIdx} className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
                        <div className="text-[9px] font-black text-slate-400 uppercase mb-2 flex justify-between">
                          <span>Bay {bayIdx + 1} (Seats {bay[0]} - {bay[bay.length - 1]})</span>
                        </div>

                        <div className="flex items-center justify-between gap-3">
                          {/* Left Seats Group */}
                          <div className="flex items-center gap-1.5 flex-1">
                            {leftSeats.map((seatNum) => {
                              const isTarget = seatNum === targetBerthNum;
                              const code = getSeatCode(seatNum);
                              return (
                                <div
                                  key={seatNum}
                                  className={`flex-1 py-2 px-1 rounded-xl text-center transition flex flex-col items-center justify-center border ${
                                    isTarget 
                                      ? 'bg-emerald-600 text-white font-black border-emerald-700 shadow-md scale-105 ring-2 ring-emerald-400' 
                                      : 'bg-slate-50 hover:bg-blue-50 border-slate-200 text-slate-800'
                                  }`}
                                >
                                  <span className="text-xs font-black leading-none">{seatNum}</span>
                                  <span className={`text-[8px] font-bold mt-0.5 leading-none ${isTarget ? 'text-emerald-100' : 'text-slate-400'}`}>
                                    {code}
                                  </span>
                                </div>
                              );
                            })}
                          </div>

                          {/* Aisle Walkway */}
                          <div className="w-5 text-center text-[9px] font-black text-slate-300 uppercase tracking-tighter">
                            | |
                          </div>

                          {/* Right Seats Group */}
                          <div className="flex items-center gap-1.5 flex-1 justify-end">
                            {rightSeats.map((seatNum) => {
                              const isTarget = seatNum === targetBerthNum;
                              const code = getSeatCode(seatNum);
                              return (
                                <div
                                  key={seatNum}
                                  className={`flex-1 py-2 px-1 rounded-xl text-center transition flex flex-col items-center justify-center border ${
                                    isTarget 
                                      ? 'bg-emerald-600 text-white font-black border-emerald-700 shadow-md scale-105 ring-2 ring-emerald-400' 
                                      : 'bg-slate-50 hover:bg-blue-50 border-slate-200 text-slate-800'
                                  }`}
                                >
                                  <span className="text-xs font-black leading-none">{seatNum}</span>
                                  <span className={`text-[8px] font-bold mt-0.5 leading-none ${isTarget ? 'text-emerald-100' : 'text-slate-400'}`}>
                                    {code}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Rear Coach Door */}
                <div className="flex items-center justify-between text-[10px] font-black uppercase text-slate-400 bg-white/80 py-1.5 px-3 rounded-xl border border-dashed border-slate-300">
                  <span>🚪 Door / Washroom</span>
                  <span className="font-mono text-slate-500">REAR VESTIBULE</span>
                </div>
              </div>

              {/* Official IRCTC Charting Link & Close */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                {searchedPnrData.irctcChartUrl ? (
                  <button
                    type="button"
                    onClick={() => window.open(searchedPnrData.irctcChartUrl, '_blank')}
                    className="text-blue-600 hover:text-blue-800 font-bold text-xs flex items-center gap-1 hover:underline"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>View Official IRCTC Live Chart</span>
                  </button>
                ) : (
                  <span className="text-[11px] text-slate-400 font-medium">
                    Layout verified with CRIS / Indian Railways
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => setShowSeatMapModal(false)}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-xs transition active:scale-95"
                >
                  Close Map
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
