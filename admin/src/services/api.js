const API_BASE = 'http://localhost:5000/api';

export const api = {
  // Trains
  getTrains: async () => {
    try {
      const res = await fetch(`${API_BASE}/trains`);
      if (!res.ok) throw new Error(`API Error: ${res.statusText}`);
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch (e) {
      console.error('Failed to fetch trains from backend API:', e.message);
      return [];
    }
  },
  createTrain: async (trainData) => {
    try {
      const res = await fetch(`${API_BASE}/trains`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(trainData)
      });
      return await res.json();
    } catch (e) {
      console.error(e);
      return trainData;
    }
  },
  updateTrainLive: async (number, liveData) => {
    try {
      const res = await fetch(`${API_BASE}/trains/${number}/live`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(liveData)
      });
      return await res.json();
    } catch (e) {
      console.error(e);
      return liveData;
    }
  },
  deleteTrain: async (id) => {
    try {
      await fetch(`${API_BASE}/trains/${id}`, { method: 'DELETE' });
    } catch (e) {
      console.error(e);
    }
  },

  // Bookings
  getBookings: async (fallbackData = []) => {
    try {
      const res = await fetch(`${API_BASE}/bookings`);
      if (!res.ok) throw new Error('API Error');
      return await res.json();
    } catch (e) {
      return fallbackData;
    }
  },
  createBooking: async (bookingData) => {
    try {
      const res = await fetch(`${API_BASE}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData)
      });
      return await res.json();
    } catch (e) {
      return bookingData;
    }
  },
  cancelBooking: async (pnr) => {
    try {
      await fetch(`${API_BASE}/bookings/${pnr}`, { method: 'DELETE' });
    } catch (e) {
      console.error(e);
    }
  },

  // Grievances
  getGrievances: async (fallbackData = []) => {
    try {
      const res = await fetch(`${API_BASE}/grievances`);
      if (!res.ok) throw new Error('API Error');
      return await res.json();
    } catch (e) {
      return fallbackData;
    }
  },
  createGrievance: async (grievanceData) => {
    try {
      const res = await fetch(`${API_BASE}/grievances`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(grievanceData)
      });
      return await res.json();
    } catch (e) {
      return grievanceData;
    }
  },
  updateGrievance: async (id, updateData) => {
    try {
      const res = await fetch(`${API_BASE}/grievances/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });
      return await res.json();
    } catch (e) {
      return updateData;
    }
  },

  // Broadcasts
  getBroadcasts: async (fallbackData = []) => {
    try {
      const res = await fetch(`${API_BASE}/broadcasts`);
      if (!res.ok) throw new Error('API Error');
      return await res.json();
    } catch (e) {
      return fallbackData;
    }
  },
  createBroadcast: async (broadcastData) => {
    try {
      const res = await fetch(`${API_BASE}/broadcasts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(broadcastData)
      });
      return await res.json();
    } catch (e) {
      return broadcastData;
    }
  }
};

