export const ADMIN_TRAINS = [
  {
    id: "12952",
    number: "12952",
    name: "Mumbai Rajdhani Express",
    from: "NDLS",
    to: "MMCT",
    departure: "16:55",
    arrival: "08:35",
    type: "RAJDHANI",
    zone: "WR",
    status: "ON_TIME",
    currentLocation: "Kota Jn (KOTA)",
    platform: "PF 1",
    delayMinutes: 0,
    speedKmph: 128,
    occupancyPercent: 96,
    rakes: 22,
    pantryVendor: "IRCTC / Haldiram's"
  },
  {
    id: "22436",
    number: "22436",
    name: "Vande Bharat Express",
    from: "NDLS",
    to: "CNB",
    departure: "06:00",
    arrival: "10:08",
    type: "VANDE_BHARAT",
    zone: "NCR",
    status: "SLIGHT_DELAY",
    currentLocation: "Approaching Aligarh Jn",
    platform: "PF 3",
    delayMinutes: 6,
    speedKmph: 135,
    occupancyPercent: 100,
    rakes: 16,
    pantryVendor: "Chai Point & Meals"
  },
  {
    id: "12004",
    number: "12004",
    name: "Lucknow Shatabdi",
    from: "NDLS",
    to: "LKO",
    departure: "06:10",
    arrival: "12:40",
    type: "SHATABDI",
    zone: "NR",
    status: "ON_TIME",
    currentLocation: "Moradabad Jn",
    platform: "PF 2",
    delayMinutes: 0,
    speedKmph: 110,
    occupancyPercent: 88,
    rakes: 14,
    pantryVendor: "IRCTC Kitchen"
  },
  {
    id: "12302",
    number: "12302",
    name: "Howrah Rajdhani Express",
    from: "NDLS",
    to: "HWH",
    departure: "16:50",
    arrival: "09:55",
    type: "RAJDHANI",
    zone: "ER",
    status: "DELAYED",
    currentLocation: "Kanpur Central (CNB)",
    platform: "PF 4",
    delayMinutes: 28,
    speedKmph: 95,
    occupancyPercent: 94,
    rakes: 21,
    pantryVendor: "Haldiram's & Amul"
  }
];

export const ADMIN_STATS = {
  activeTrainsToday: 12480,
  dailyPassengersBooked: 2481900,
  revenueTodayInr: "₹48.24 Cr",
  punctualityRate: "92.4%",
  activeGrievances: 142,
  walletFloatBalance: "₹184.6 Cr",
  serverUptime: "99.98%"
};

export const ADMIN_GRIEVANCES = [
  {
    id: "RM-202611-9481",
    pnr: "2847193021",
    train: "12952 - Mumbai Rajdhani",
    coach: "B2-23",
    category: "Coach Cleanliness",
    reportedBy: "Rahul Sharma (+91 9876543210)",
    time: "15 mins ago",
    priority: "HIGH",
    status: "ASSIGNED",
    assignedTo: "OBHS Captain - Kota Division"
  },
  {
    id: "RM-202611-9310",
    pnr: "1892048192",
    train: "22436 - Vande Bharat",
    coach: "C2-14",
    category: "Electrical / AC Cooling",
    reportedBy: "Amit Verma (+91 9123456780)",
    time: "32 mins ago",
    priority: "MEDIUM",
    status: "RESOLVED",
    assignedTo: "Electrical Wing - Aligarh"
  },
  {
    id: "RM-202611-8911",
    pnr: "7481920481",
    train: "12302 - Howrah Rajdhani",
    coach: "S4-48",
    category: "RPF Security Help",
    reportedBy: "Sunita Roy (+91 9988776655)",
    time: "48 mins ago",
    priority: "CRITICAL",
    status: "IN_PROGRESS",
    assignedTo: "RPF Flying Squad CNB"
  }
];

export const ADMIN_BOOKINGS = [
  {
    pnr: "2847193021",
    trainNumber: "12952",
    trainName: "Mumbai Rajdhani",
    passenger: "Rahul Sharma",
    from: "NDLS",
    to: "MMCT",
    classType: "3A",
    fare: 2150,
    paymentMethod: "R-WALLET",
    status: "CONFIRMED",
    bookedAt: "13 Nov, 08:30 AM"
  },
  {
    pnr: "UTS84719201",
    trainNumber: "SUBURBAN",
    trainName: "UTS General Suburban Pass",
    passenger: "Vikas Mehra",
    from: "NDLS",
    to: "CNB",
    classType: "GEN (II)",
    fare: 45,
    paymentMethod: "R-WALLET (3% Off)",
    status: "ACTIVE_PASS",
    bookedAt: "13 Nov, 09:12 AM"
  },
  {
    pnr: "UTS91820412",
    trainNumber: "PLATFORM",
    trainName: "Platform Entry Pass (2h)",
    passenger: "Deepak Patel",
    from: "NDLS",
    to: "NDLS",
    classType: "PLATFORM",
    fare: 10,
    paymentMethod: "UPI",
    status: "VALID_NOW",
    bookedAt: "13 Nov, 10:05 AM"
  }
];

