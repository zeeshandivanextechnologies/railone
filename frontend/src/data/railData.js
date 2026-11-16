export const STATIONS = [
  { code: "NDLS", name: "New Delhi", city: "Delhi", state: "DL" },
  { code: "MMCT", name: "Mumbai Central", city: "Mumbai", state: "MH" },
  { code: "HWH", name: "Howrah Jn", city: "Kolkata", state: "WB" },
  { code: "MAS", name: "Chennai Central", city: "Chennai", state: "TN" },
  { code: "SBC", name: "KSR Bengaluru", city: "Bengaluru", state: "KA" },
  { code: "JP", name: "Jaipur Jn", city: "Jaipur", state: "RJ" },
  { code: "ADI", name: "Ahmedabad Jn", city: "Ahmedabad", state: "GJ" },
  { code: "LKO", name: "Lucknow Charbagh", city: "Lucknow", state: "UP" },
  { code: "PNBE", name: "Patna Jn", city: "Patna", state: "BR" },
  { code: "CNB", name: "Kanpur Central", city: "Kanpur", state: "UP" },
  { code: "BPL", name: "Bhopal Jn", city: "Bhopal", state: "MP" },
  { code: "HYB", name: "Hyderabad Deccan", city: "Hyderabad", state: "TS" }
];

export const INITIAL_TRAINS = [
  {
    id: "12952",
    number: "12952",
    name: "Mumbai Rajdhani",
    from: "NDLS",
    to: "MMCT",
    departure: "16:55",
    arrival: "08:35",
    duration: "15h 40m",
    runsOn: ["M", "T", "W", "T", "F", "S", "S"],
    classes: [
      { code: "1A", name: "First AC", fare: 4850, available: 12, status: "AVAILABLE" },
      { code: "2A", name: "2 Tier AC", fare: 2980, available: 38, status: "AVAILABLE" },
      { code: "3A", name: "3 Tier AC", fare: 2150, available: 104, status: "AVAILABLE" },
    ],
    liveStatus: {
      currentStation: "Kota Jn (KOTA)",
      delay: "On Time",
      nextStation: "Ratlam Jn",
      platform: "PF 1",
      updatedAt: "Just now"
    }
  },
  {
    id: "22436",
    number: "22436",
    name: "Vande Bharat Express",
    from: "NDLS",
    to: "CNB",
    departure: "06:00",
    arrival: "10:08",
    duration: "4h 08m",
    runsOn: ["T", "W", "F", "S", "S"],
    classes: [
      { code: "EC", name: "Exec. Chair Car", fare: 1940, available: 24, status: "AVAILABLE" },
      { code: "CC", name: "AC Chair Car", fare: 1110, available: 65, status: "AVAILABLE" },
    ],
    liveStatus: {
      currentStation: "Approaching Aligarh Jn",
      delay: "5 mins late",
      nextStation: "Kanpur Central",
      platform: "PF 3",
      updatedAt: "2 min ago"
    }
  },
  {
    id: "12004",
    number: "12004",
    name: "Lucknow Shatabdi",
    from: "NDLS",
    to: "LKO",
    departure: "06:10",
    arrival: "12:40",
    duration: "6h 30m",
    runsOn: ["M", "T", "W", "T", "F", "S", "S"],
    classes: [
      { code: "EC", name: "Exec. Chair Car", fare: 1850, available: 16, status: "AVAILABLE" },
      { code: "CC", name: "AC Chair Car", fare: 1060, available: 142, status: "AVAILABLE" },
    ],
    liveStatus: {
      currentStation: "Moradabad Jn",
      delay: "On Time",
      nextStation: "Bareilly Jn",
      platform: "PF 2",
      updatedAt: "Just now"
    }
  },
  {
    id: "12302",
    number: "12302",
    name: "Howrah Rajdhani",
    from: "NDLS",
    to: "HWH",
    departure: "16:50",
    arrival: "09:55",
    duration: "17h 05m",
    runsOn: ["M", "T", "W", "F", "S", "S"],
    classes: [
      { code: "1A", name: "First AC", fare: 5120, available: 6, status: "RAC 4" },
      { code: "2A", name: "2 Tier AC", fare: 3110, available: 42, status: "AVAILABLE" },
      { code: "3A", name: "3 Tier AC", fare: 2280, available: 89, status: "AVAILABLE" },
      { code: "SL", name: "Sleeper", fare: 720, available: 18, status: "WL 12" },
    ],
    liveStatus: {
      currentStation: "Pandit Deen Dayal Upadhyaya Jn",
      delay: "12 mins late",
      nextStation: "Patna Jn",
      platform: "PF 4",
      updatedAt: "5 min ago"
    }
  }
];

export const INITIAL_BOOKINGS = [
  {
    pnr: "2847193021",
    trainNumber: "12952",
    trainName: "Mumbai Rajdhani",
    from: "NDLS",
    to: "MMCT",
    date: "Tomorrow",
    departureTime: "16:55",
    arrivalTime: "08:35",
    ticketType: "RESERVED",
    coach: "B4",
    seat: "37 (SL)",
    className: "3A",
    quota: "GN",
    status: "CNF",
    platform: "PF 1",
    passengerName: "Rahul Sharma",
    age: 29,
    gender: "M",
    fare: 2150,
    bookingDate: "Today, 14:20"
  }
];

