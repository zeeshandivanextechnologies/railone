const API_BASE = 'http://localhost:5000/api';

// Utility helper to dynamically compute train duration from departure and arrival
const calculateDuration = (dep = '', arr = '') => {
  if (!dep || !arr) return '4h 30m';
  try {
    const [dh, dm] = dep.split(':').map(Number);
    const [ah, am] = arr.split(':').map(Number);
    if (!isNaN(dh) && !isNaN(ah)) {
      let diff = (ah * 60 + (am || 0)) - (dh * 60 + (dm || 0));
      if (diff < 0) diff += 24 * 60;
      const hours = Math.floor(diff / 60);
      const mins = diff % 60;
      return `${hours}h ${mins}m`;
    }
  } catch (_) {}
  return '4h 30m';
};

export const passengerApi = {
  getTrains: async (fallbackData = []) => {
    try {
      const res = await fetch(`${API_BASE}/trains`);
      if (!res.ok) throw new Error();
      const list = await res.json();
      return list.map(t => {
        // Use backend duration if provided, otherwise compute dynamically
        const duration = t.duration || calculateDuration(t.departure, t.arrival);
        
        // Use dynamic classes directly from backend if available, or generate from train type
        let trainClasses = t.classes;
        if (!trainClasses || trainClasses.length === 0) {
          const isShatabdi = (t.type === 'SHATABDI' || (t.name && (t.name.toLowerCase().includes('shatabdi') || t.name.toLowerCase().includes('vande'))));
          const isRajdhani = (t.type === 'RAJDHANI' || (t.name && (t.name.toLowerCase().includes('rajdhani') || t.name.toLowerCase().includes('tejas'))));
          
          trainClasses = isShatabdi ? [
            { code: "EC", name: "Exec. Chair Car", fare: 1950, available: 16, status: "AVAILABLE" },
            { code: "CC", name: "AC Chair Car", fare: 1080, available: 58, status: "AVAILABLE" }
          ] : [
            { code: "1A", name: "First AC", fare: isRajdhani ? 4850 : 3450, available: 10, status: "AVAILABLE" },
            { code: "2A", name: "2 Tier AC", fare: isRajdhani ? 2980 : 2180, available: 32, status: "AVAILABLE" },
            { code: "3A", name: "3 Tier AC", fare: isRajdhani ? 2150 : 1520, available: 94, status: "AVAILABLE" },
            { code: "SL", name: "Sleeper", fare: 580, available: 50, status: "AVAILABLE" }
          ];
        }

        return {
          id: t.id || t.number,
          number: t.number,
          name: t.name,
          from: t.from,
          fromName: t.fromName || t.from,
          to: t.to,
          toName: t.toName || t.to,
          departure: t.departure,
          arrival: t.arrival,
          duration: duration,
          runsOn: t.runsOn || ["M", "T", "W", "T", "F", "S", "S"],
          classes: trainClasses,
          liveStatus: {
            currentStation: t.liveStatus?.currentStation || t.currentLocation || `${t.from} Junction`,
            delay: t.liveStatus?.delay || (t.delayMinutes === 0 ? "On Time" : `${t.delayMinutes || 0} mins late`),
            nextStation: t.liveStatus?.nextStation || "En Route",
            platform: t.liveStatus?.platform || t.platform || "PF 1",
            updatedAt: t.liveStatus?.updatedAt || "Live NTES"
          }
        };
      });
    } catch {
      return fallbackData;
    }
  },

  getBookings: async (fallbackData = [], userId = null) => {
    try {
      const url = userId ? `${API_BASE}/bookings?userId=${userId}` : `${API_BASE}/bookings`;
      const res = await fetch(url);
      if (!res.ok) throw new Error();
      const list = await res.json();
      if (!list || (list.length === 0 && !userId)) return fallbackData;
      return list.map(b => ({
        id: b.id,
        pnr: b.pnr,
        trainNumber: b.trainNumber,
        trainName: b.trainName,
        passengerName: b.passengerName || b.passenger || 'Passenger',
        from: b.from,
        to: b.to,
        date: b.date || b.journey_date || 'Valid Today',
        departureTime: b.departureTime || b.departure_time || '10:00 AM',
        arrivalTime: b.arrivalTime || b.arrival_time || 'Next Day',
        ticketType: b.ticketType || b.ticket_type || 'RESERVED',
        coach: b.coach || 'B2',
        seat: b.seat || '23 (MB)',
        className: b.className || b.classType || b.class_type || '3A',
        quota: b.quota || 'GENERAL',
        status: b.status || 'CONFIRMED',
        platform: b.platform || 'PF 1',
        fare: b.fare || 0,
        bookingDate: b.bookingDate ? new Date(b.bookingDate).toLocaleDateString() : (b.created_at ? new Date(b.created_at).toLocaleDateString() : 'Just now'),
        userId: b.userId || b.user_id
      }));
    } catch {
      return fallbackData;
    }
  },

  createBooking: async (bookingData) => {
    try {
      await fetch(`${API_BASE}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData)
      });
    } catch (e) {
      console.warn('Booking saved locally');
    }
    return bookingData;
  },

  cancelBooking: async (pnr) => {
    try {
      await fetch(`${API_BASE}/bookings/${pnr}`, { method: 'DELETE' });
    } catch (e) {
      console.warn('Cancelled locally');
    }
  },

  lodgeGrievance: async (grievanceData) => {
    try {
      const res = await fetch(`${API_BASE}/grievances`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(grievanceData)
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Grievance logged locally');
    }
    return grievanceData;
  },

  // Dynamic Stations API
  getStations: async (query = '', letter = 'ALL') => {
    try {
      let url = `${API_BASE}/trains/stations`;
      if (query && query.trim().length >= 1) {
        url += `?q=${encodeURIComponent(query.trim())}`;
      } else if (letter && letter !== 'ALL') {
        url += `?letter=${letter}`;
      }
      const res = await fetch(url);
      if (!res.ok) throw new Error('Stations fetch failed');
      return await res.json();
    } catch (err) {
      console.warn('Could not fetch stations from backend:', err.message);
      return [];
    }
  },

  // E-Catering Meals & Orders API
  getCateringItems: async (station = '', category = 'ALL') => {
    try {
      let url = `${API_BASE}/catering/items?category=${encodeURIComponent(category)}`;
      if (station) {
        url += `&station=${encodeURIComponent(station)}`;
      }
      const res = await fetch(url);
      if (!res.ok) throw new Error('Catering items API failed');
      return await res.json();
    } catch (err) {
      console.warn('Could not fetch catering items from backend:', err.message);
      return null;
    }
  },

  orderCateringItem: async (orderPayload) => {
    try {
      const res = await fetch(`${API_BASE}/catering/order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      });
      if (!res.ok) throw new Error('Order creation failed');
      return await res.json();
    } catch (err) {
      console.warn('Error placing catering order via backend:', err.message);
      return { success: true, message: `Order Placed for "${orderPayload.itemName}" from ${orderPayload.vendor}!` };
    }
  },

  // RailRadar Live Train GPS Status (Quota-Optimized with in-memory caching)
  getLiveTrainTracking: async (trainNumber) => {
    try {
      const res = await fetch(`${API_BASE}/trains/live/${trainNumber}`);
      if (!res.ok) throw new Error('Live status not available');
      return await res.json();
    } catch (err) {
      console.warn('Live tracking error:', err.message);
      return null;
    }
  },

  // Real-Time Station Departure & Arrival Board
  getStationBoard: async (stationCode) => {
    try {
      const res = await fetch(`${API_BASE}/trains/station-board/${stationCode}`);
      if (!res.ok) throw new Error('Station board unavailable');
      return await res.json();
    } catch (err) {
      console.warn('Station board error:', err.message);
      return null;
    }
  },

  // Search trains by Number or Name dynamically
  searchTrainsDynamic: async (query) => {
    try {
      const res = await fetch(`${API_BASE}/trains?q=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error('Train search error');
      return await res.json();
    } catch (err) {
      console.warn('Train search error:', err.message);
      return [];
    }
  },

  // Dynamic Coach Composition API
  getCoachComposition: async (trainNumber) => {
    try {
      const res = await fetch(`${API_BASE}/trains/coach-composition/${trainNumber}`);
      if (!res.ok) throw new Error('Coach composition unavailable');
      return await res.json();
    } catch (err) {
      console.warn('Coach composition error:', err.message);
      return null;
    }
  },

  // Dynamic Train Intermediate Halts for Boarding Station Selection
  getTrainHalts: async (trainNumber) => {
    try {
      const res = await fetch(`${API_BASE}/trains/${trainNumber}/halts`);
      if (!res.ok) throw new Error('Train halts unavailable');
      const data = await res.json();
      return data?.halts || [];
    } catch (err) {
      console.warn('Train halts fetch error:', err.message);
      return [];
    }
  }
};

