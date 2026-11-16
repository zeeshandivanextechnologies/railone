import dotenv from 'dotenv';
dotenv.config();

const RAILCORE_API_KEY = process.env.RAILCORE_API_KEY || 'rk_live_JYx_dkyxxTHTBgS9tA5jUXJiZRjhBEKg';
const BASE_URL = process.env.RAILCORE_BASE_URL || 'https://ir.railcore.tech/v1';

// In-Memory Intelligent Cache
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 mins for live
const SEARCH_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour for trains/stations
const memoryCache = new Map();

export const railRadarService = {
  // 1. LIVE TRAIN STATUS (RailCore /trains/{trainNumber}/live)
  getLiveTrainStatus: async (trainNumber) => {
    if (!trainNumber) return null;
    const cleanNum = trainNumber.toString().trim();

    const cacheKey = `LIVE_${cleanNum}`;
    const cached = memoryCache.get(cacheKey);
    const now = Date.now();
    if (cached && (now - cached.timestamp < CACHE_TTL_MS)) {
      return { ...cached.data, _fromCache: true };
    }

    try {
      const response = await fetch(`${BASE_URL}/trains/${cleanNum}/live`, {
        headers: {
          'Authorization': `Bearer ${RAILCORE_API_KEY}`,
          'Accept': 'application/json'
        }
      });

      const resJson = await response.json();
      if (!response.ok || !resJson.success || !resJson.data) {
        return cached ? cached.data : null;
      }

      const d = resJson.data;
      
      // Process full stations list to show exact timeline with status
      const stationsList = (d.stations || []).map(s => {
        let haltTime = '--';
        if (s.scheduled_arrival && s.scheduled_departure) {
          try {
            const arr = new Date(s.scheduled_arrival);
            const dep = new Date(s.scheduled_departure);
            const diffMin = Math.round((dep - arr) / 60000);
            haltTime = diffMin > 0 ? `${diffMin}m` : '1m';
          } catch (_) {}
        }
        
        return {
          stationCode: s.station_code,
          stationName: s.station_name,
          platform: s.platform_number || 'PF 1',
          scheduledArrival: s.scheduled_arrival ? s.scheduled_arrival.slice(11, 16) : '--:--',
          scheduledDeparture: s.scheduled_departure ? s.scheduled_departure.slice(11, 16) : '--:--',
          actualArrival: s.actual_arrival ? s.actual_arrival.slice(11, 16) : (s.eta ? s.eta.slice(11, 16) : null),
          actualDeparture: s.actual_departure ? s.actual_departure.slice(11, 16) : (s.etd ? s.etd.slice(11, 16) : null),
          delayArrival: s.delay_arrival_minutes || 0,
          delayDeparture: s.delay_departure_minutes || 0,
          haltMinutes: s.halt_minutes || haltTime,
          distanceKm: s.distance_km || 0,
          day: s.day || 1,
          hasArrived: !!s.has_arrived,
          hasDeparted: !!s.has_departed,
          isStopping: s.is_stopping !== false,
          isCurrent: s.station_code === (d.current_station_code || d.position_anchor_station_code),
          isApproaching: s.station_code === (d.approaching_station_code || d.next_station_code || d.next_stop?.station_code)
        };
      });

      // Filter to major/stopping halts for clean view, or keep all stopping halts
      const stoppingStations = stationsList.filter(s => s.isStopping);

      const formatted = {
        trainNumber: d.train_number || cleanNum,
        trainName: d.train_name,
        startDate: d.start_date || d.journey_date,
        lastUpdatedAt: d.last_reported_at || new Date().toISOString(),
        status: d.status,
        statusText: d.status_text || 'Running on time',
        isLive: d.status === 'RUNNING',
        delayMinutes: d.delay_minutes || 0,
        speedKmph: d.speed_kmph || 0,
        progressPercent: d.progress_percent || 0,
        totalDistanceKm: d.total_distance_km || 0,
        distanceCoveredKm: d.distance_covered_km || 0,
        distanceToApproachingKm: d.distance_to_approaching_station_km || 0,
        currentLocation: {
          stationCode: d.current_station_code || '',
          stationName: d.current_station_name || '',
          status: (d.delay_minutes > 5) ? 'delayed' : 'on-time',
          speedKmh: d.speed_kmph || 0,
          delayMinutes: d.delay_minutes || 0
        },
        previousHalt: d.previous_station_code ? { stationCode: d.previous_station_code } : null,
        nextHalt: d.next_stop ? {
          stationCode: d.next_stop.station_code,
          stationName: d.next_stop.station_name,
          eta: d.next_stop.eta ? d.next_stop.eta.slice(11, 16) : null,
          platform: d.next_stop.platform_number || '1'
        } : (d.next_station_code ? { stationCode: d.next_station_code } : null),
        approachingStation: {
          stationCode: d.approaching_station_code || '',
          stationName: d.approaching_station_name || ''
        },
        source: {
          stationCode: d.source_station_code || '',
          name: d.source_station_name || d.source_station_code || ''
        },
        destination: {
          stationCode: d.destination_station_code || '',
          name: d.destination_station_name || d.destination_station_code || ''
        },
        stations: stationsList, // Return full list with isStopping flag (stopping + non-stopping passing halts)
        stoppingStations: stoppingStations,
        routeSummary: (stoppingStations.length > 0 ? stoppingStations : stationsList).slice(-10)
      };

      memoryCache.set(cacheKey, { timestamp: now, data: formatted });
      return { ...formatted, _fromCache: false };
    } catch (err) {
      console.error(`[RailCore] Live tracking error for ${cleanNum}:`, err.message);
      return cached ? cached.data : null;
    }
  },

  // 2. SEARCH STATIONS (RailCore /stations/search?q=...)
  searchStations: async (query) => {
    if (!query || query.trim().length < 2) return [];
    const cleanQ = query.trim().toUpperCase();

    const cacheKey = `STN_${cleanQ}`;
    const cached = memoryCache.get(cacheKey);
    const now = Date.now();
    if (cached && (now - cached.timestamp < SEARCH_CACHE_TTL_MS)) {
      return cached.data;
    }

    try {
      const response = await fetch(`${BASE_URL}/stations/search?q=${encodeURIComponent(cleanQ)}&limit=50`, {
        headers: {
          'Authorization': `Bearer ${RAILCORE_API_KEY}`,
          'Accept': 'application/json'
        }
      });
      const resJson = await response.json();
      if (!response.ok || !resJson.success) {
        return cached ? cached.data : [];
      }

      const results = (resJson.data?.results || resJson.data || []).map(s => ({
        code: s.station_code || s.code,
        name: s.station_name || s.display_name || s.name,
        city: s.city || null,
        state: s.state || null,
        popularity: s.is_major ? 10000 : 5000,
        lat: s.latitude,
        lng: s.longitude
      }));

      memoryCache.set(cacheKey, { timestamp: now, data: results });
      return results;
    } catch (err) {
      console.error('[RailCore] Search stations error:', err.message);
      return cached ? cached.data : [];
    }
  },

  // 3. SEARCH TRAINS (RailCore /trains/search?q=...)
  searchTrains: async (query) => {
    if (!query || query.trim().length < 2) return [];
    const cleanQ = query.trim();

    const cacheKey = `TRN_${cleanQ.toUpperCase()}`;
    const cached = memoryCache.get(cacheKey);
    const now = Date.now();
    if (cached && (now - cached.timestamp < SEARCH_CACHE_TTL_MS)) {
      return cached.data;
    }

    try {
      const response = await fetch(`${BASE_URL}/trains/search?q=${encodeURIComponent(cleanQ)}&limit=50`, {
        headers: {
          'Authorization': `Bearer ${RAILCORE_API_KEY}`,
          'Accept': 'application/json'
        }
      });
      const resJson = await response.json();
      if (!response.ok || !resJson.success) {
        return cached ? cached.data : [];
      }

      const results = (resJson.data?.results || resJson.data || []).map(t => ({
        number: t.train_number || t.number,
        name: t.train_name || t.name,
        from: t.source_station_code || t.source || 'NDLS',
        fromName: t.source_station_name || t.source_station_code || t.source || 'Origin',
        to: t.destination_station_code || t.dest || 'MMCT',
        toName: t.destination_station_name || t.destination_station_code || t.dest || 'Destination',
        runDays: t.running_days || t.runDays || ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
        type: t.train_type || 'EXPRESS',
        popularity: 5000
      }));

      memoryCache.set(cacheKey, { timestamp: now, data: results });
      return results;
    } catch (err) {
      console.error('[RailCore] Search trains error:', err.message);
      return cached ? cached.data : [];
    }
  },

  // 4. REAL-TIME TRAINS BETWEEN STATIONS (RailCore /routes/trains?from=...&to=...&date=...)
  getTrainsBetweenStations: async (fromCode, toCode, journeyDate = '') => {
    if (!fromCode || !toCode) return [];
    const cleanFrom = fromCode.trim().toUpperCase();
    const cleanTo = toCode.trim().toUpperCase();

    // Default to today/tomorrow in YYYY-MM-DD if date not passed
    let dateStr = journeyDate;
    if (!dateStr || !dateStr.includes('-')) {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      dateStr = d.toISOString().split('T')[0];
    }

    const cacheKey = `ROUTE_${cleanFrom}_${cleanTo}_${dateStr}`;
    const cached = memoryCache.get(cacheKey);
    const now = Date.now();
    if (cached && (now - cached.timestamp < SEARCH_CACHE_TTL_MS)) {
      return cached.data;
    }

    try {
      const url = `${BASE_URL}/routes/trains?from=${cleanFrom}&to=${cleanTo}&date=${dateStr}`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${RAILCORE_API_KEY}`,
          'Accept': 'application/json'
        }
      });
      const resJson = await response.json();
      if (!response.ok || !resJson.success || !resJson.data?.trains) {
        return cached ? cached.data : [];
      }

      const realTrains = resJson.data.trains.map(t => {
        const durationHours = Math.floor((t.duration_minutes || 480) / 60);
        const durationMins = (t.duration_minutes || 480) % 60;
        const formattedDuration = `${durationHours}h ${durationMins}m`;

        const formattedClasses = (t.availability_summary && t.availability_summary.length > 0)
          ? t.availability_summary.map(av => ({
              code: av.class_code,
              name: av.class_code === '1A' ? 'First AC' : (av.class_code === '2A' ? '2 Tier AC' : (av.class_code === '3A' ? '3 Tier AC' : (av.class_code === 'SL' ? 'Sleeper' : av.class_code))),
              fare: av.fare || (av.class_code === '1A' ? 3850 : (av.class_code === '2A' ? 2450 : (av.class_code === '3A' ? 1720 : 540))),
              available: av.text?.includes('WL') ? parseInt(av.text.match(/\d+$/)?.[0] || '12', 10) : 24,
              status: av.status || 'AVAILABLE',
              statusText: av.text || 'AVAILABLE'
            }))
          : (t.classes || ['3A', '2A', 'SL']).map(c => ({
              code: c,
              name: c === '1A' ? 'First AC' : (c === '2A' ? '2 Tier AC' : (c === '3A' ? '3 Tier AC' : 'Sleeper')),
              fare: c === '1A' ? 3850 : (c === '2A' ? 2450 : (c === '3A' ? 1720 : 540)),
              available: 18,
              status: 'AVAILABLE'
            }));

        return {
          id: t.train_number,
          number: t.train_number,
          name: t.extended_train_name || t.train_name,
          from: t.from_station_code || cleanFrom,
          fromName: t.from_station_name || cleanFrom,
          to: t.to_station_code || cleanTo,
          toName: t.to_station_name || cleanTo,
          departure: t.departure_time || '06:00',
          arrival: t.arrival_time || '18:30',
          duration: formattedDuration,
          distanceKm: t.distance_km || 0,
          type: t.train_type || 'EXPRESS',
          zone: 'IR',
          status: 'Active',
          currentLocation: `${t.from_station_name || t.from_station_code} Jn`,
          platform: 'PF 1',
          delayMinutes: 0,
          runningDays: t.running_days || ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
          runsDaily: !t.running_days || t.running_days.length === 7,
          liveStatus: {
            currentStation: t.from_station_name || t.from_station_code,
            delay: 'On Time',
            platform: 'PF 1',
            updatedAt: 'RailCore Live Routes API'
          },
          classes: formattedClasses
        };
      });

      memoryCache.set(cacheKey, { timestamp: now, data: realTrains });
      return realTrains;
    } catch (err) {
      console.error('[RailCore] Routes trains API error:', err.message);
      return cached ? cached.data : [];
    }
  },

  // 5. LIVE STATION DEPARTURE & ARRIVAL BOARD (RailCore /stations/{stationCode}/live)
  getStationLiveBoard: async (stationCode) => {
    if (!stationCode) return null;
    const cleanCode = stationCode.trim().toUpperCase();

    const cacheKey = `STATION_BOARD_${cleanCode}`;
    const cached = memoryCache.get(cacheKey);
    const now = Date.now();
    if (cached && (now - cached.timestamp < CACHE_TTL_MS)) {
      return cached.data;
    }

    try {
      const response = await fetch(`${BASE_URL}/stations/${cleanCode}/live`, {
        headers: {
          'Authorization': `Bearer ${RAILCORE_API_KEY}`,
          'Accept': 'application/json'
        }
      });
      const resJson = await response.json();
      if (!response.ok || !resJson.success || !resJson.data?.trains) {
        return cached ? cached.data : null;
      }

      const trains = resJson.data.trains.map(t => {
        const delay = t.departure_delay_minutes ?? t.arrival_delay_minutes ?? 0;
        let statusLabel = 'On Time';
        if (delay > 0) statusLabel = `Late by ${delay}m`;
        else if (delay < 0) statusLabel = `Early by ${Math.abs(delay)}m`;

        const schedDep = t.scheduled_departure ? t.scheduled_departure.slice(11, 16) : '--:--';
        const schedArr = t.scheduled_arrival ? t.scheduled_arrival.slice(11, 16) : '--:--';
        const actDep = t.estimated_departure ? t.estimated_departure.slice(11, 16) : schedDep;
        const pf = t.platform_number || t.platform || '1';

        return {
          trainNumber: t.train_number,
          trainName: t.extended_train_name || t.train_name,
          type: t.train_type || 'EXPRESS',
          platform: `PF ${pf}`,
          scheduledDeparture: schedDep,
          scheduledArrival: schedArr,
          actualDeparture: actDep,
          origin: t.source_station_code,
          originName: t.source_station_name,
          destination: t.destination_station_code,
          destinationName: t.destination_station_name,
          delayMinutes: delay,
          status: statusLabel,
          isTerminating: t.destination_station_code === cleanCode,
          isOriginating: t.source_station_code === cleanCode,
          currentLocation: t.current_station_code ? `${t.current_station_code}` : (t.status || 'En-Route')
        };
      });

      const result = {
        stationCode: cleanCode,
        stationName: resJson.data.station_name || cleanCode,
        trains
      };

      memoryCache.set(cacheKey, { timestamp: now, data: result });
      return result;
    } catch (err) {
      console.error('[RailCore] Station live board error:', err.message);
      return cached ? cached.data : null;
    }
  }
};
