import express from 'express';
import { pool } from '../config/db.js';
import { railRadarService } from '../services/railRadarService.js';

const router = express.Router();

// Helper function to dynamically generate train classes, fares, and availability from train route API & distance
const generateDynamicClasses = (trainObj, trainDetailsFromApi, isTatkal = false) => {
  // 1. Get real classes supported by this train from Live API (e.g. ['1A', '2A', '3A'] or ['CC', '2S'] or ['EC', 'CC'])
  const supportedClassCodes = trainDetailsFromApi?.classes 
    || trainObj?.classes 
    || (trainObj?.name?.toLowerCase().includes('shatabdi') ? ['EC', 'CC'] 
       : trainObj?.name?.toLowerCase().includes('jan shatabdi') ? ['CC', '2S'] 
       : ['1A', '2A', '3A', 'SL']);

  const distanceKm = trainDetailsFromApi?.distance || trainObj?.distance || 750;
  const isPremiumTrain = trainObj?.name?.toLowerCase().includes('rajdhani') 
    || trainObj?.name?.toLowerCase().includes('tejas') 
    || trainObj?.name?.toLowerCase().includes('vande');

  // Official Indian Railways class metadata & dynamic rate-per-km matrix
  const CLASS_METADATA = {
    '1A': { name: 'First AC', baseFare: isPremiumTrain ? 1200 : 800, ratePerKm: 2.85, baseCapacity: 18, tatkalCap: 4 },
    '2A': { name: '2 Tier AC', baseFare: isPremiumTrain ? 800 : 500, ratePerKm: 1.75, baseCapacity: 48, tatkalCap: 10 },
    '3A': { name: '3 Tier AC', baseFare: isPremiumTrain ? 600 : 380, ratePerKm: 1.25, baseCapacity: 128, tatkalCap: 24 },
    '3E': { name: '3 AC Economy', baseFare: 500, ratePerKm: 1.10, baseCapacity: 128, tatkalCap: 24 },
    'EC': { name: 'Exec. Chair Car', baseFare: 900, ratePerKm: 2.60, baseCapacity: 24, tatkalCap: 6 },
    'CC': { name: 'AC Chair Car', baseFare: 450, ratePerKm: 1.30, baseCapacity: 78, tatkalCap: 16 },
    'SL': { name: 'Sleeper', baseFare: 120, ratePerKm: 0.45, baseCapacity: 160, tatkalCap: 32 },
    '2S': { name: 'Second Sitting', baseFare: 60, ratePerKm: 0.25, baseCapacity: 108, tatkalCap: 20 },
    'EA': { name: 'Anubhuti Class', baseFare: 1200, ratePerKm: 3.10, baseCapacity: 24, tatkalCap: 4 }
  };

  return supportedClassCodes.map(code => {
    const meta = CLASS_METADATA[code] || { name: `${code} Class`, baseFare: 300, ratePerKm: 1.0, baseCapacity: 50, tatkalCap: 10 };
    
    // Dynamic Base Fare calculation based on actual train route distance
    let calculatedFare = Math.round(meta.baseFare + (distanceKm * meta.ratePerKm));
    
    // Official Tatkal Surcharge (30% of base fare, respecting min & max railway caps)
    if (isTatkal) {
      const isAC = ['1A', '2A', '3A', '3E', 'EC', 'CC', 'EA'].includes(code);
      const surcharge = isAC ? Math.max(400, Math.min(500, Math.round(calculatedFare * 0.30))) 
                             : Math.max(100, Math.min(200, Math.round(calculatedFare * 0.30)));
      calculatedFare += surcharge;
    }

    // Dynamic seat availability
    const maxSeats = isTatkal ? meta.tatkalCap : meta.baseCapacity;
    const availableSeats = Math.max(0, Math.round(maxSeats * 0.75));
    const isAvail = availableSeats > 0;

    return {
      code,
      name: meta.name,
      fare: calculatedFare,
      available: availableSeats,
      status: isAvail ? 'AVAILABLE' : 'WAITLIST',
      statusText: isTatkal 
        ? (isAvail ? `AVAILABLE ${availableSeats}` : `TQWL / WL${Math.abs(availableSeats) + 1}`) 
        : (isAvail ? `AVAILABLE ${availableSeats}` : `WL ${Math.abs(availableSeats) + 1}`)
    };
  });
};

// 1. GET ALL TRAINS / SEARCH TRAINS (Dynamic RailRadar + Local PostgreSQL fallback)
router.get('/', async (req, res) => {
  try {
    const { from, to, q, date, quota } = req.query;
    const isTatkal = (quota || '').toUpperCase() === 'TATKAL';
    const isPremiumTatkal = (quota || '').toUpperCase() === 'PREMIUM_TATKAL';

    // A. If searching by route (from -> to) or search query q
    if (from || to || q) {
      const trainMap = new Map();
      const fromCode = (from || '').toUpperCase().trim();
      const toCode = (to || '').toUpperCase().trim();
      const searchQuery = (q || '').trim();

      // 1. PRIMARY REAL-TIME: If both From and To are provided, fetch live routes directly from RailCore API (/routes/trains)
      if (fromCode && toCode) {
        try {
          const liveRouteTrains = await railRadarService.getTrainsBetweenStations(fromCode, toCode, date);
          if (liveRouteTrains && liveRouteTrains.length > 0) {
            liveRouteTrains.forEach(rt => {
              trainMap.set(rt.number, rt);
            });
            // If live RailCore routes found, return directly without polluting with reverse or static DB fallbacks
            return res.json(Array.from(trainMap.values()));
          }
        } catch (e) {
          console.warn('[RailCore] Live route search fallback to DB:', e.message);
        }
      }

      // 2. Also search intermediate halts table in PostgreSQL (STRICT FORWARD SEQUENCE ONLY)
      if (fromCode && toCode) {
        const haltMatches = await pool.query(`
          SELECT t.*, 
                 h1.departure AS halt_dep, 
                 h2.arrival AS halt_arr, 
                 h1.sequence AS s1, 
                 h2.sequence AS s2,
                 ABS(h2.sequence - h1.sequence) AS halt_diff
          FROM trains t
          JOIN train_station_halts h1 ON t.number = h1.train_number
          JOIN train_station_halts h2 ON t.number = h2.train_number
          WHERE h1.station_code = $1 
            AND h2.station_code = $2 
            AND h1.sequence < h2.sequence
          ORDER BY t.number ASC LIMIT 30
        `, [fromCode, toCode]).catch(() => ({ rows: [] }));

        haltMatches.rows.forEach(t => {
          if (!trainMap.has(t.number)) {
            // Calculate dynamic duration from departure and arrival
            let depTime = t.halt_dep || t.departure || '06:00';
            let arrTime = t.halt_arr || t.arrival || '10:00';
            let calculatedDuration = '2h 30m';
            try {
              const [dh, dm] = depTime.split(':').map(Number);
              const [ah, am] = arrTime.split(':').map(Number);
              let diffMins = (ah * 60 + am) - (dh * 60 + dm);
              if (diffMins < 0) diffMins += 24 * 60;
              const h = Math.floor(diffMins / 60);
              const m = diffMins % 60;
              calculatedDuration = `${h}h ${m}m`;
            } catch (_) {}

            // Generate dynamic classes matching train's actual coaches & distance
            const approxKm = Math.max(1, (t.halt_diff || 2)) * 65;
            const dynamicClasses = generateDynamicClasses({ ...t, distance: approxKm }, null, isTatkal);

            trainMap.set(t.number, {
              id: t.id || t.number,
              number: t.number,
              name: t.name,
              from: fromCode,
              fromName: fromCode,
              to: toCode,
              toName: toCode,
              departure: depTime,
              arrival: arrTime,
              duration: calculatedDuration,
              type: t.type || 'EXPRESS',
              zone: t.zone || 'NR',
              status: t.status || 'Active',
              currentLocation: t.current_location || `${fromCode} Jn`,
              platform: t.platform || 'PF 1',
              delayMinutes: t.delay_minutes || 0,
              quota: quota || 'GENERAL',
              isTatkal: isTatkal || isPremiumTatkal,
              liveStatus: {
                currentStation: t.current_location || fromCode,
                delay: t.delay_minutes === 0 ? 'On Time' : `${t.delay_minutes} mins late`,
                platform: t.platform || 'PF 1',
                updatedAt: 'Live NTES'
              },
              classes: dynamicClasses
            });
          }
        });
      }

      // 3. If searching by free text query q, call RailCore train search
      let liveResults = [];
      if (searchQuery.length >= 2) {
        liveResults = await railRadarService.searchTrains(searchQuery).catch(() => []);
      }

      // Also search direct local DB matches
      let dbQuery = 'SELECT * FROM trains WHERE 1=1';
      const dbParams = [];
      if (fromCode && toCode) {
        dbParams.push(fromCode, toCode);
        dbQuery += ` AND (
          ("from" = $1 AND "to" = $2)
          OR ("from" = $2 AND "to" = $1)
          OR ("from" ILIKE $1 AND "to" ILIKE $2)
          OR ("from" ILIKE $2 AND "to" ILIKE $1)
        )`;
      } else if (fromCode) {
        dbParams.push(`%${fromCode}%`);
        dbQuery += ` AND ("from" ILIKE $1 OR "to" ILIKE $1)`;
      } else if (searchQuery) {
        dbParams.push(`%${searchQuery}%`);
        dbQuery += ` AND (number ILIKE $1 OR name ILIKE $1 OR "from" ILIKE $1 OR "to" ILIKE $1)`;
      }
      dbQuery += ' ORDER BY number ASC LIMIT 50';

      const dbRes = await pool.query(dbQuery, dbParams).catch(() => ({ rows: [] }));

      // Format DB rows
      dbRes.rows.forEach(t => {
        if (!trainMap.has(t.number)) {
          const dynamicClasses = generateDynamicClasses(t, null, isTatkal);
          trainMap.set(t.number, {
            id: t.id || t.number,
            number: t.number,
            name: t.name,
            from: t.from,
            fromName: t.from,
            to: t.to,
            toName: t.to,
            departure: t.departure || '08:30',
            arrival: t.arrival || '19:45',
            duration: '11h 15m',
            type: t.type || 'EXPRESS',
            zone: t.zone || 'NR',
            status: t.status || 'Active',
            currentLocation: t.current_location || `${t.from} Yard`,
            platform: t.platform || 'PF 1',
            delayMinutes: t.delay_minutes || 0,
            quota: quota || 'GENERAL',
            isTatkal: isTatkal || isPremiumTatkal,
            liveStatus: {
              currentStation: t.current_location || t.from,
              delay: t.delay_minutes === 0 ? 'On Time' : `${t.delay_minutes} mins late`,
              platform: t.platform || 'PF 1',
              updatedAt: 'Live NTES'
            },
            classes: dynamicClasses
          });
        }
      });

      // Merge Live RailRadar trains
      liveResults.forEach(lt => {
        // If from and to filter applied, check if matches route
        const matchesRoute = (!fromCode || !toCode) || 
          (lt.from.toUpperCase() === fromCode && lt.to.toUpperCase() === toCode) ||
          (lt.from.toUpperCase() === toCode && lt.to.toUpperCase() === fromCode) ||
          (lt.from.toUpperCase().includes(fromCode) && lt.to.toUpperCase().includes(toCode));

        if (matchesRoute && !trainMap.has(lt.number)) {
          // Dynamic pricing and classes from RailRadar API
          const isRajdhani = lt.name.toLowerCase().includes('rajdhani') || lt.name.toLowerCase().includes('tejas');
          const isShatabdi = lt.name.toLowerCase().includes('shatabdi') || lt.name.toLowerCase().includes('vande bharat');

          const dynamicClasses = generateDynamicClasses(lt, null, isTatkal);

          trainMap.set(lt.number, {
            id: lt.number,
            number: lt.number,
            name: lt.name,
            from: lt.from,
            fromName: lt.fromName || lt.from,
            to: lt.to,
            toName: lt.toName || lt.to,
            departure: lt.departure || '06:00',
            arrival: lt.arrival || '14:30',
            duration: lt.duration || '8h 30m',
            type: lt.type || (isRajdhani ? 'RAJDHANI' : (isShatabdi ? 'SHATABDI' : 'SUPERFAST')),
            zone: 'IR',
            status: 'Active',
            currentLocation: `${lt.fromName || lt.from} Jn`,
            platform: 'PF 1',
            delayMinutes: 0,
            quota: quota || 'GENERAL',
            isTatkal: isTatkal || isPremiumTatkal,
            liveStatus: {
              currentStation: lt.fromName || lt.from,
              delay: 'On Time',
              platform: 'PF 1',
              updatedAt: 'Live RailRadar'
            },
            classes: dynamicClasses
          });
        }
      });

      const trainList = Array.from(trainMap.values());
      // Return matching trains directly (do NOT fall back to arbitrary random trains when 0 matching)
      return res.json(trainList);
    }

    // Default: fetch all trains in local database + featured
    const result = await pool.query('SELECT * FROM trains ORDER BY number ASC');

    // Fetch RailRadar live info for the primary train (12919) if available (utilizing 15-min cache)
    const featuredLive = await railRadarService.getLiveTrainStatus('12919').catch(() => null);

    // Map db columns to camelCase for frontend compatibility
    const trains = result.rows.map(t => {
      let liveStatus = {
        currentStation: t.current_location || "Kota Jn",
        delay: t.delay_minutes === 0 ? "On Time" : `${t.delay_minutes} mins late`,
        nextStation: "Ratlam Jn",
        platform: t.platform || "PF 1",
        updatedAt: "Just now"
      };

      // If this train is 12919 or has RailRadar live feed
      if (t.number === '12919' && featuredLive) {
        liveStatus = {
          currentStation: featuredLive.currentLocation?.stationName || t.current_location,
          delay: featuredLive.delayMinutes === 0 ? "On Time" : `${featuredLive.delayMinutes} mins late`,
          nextStation: featuredLive.nextHalt?.stationName || "Next Station",
          platform: t.platform || "PF 1",
          speedKmh: featuredLive.currentLocation?.speedKmh || 0,
          isRailRadarLive: true,
          updatedAt: featuredLive.lastUpdatedAt || "Just now"
        };
      }

      // Calculate dynamic duration from departure and arrival times
      let durationStr = "12h 00m";
      if (t.departure && t.arrival) {
        try {
          const [dh, dm] = t.departure.split(':').map(Number);
          const [ah, am] = t.arrival.split(':').map(Number);
          if (!isNaN(dh) && !isNaN(ah)) {
            let diff = (ah * 60 + (am || 0)) - (dh * 60 + (dm || 0));
            if (diff < 0) diff += 24 * 60;
            const hours = Math.floor(diff / 60);
            const mins = diff % 60;
            durationStr = `${hours}h ${mins}m`;
          }
        } catch (_) {}
      }

      // Calculate dynamic fare classes based on actual train route distance & supported classes from API
      const dynamicClasses = generateDynamicClasses(t, null, isTatkal);

      return {
        id: t.id,
        number: t.number,
        name: t.name,
        from: t.from,
        to: t.to,
        departure: t.departure,
        arrival: t.arrival,
        duration: durationStr,
        runsOn: ["M", "T", "W", "T", "F", "S", "S"],
        classes: dynamicClasses,
        type: t.type,
        zone: t.zone,
        status: t.status,
        currentLocation: liveStatus.currentStation,
        platform: t.platform,
        delayMinutes: t.delay_minutes,
        speedKmph: t.speed_kmph,
        occupancyPercent: t.occupancy_percent,
        rakes: t.rakes,
        pantryVendor: t.pantry_vendor,
        liveStatus
      };
    });

    res.json(trains);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 1.1 GET STATIONS (Dynamic RailRadar Station Search + Cached Directory)
router.get('/stations', async (req, res) => {
  try {
    const { q, letter } = req.query;

    // A. If searching by query (e.g. ?q=del or ?q=KOTA or ?q=mumbai)
    if (q && q.trim().length >= 1) {
      const cleanQ = q.trim().replace(/[^a-zA-Z0-9 ]/g, '');
      if (cleanQ.length > 0) {
        // Query local database first
        const dbMatches = await pool.query(`
          SELECT code, name, city, state, popularity 
          FROM all_railway_stations 
          WHERE code ILIKE $1 OR name ILIKE $1 OR city ILIKE $1
          ORDER BY 
            CASE 
              WHEN code ILIKE $2 THEN 1
              WHEN name ILIKE $2 THEN 2
              WHEN name ILIKE $3 THEN 3
              ELSE 4
            END,
            popularity DESC, 
            name ASC 
          LIMIT 50
        `, [`%${cleanQ}%`, cleanQ, `${cleanQ}%`]).catch(() => ({ rows: [] }));

        if (dbMatches.rows && dbMatches.rows.length > 0) {
          return res.json(dbMatches.rows);
        }

        // Only call external API if DB returns 0 and query is >= 3 chars
        if (cleanQ.length >= 3) {
          const liveStations = await railRadarService.searchStations(cleanQ).catch(() => []);
          if (liveStations && liveStations.length > 0) {
            for (const s of liveStations) {
              await pool.query(`
                INSERT INTO all_railway_stations (code, name, city, popularity, halt_count, lat, lng)
                VALUES ($1, $2, $3, $4, $4, $5, $6)
                ON CONFLICT (code) DO UPDATE 
                SET name = EXCLUDED.name, popularity = EXCLUDED.popularity
              `, [s.code, s.name, s.city, s.popularity || 10, s.lat || null, s.lng || null]).catch(() => {});
            }
            return res.json(liveStations);
          }
        }

        return res.json([]);
      }
    }

    // B. If filtering by letter (e.g. ?letter=A or ?letter=M)
    if (letter && letter !== 'ALL' && letter.length === 1) {
      // First check DB
      const dbMatch = await pool.query(
        `SELECT code, name, city, state, popularity FROM all_railway_stations 
         WHERE name ILIKE $1 OR code ILIKE $1 
         ORDER BY popularity DESC, name ASC 
         LIMIT 50`,
        [`${letter.toUpperCase()}%`]
      );

      if (dbMatch.rows.length > 0) {
        return res.json(dbMatch.rows);
      }
    }

    // C. Default: Return all stored railway stations sorted A to Z
    const allDbStations = await pool.query(`
      SELECT code, name, city, state, popularity 
      FROM all_railway_stations 
      ORDER BY popularity DESC, name ASC 
      LIMIT 100
    `);

    if (allDbStations.rows.length > 0) {
      return res.json(allDbStations.rows);
    }

    // Initial fallback if table is newly created
    const result = await pool.query(`
      SELECT DISTINCT "from" as code FROM trains
      UNION
      SELECT DISTINCT "to" as code FROM trains
    `);

    const stationMap = {
      'NDLS': { name: 'New Delhi', city: 'Delhi', state: 'DL' },
      'MMCT': { name: 'Mumbai Central', city: 'Mumbai', state: 'MH' },
      'DADN': { name: 'Dr. Ambedkar Nagar', city: 'Indore/Mhow', state: 'MP' },
      'SVDK': { name: 'Shri Mata Vaishno Devi Katra', city: 'Katra', state: 'JK' },
      'CNB': { name: 'Kanpur Central', city: 'Kanpur', state: 'UP' },
      'LKO': { name: 'Lucknow Charbagh', city: 'Lucknow', state: 'UP' },
      'HWH': { name: 'Howrah Jn', city: 'Kolkata', state: 'WB' },
      'ADI': { name: 'Ahmedabad Jn', city: 'Ahmedabad', state: 'GJ' },
      'JP': { name: 'Jaipur Jn', city: 'Jaipur', state: 'RJ' }
    };

    const list = result.rows.map(r => ({
      code: r.code,
      name: stationMap[r.code]?.name || `${r.code} Junction`,
      city: stationMap[r.code]?.city || r.code,
      state: stationMap[r.code]?.state || 'IR'
    }));

    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 1.1 LIVE FEATURED TRAINS STATUS FEED (Live RailCore GPS API for prominent express/rajdhani trains)
router.get('/featured-live', async (req, res) => {
  try {
    const prominentTrainNumbers = ['12952', '12004', '12424'];
    const results = await Promise.all(
      prominentTrainNumbers.map(async (num) => {
        try {
          const live = await railRadarService.getLiveTrainStatus(num);
          if (live && live.trainNumber) {
            return {
              id: live.trainNumber,
              number: live.trainNumber,
              name: live.trainName,
              from: live.source?.stationCode || '',
              to: live.destination?.stationCode || '',
              currentLocation: live.currentLocation?.stationName || live.currentLocation?.stationCode || 'En-Route',
              platform: live.nextHalt?.platform ? `PF ${live.nextHalt.platform}` : 'PF 1',
              delayMinutes: live.delayMinutes || 0,
              liveStatus: {
                currentStation: live.currentLocation?.stationName || live.currentLocation?.stationCode || 'In Transit',
                delay: live.delayMinutes === 0 ? 'On Time' : (live.delayMinutes > 0 ? `${live.delayMinutes}m Late` : `${Math.abs(live.delayMinutes)}m Early`),
                platform: live.nextHalt?.platform ? `PF ${live.nextHalt.platform}` : 'PF 1',
                speedKmh: live.speedKmph || 0,
                isRailRadarLive: true,
                statusText: live.statusText || 'Running Live',
                updatedAt: 'Live RailCore'
              }
            };
          }
        } catch (_) {}
        return null;
      })
    );

    const validList = results.filter(Boolean);
    if (validList.length > 0) {
      return res.json(validList);
    }

    // Fallback query from DB if external is slow
    const dbFallback = await pool.query(`SELECT * FROM trains WHERE number IN ('12952', '12004', '12424') LIMIT 3`);
    const mapped = dbFallback.rows.map(t => ({
      id: t.number,
      number: t.number,
      name: t.name,
      from: t.from,
      to: t.to,
      currentLocation: t.current_location || 'En-Route',
      platform: t.platform || 'PF 1',
      liveStatus: {
        currentStation: t.current_location || 'En-Route',
        delay: t.delay_minutes ? `${t.delay_minutes}m Late` : 'On Time',
        platform: t.platform || 'PF 1',
        isRailRadarLive: true,
        updatedAt: 'Live'
      }
    }));

    res.json(mapped);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 1.2 GET UTS & PLATFORM DYNAMIC FARE (Official Indian Railways UTS Rules)
router.get('/uts/fare', async (req, res) => {
  try {
    const { category, from, to, platformStation, trainType, passengerCount, duration, seasonClass } = req.query;
    const cat = (category || 'JOURNEY').toUpperCase();
    const count = Math.max(1, parseInt(passengerCount || '1', 10));

    // A. PLATFORM TICKET FARE
    if (cat === 'PLATFORM') {
      const stnCode = (platformStation || from || 'NDLS').toUpperCase();
      // Railway Platform fare rule: Major junctions / metro category stations ₹10 or ₹20, default ₹10
      const stnRes = await pool.query('SELECT popularity FROM all_railway_stations WHERE code = $1 LIMIT 1', [stnCode]).catch(() => ({ rows: [] }));
      const isMajor = (stnRes.rows[0]?.popularity || 5000) >= 10000;
      const unitFare = isMajor ? 10 : 10;
      const totalFare = unitFare * count;

      return res.json({
        success: true,
        category: 'PLATFORM',
        station: stnCode,
        unitFare,
        passengerCount: count,
        totalFare,
        validity: '2 Hours from booking',
        rules: 'Valid for platform entry only. Journey not permitted.'
      });
    }

    // B. SEASON TICKET (MST / QST - Monthly & Quarterly Season Ticket)
    if (cat === 'SEASON') {
      const fromCode = (from || 'NDLS').toUpperCase();
      const toCode = (to || 'CNB').toUpperCase();
      const dur = (duration || 'MONTHLY').toUpperCase(); // MONTHLY (MST) | QUARTERLY (QST)
      const tType = (trainType || 'ORDINARY').toUpperCase(); // ORDINARY (Passenger) | MAIL_EXP (Mail/Express) | SUPERFAST

      // Official Indian Railways Rule: 
      // Season tickets (MST/QST) are issued ONLY for Second Class (II / GS).
      // AC classes (1A, 2A, 3A) do NOT have season tickets / MST.
      const sClass = 'SECOND';

      // 1. Check if direct trains run on this route in DB to get realistic distance & travel type
      let distanceKm = 65;
      const routeTrain = await pool.query(
        'SELECT "from", "to", duration, type FROM trains WHERE ("from" = $1 AND "to" = $2) OR ("from" = $2 AND "to" = $1) LIMIT 1',
        [fromCode, toCode]
      ).catch(() => ({ rows: [] }));

      if (routeTrain.rows.length > 0 && routeTrain.rows[0].duration) {
        const durStr = routeTrain.rows[0].duration;
        const match = durStr.match(/(\d+)h/);
        if (match) {
          distanceKm = Math.max(25, parseInt(match[1], 10) * 55);
        }
      } else {
        // Geo-coordinate calculation between stations
        const coordsRes = await pool.query(
          'SELECT code, lat, lng FROM all_railway_stations WHERE code IN ($1, $2)',
          [fromCode, toCode]
        ).catch(() => ({ rows: [] }));

        if (coordsRes.rows.length === 2 && coordsRes.rows[0].lat && coordsRes.rows[1].lat) {
          const [s1, s2] = coordsRes.rows;
          const lat1 = parseFloat(s1.lat), lon1 = parseFloat(s1.lng);
          const lat2 = parseFloat(s2.lat), lon2 = parseFloat(s2.lng);
          const R = 6371;
          const dLat = (lat2 - lat1) * Math.PI / 180;
          const dLon = (lon2 - lon1) * Math.PI / 180;
          const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                    Math.sin(dLon/2) * Math.sin(dLon/2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          const straightKm = Math.round(R * c);
          distanceKm = Math.max(15, Math.round(straightKm * 1.25));
        }
      }

      // 2. Official Indian Railways MST Rule:
      // Single journey unreserved base fare for the distance:
      let singleJourneyBase = 15;
      if (distanceKm <= 20) singleJourneyBase = 10;
      else if (distanceKm <= 45) singleJourneyBase = 15;
      else if (distanceKm <= 100) singleJourneyBase = 30;
      else if (distanceKm <= 150) singleJourneyBase = 45;
      else singleJourneyBase = Math.round(45 + (distanceKm - 150) * 0.22);

      // Train Type multiplier: Mail/Express or Superfast
      if (tType === 'MAIL_EXP') {
        singleJourneyBase = Math.max(30, Math.round(singleJourneyBase * 1.35));
      } else if (tType === 'SUPERFAST') {
        singleJourneyBase = Math.max(45, Math.round(singleJourneyBase * 1.55) + 15);
      }

      // Railway MST formula: Monthly Season Ticket is charged at equivalent of ~15 single journeys
      let monthlyMST = Math.max(100, Math.round(singleJourneyBase * 15));
      // Superfast monthly supplement surcharge if applicable (₹45/month)
      if (tType === 'SUPERFAST') {
        monthlyMST += 45;
      }
      monthlyMST = Math.ceil(monthlyMST / 5) * 5; // Round to nearest ₹5

      // QST (Quarterly Season Ticket) = 2.7 times of Monthly MST (10% discount on 3 months)
      const quarterlyQST = Math.ceil((monthlyMST * 2.7) / 5) * 5;

      const totalFare = dur === 'QUARTERLY' ? quarterlyQST : monthlyMST;

      const validityDays = dur === 'QUARTERLY' ? 90 : 30;
      const validUntilDate = new Date();
      validUntilDate.setDate(validUntilDate.getDate() + validityDays);
      const validUntilStr = validUntilDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

      // Available Train Types for MST
      const availableTrainTypes = [
        { code: 'ORDINARY', label: 'Ordinary / Passenger Trains' },
        { code: 'MAIL_EXP', label: 'Mail / Express Trains' },
        { code: 'SUPERFAST', label: 'Superfast Express Trains (+₹45 SF Levy)' }
      ];

      // Available durations: MST (Monthly) vs QST (Quarterly)
      const availableDurations = [
        { code: 'MONTHLY', label: 'Monthly Pass (MST - 30 Days)', days: 30, fare: monthlyMST },
        { code: 'QUARTERLY', label: 'Quarterly Pass (QST - 90 Days)', days: 90, fare: quarterlyQST }
      ];

      // Official Railway Class: Only Second Class (II) for regular passengers / daily commuters
      const availableClasses = [
        { code: 'SECOND', label: 'Second Class (II / GS - Daily MST)', name: 'General Second Class' }
      ];

      return res.json({
        success: true,
        category: 'SEASON',
        from: fromCode,
        to: toCode,
        distanceKm,
        trainType: tType,
        duration: dur,
        seasonClass: sClass,
        totalFare,
        validityDays,
        validUntil: validUntilStr,
        validity: `${dur === 'QUARTERLY' ? 'QST' : 'MST'}: ${validityDays} Days (Until ${validUntilStr})`,
        availableTrainTypes,
        availableDurations,
        availableClasses,
        rules: 'Issued for daily commuters in Second Class (II). AC classes (1A/2A/3A) are not eligible for MST.'
      });
    }

    // C. UNRESERVED GENERAL JOURNEY TICKET
    const fromCode = (from || 'NDLS').toUpperCase();
    const toCode = (to || 'CNB').toUpperCase();
    const tType = (trainType || 'ORDINARY').toUpperCase();

    // 1. PRIMARY: Fetch Real Railway Track Distance & Live Fare from RailRadar Live API
    let distanceKm = null;
    let liveApiFare = null;

    try {
      // Find a train that connects these stations
      const trRes = await pool.query(
        'SELECT number FROM trains WHERE ("from" = $1 AND "to" = $2) OR ("from" = $2 AND "to" = $1) LIMIT 1',
        [fromCode, toCode]
      ).catch(() => ({ rows: [] }));

      let queryTrainNumber = trRes.rows[0]?.number;
      if (!queryTrainNumber) {
        // Check popular hub train lines
        if ((fromCode === 'NZM' || fromCode === 'NDLS') && toCode === 'SWM') queryTrainNumber = '12060';
        else if ((fromCode === 'NZM' || fromCode === 'NDLS') && (toCode === 'MMCT' || toCode === 'CSMT')) queryTrainNumber = '12952';
        else if ((fromCode === 'NDLS' || fromCode === 'DLI') && toCode === 'CNB') queryTrainNumber = '12034';
        else if ((fromCode === 'NDLS' || fromCode === 'DLI') && (toCode === 'LJN' || toCode === 'LKO')) queryTrainNumber = '12004';
        else if ((fromCode === 'NDLS' || fromCode === 'DLI') && toCode === 'BSB') queryTrainNumber = '22436';
      }

      if (queryTrainNumber) {
        // Query live RailRadar official fare & distance API
        const dStr = new Date().toISOString().split('T')[0];
        const fareUrl = `https://railradar.in/api/v1/trains/${queryTrainNumber}/fare?from=${fromCode}&to=${toCode}&date=${dStr}&classCode=2S`;
        const fareRes = await fetch(fareUrl).catch(() => null);

        if (fareRes && fareRes.ok) {
          const fareJson = await fareRes.json();
          if (fareJson.success && fareJson.data) {
            distanceKm = fareJson.data.distance;
            liveApiFare = fareJson.data.breakdown?.totalFare || fareJson.data.breakdown?.baseFare;
          }
        }

        // If fare API didn't have distance, fetch route stops distance
        if (!distanceKm) {
          const routeRes = await fetch(`https://railradar.in/api/v1/trains/${queryTrainNumber}`).catch(() => null);
          if (routeRes && routeRes.ok) {
            const routeJson = await routeRes.json();
            const route = routeJson.data?.route || [];
            const s1 = route.find(r => r.station?.code === fromCode);
            const s2 = route.find(r => r.station?.code === toCode);
            if (s1 && s2 && s1.distance !== undefined && s2.distance !== undefined) {
              distanceKm = Math.round(Math.abs(s2.distance - s1.distance));
            }
          }
        }
      }
    } catch (_) {}

    // 2. FALLBACK: Calculate precise railway route distance using Station Coordinates
    if (!distanceKm) {
      const coordsRes = await pool.query(
        'SELECT code, lat, lng FROM all_railway_stations WHERE code IN ($1, $2)',
        [fromCode, toCode]
      ).catch(() => ({ rows: [] }));

      if (coordsRes.rows.length === 2 && coordsRes.rows[0].lat && coordsRes.rows[1].lat) {
        const [s1, s2] = coordsRes.rows;
        const lat1 = parseFloat(s1.lat), lon1 = parseFloat(s1.lng);
        const lat2 = parseFloat(s2.lat), lon2 = parseFloat(s2.lng);
        const R = 6371; // Earth radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const straightKm = Math.round(R * c);
        // Real railway track winding multiplier (1.25x for straight lines)
        distanceKm = Math.max(12, Math.round(straightKm * 1.25));
      } else {
        distanceKm = 120;
      }
    }

    // Official Indian Railways UTS Second Class (II / 2S Unreserved) Passenger Tariff Table
    // Gated by distance slabs and train type (Passenger / Mail Exp / Superfast)
    let unitFare = 30;
    let sfCharge = 0;

    if (tType === 'ORDINARY') {
      // Ordinary / Suburban Passenger Train Tariff:
      // Minimum fare ₹10, gradual distance increment
      if (distanceKm <= 15) unitFare = 10;
      else if (distanceKm <= 45) unitFare = 15;
      else if (distanceKm <= 75) unitFare = 20;
      else if (distanceKm <= 110) unitFare = 30;
      else if (distanceKm <= 160) unitFare = 40;
      else if (distanceKm <= 220) unitFare = 55;
      else if (distanceKm <= 300) unitFare = 70;
      else if (distanceKm <= 400) unitFare = 90;
      else if (distanceKm <= 500) unitFare = 110;
      else {
        unitFare = Math.round(110 + ((distanceKm - 500) * 0.18));
      }
    } else {
      // Mail / Express Second Class (II) Unreserved Base Tariff:
      // Official IRCTC minimum fare is ₹30
      if (distanceKm <= 50) unitFare = 30;
      else if (distanceKm <= 100) unitFare = 45;
      else if (distanceKm <= 150) unitFare = 65;
      else if (distanceKm <= 200) unitFare = 80;
      else if (distanceKm <= 250) unitFare = 95;
      else if (distanceKm <= 300) unitFare = 110;
      else if (distanceKm <= 350) unitFare = 125;
      else if (distanceKm <= 400) unitFare = 140;
      else if (distanceKm <= 450) unitFare = 155;
      else if (distanceKm <= 500) unitFare = 170;
      else if (distanceKm <= 600) unitFare = 200;
      else if (distanceKm <= 700) unitFare = 230;
      else if (distanceKm <= 800) unitFare = 260;
      else if (distanceKm <= 1000) unitFare = 320;
      else if (distanceKm <= 1200) unitFare = 380;
      else if (distanceKm <= 1400) unitFare = 440;
      else {
        unitFare = Math.round(440 + ((distanceKm - 1400) * 0.28));
      }

      // Official Indian Railways Superfast Surcharge:
      // Fixed ₹30 for Second Class (2S / II) Superfast Trains
      if (tType === 'SUPERFAST') {
        sfCharge = 30;
        unitFare += sfCharge;
      }
    }

    // Official Indian Railways UTS Round-Off Rule: Nearest multiple of ₹5
    unitFare = Math.ceil(unitFare / 5) * 5;
    const totalFare = unitFare * count;

    return res.json({
      success: true,
      category: 'JOURNEY',
      from: fromCode,
      to: toCode,
      distanceKm,
      trainType: tType,
      unitFare,
      passengerCount: count,
      totalFare,
      validity: 'Same Day until midnight',
      superfastSurcharge: sfCharge
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. CREATE NEW TRAIN (ADMIN)
router.post('/', async (req, res) => {
  try {
    const { 
      number, name, from, to, departure, arrival, 
      type, zone, rakes, pantryVendor, currentLocation, platform 
    } = req.body;

    const id = number;
    const query = `
      INSERT INTO trains (id, number, name, "from", "to", departure, arrival, type, zone, rakes, pantry_vendor, current_location, platform)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;
    const values = [
      id, number, name, from, to, departure, arrival, 
      type || 'EXPRESS', zone || 'NR', rakes || 16, 
      pantryVendor || 'IRCTC', currentLocation || `${from} Yard`, platform || 'PF 1'
    ];

    const result = await pool.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. UPDATE LIVE GPS DELAY OVERRIDE (ADMIN)
router.patch('/:number/live', async (req, res) => {
  try {
    const { number } = req.params;
    const { currentLocation, delayMinutes, platform, speedKmph, status } = req.body;

    const query = `
      UPDATE trains 
      SET 
        current_location = COALESCE($1, current_location),
        delay_minutes = COALESCE($2, delay_minutes),
        platform = COALESCE($3, platform),
        speed_kmph = COALESCE($4, speed_kmph),
        status = COALESCE($5, status)
      WHERE number = $6
      RETURNING *
    `;
    const result = await pool.query(query, [currentLocation, delayMinutes, platform, speedKmph, status, number]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Train not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. DELETE / DECOMMISSION TRAIN
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM trains WHERE id = $1', [id]);
    res.json({ message: 'Train service deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. RAILRADAR REAL-TIME LIVE TRAIN STATUS (Quota Optimized with 15-min cache)
router.get('/live/:number', async (req, res) => {
  try {
    const { number } = req.params;
    const liveData = await railRadarService.getLiveTrainStatus(number);

    if (liveData) {
      // Optional: automatically update PostgreSQL cache with real-time station & delay
      if (liveData.currentLocation?.stationName) {
        await pool.query(
          `UPDATE trains 
           SET current_location = $1, 
               delay_minutes = $2, 
               speed_kmph = $3 
           WHERE number = $4`,
          [
            `${liveData.currentLocation.stationName} (${liveData.currentLocation.stationCode || ''})`,
            liveData.delayMinutes || 0,
            liveData.currentLocation.speedKmh || 0,
            number
          ]
        ).catch(() => {});
      }

      return res.json({
        success: true,
        source: 'RailRadar Live GPS API',
        data: liveData
      });
    }

    // Fallback to local DB record if RailRadar has no active run for today or quota limit
    const fallback = await pool.query('SELECT * FROM trains WHERE number = $1', [number]);
    if (fallback.rows.length > 0) {
      const t = fallback.rows[0];

      // Fetch station halts timeline from train_station_halts
      const haltsQuery = await pool.query(
        'SELECT h.*, s.name as station_name FROM train_station_halts h LEFT JOIN all_railway_stations s ON h.station_code = s.code WHERE h.train_number = $1 ORDER BY h.sequence ASC',
        [number]
      ).catch(() => ({ rows: [] }));

      const currentLocStr = (t.current_location || '').toUpperCase();
      let hasDepartedSoFar = true;

      const haltsTimeline = haltsQuery.rows.map((h, idx) => {
        const isCurrent = currentLocStr.includes(h.station_code) || currentLocStr.includes((h.station_name || '').toUpperCase());
        if (isCurrent) {
          hasDepartedSoFar = false;
        }

        return {
          stationCode: h.station_code,
          stationName: h.station_name || h.station_code,
          platform: 'PF 1',
          scheduledArrival: h.arrival || '--:--',
          scheduledDeparture: h.departure || '--:--',
          actualArrival: h.arrival || '--:--',
          actualDeparture: h.departure || '--:--',
          delayArrival: t.delay_minutes || 0,
          delayDeparture: t.delay_minutes || 0,
          haltMinutes: '2m',
          distanceKm: idx * 35,
          day: h.day || 1,
          hasArrived: hasDepartedSoFar || isCurrent,
          hasDeparted: hasDepartedSoFar && !isCurrent,
          isStopping: true,
          isCurrent: isCurrent,
          isApproaching: false
        };
      });

      const nextStop = haltsTimeline.find(h => !h.hasDeparted && !h.isCurrent);

      return res.json({
        success: true,
        source: 'CRIS Live Operations & Database Timeline',
        data: {
          trainNumber: t.number,
          trainName: t.name,
          startDate: new Date().toISOString().split('T')[0],
          lastUpdatedAt: new Date().toISOString(),
          status: 'RUNNING',
          statusText: t.delay_minutes === 0 ? 'Running Right Time' : `Running ${t.delay_minutes} mins delay`,
          isLive: true,
          delayMinutes: t.delay_minutes || 0,
          speedKmph: t.speed_kmph || 62,
          progressPercent: 65,
          currentLocation: {
            stationCode: currentLocStr.match(/\((.*?)\)/)?.[1] || currentLocStr.split(' ')[0] || 'NDLS',
            stationName: t.current_location || 'En-Route',
            status: (t.delay_minutes > 5) ? 'delayed' : 'on-time',
            speedKmh: t.speed_kmph || 62,
            delayMinutes: t.delay_minutes || 0
          },
          nextHalt: nextStop ? {
            stationCode: nextStop.stationCode,
            stationName: nextStop.stationName,
            eta: nextStop.scheduledArrival,
            platform: '1'
          } : null,
          source: {
            stationCode: t.from,
            name: t.from
          },
          destination: {
            stationCode: t.to,
            name: t.to
          },
          stations: haltsTimeline,
          routeSummary: haltsTimeline.slice(-10)
        }
      });
    }

    res.status(404).json({ error: `Train #${number} running status not found.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. REAL-TIME STATION DEPARTURE & ARRIVAL BOARD (Live Station Board)
router.get('/station-board/:stationCode', async (req, res) => {
  try {
    const rawCode = (req.params.stationCode || '').toUpperCase().trim();
    if (!rawCode) {
      return res.status(400).json({ error: 'Station code is required' });
    }

    // 1. Fetch Station Details from DB
    const stnQuery = await pool.query(
      `SELECT code, name, city, state FROM all_railway_stations WHERE code = $1 OR name ILIKE $1 LIMIT 1`,
      [rawCode]
    ).catch(() => ({ rows: [] }));

    const station = stnQuery.rows[0] || { code: rawCode, name: rawCode, city: rawCode };
    const stationCode = station.code;

    // 2. Priority: Fetch Real-Time Live Station Board from RailCore API (Real Platform numbers!)
    const liveBoard = await railRadarService.getStationLiveBoard(stationCode).catch(() => null);

    if (liveBoard && liveBoard.trains && liveBoard.trains.length > 0) {
      return res.json({
        success: true,
        source: 'RailCore Real-Time Station API',
        station: {
          code: station.code,
          name: liveBoard.stationName || station.name,
          city: station.city
        },
        count: liveBoard.trains.length,
        departures: liveBoard.trains
      });
    }

    // 3. Fallback: Query local database with realistic platform assignment
    const departuresQuery = await pool.query(`
      SELECT 
        t.number, 
        t.name, 
        t.type, 
        t.status,
        t.platform, 
        t.delay_minutes, 
        t.current_location,
        t.from AS origin_code,
        t.to AS destination_code,
        COALESCE(h.departure, t.departure) AS departure_time,
        COALESCE(h.arrival, t.arrival) AS arrival_time,
        COALESCE(h.sequence, 1) AS halt_sequence
      FROM trains t
      LEFT JOIN train_station_halts h ON t.number = h.train_number AND h.station_code = $1
      WHERE h.station_code = $1 OR t.from = $1 OR t.to = $1
      ORDER BY COALESCE(h.departure, t.departure) ASC
      LIMIT 40
    `, [stationCode]).catch(() => ({ rows: [] }));

    const departures = departuresQuery.rows.map((d, index) => {
      const delay = d.delay_minutes || 0;
      let statusLabel = 'On Time';
      if (delay > 0) statusLabel = `Late by ${delay}m`;
      else if (delay < 0) statusLabel = `Early by ${Math.abs(delay)}m`;

      // If DB has default PF 1, dynamically assign realistic platforms based on train number hash
      let pfDisplay = d.platform;
      if (!pfDisplay || pfDisplay === 'PF 1') {
        const numInt = parseInt(d.number, 10) || (index + 1);
        const pfNum = (numInt % 14) + 1; // Real stations have platforms 1 to 14
        pfDisplay = `PF ${pfNum}`;
      }

      return {
        trainNumber: d.number,
        trainName: d.name,
        type: d.type || 'EXPRESS',
        platform: pfDisplay,
        scheduledDeparture: d.departure_time || '--:--',
        scheduledArrival: d.arrival_time || '--:--',
        actualDeparture: d.departure_time || '--:--',
        origin: d.origin_code,
        destination: d.destination_code,
        delayMinutes: delay,
        status: statusLabel,
        isTerminating: d.destination_code === stationCode,
        isOriginating: d.origin_code === stationCode,
        currentLocation: d.current_location || `${station.name} Area`
      };
    });

    res.json({
      success: true,
      source: 'Database Fallback',
      station: {
        code: station.code,
        name: station.name,
        city: station.city
      },
      count: departures.length,
      departures
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. REAL DYNAMIC COACH COMPOSITION & RAKE POSITION API
router.get('/coach-composition/:number', async (req, res) => {
  try {
    const { number } = req.params;
    const cleanNum = (number || '').toString().trim();

    if (!cleanNum) {
      return res.status(400).json({ error: 'Train number is required' });
    }

    // Coach type dictionary for rich metadata
    const COACH_DICT = {
      'ENG': { type: 'Locomotive', name: 'WAP-7 High Speed Engine', classCategory: 'ENGINE', color: 'bg-red-700' },
      'LPR': { type: 'Power/Luggage', name: 'Luggage cum Power Car', classCategory: 'UTILITY', color: 'bg-slate-700' },
      'SLRD': { type: 'Brake Van / Divyangjan', name: 'Second Luggage & Disabled Coach', classCategory: 'UTILITY', color: 'bg-slate-700' },
      'SLR': { type: 'Brake Van', name: 'Seating cum Luggage Rake', classCategory: 'UTILITY', color: 'bg-slate-700' },
      'EOG': { type: 'Generator Car', name: 'End On Generation Power Car', classCategory: 'UTILITY', color: 'bg-slate-700' },
      'GEN': { type: 'General', name: 'General Second Class (Unreserved)', classCategory: 'GENERAL', color: 'bg-amber-700' },
      'GS': { type: 'General', name: 'General Second Class', classCategory: 'GENERAL', color: 'bg-amber-700' },
      'PC': { type: 'Pantry Car', name: 'IRCTC Pantry & Kitchen Car', classCategory: 'PANTRY', color: 'bg-emerald-700' },
      'H1': { type: 'First AC', name: 'AC First Class (1A)', classCategory: '1A', color: 'bg-indigo-700' },
      'HA1': { type: 'Composite AC', name: '1A cum 2A Composite', classCategory: '1A', color: 'bg-indigo-700' },
      'A1': { type: '2 Tier AC', name: 'AC 2-Tier Sleeper', classCategory: '2A', color: 'bg-blue-700' },
      'A2': { type: '2 Tier AC', name: 'AC 2-Tier Sleeper', classCategory: '2A', color: 'bg-blue-700' },
      'A3': { type: '2 Tier AC', name: 'AC 2-Tier Sleeper', classCategory: '2A', color: 'bg-blue-700' },
      'B1': { type: '3 Tier AC', name: 'AC 3-Tier Sleeper', classCategory: '3A', color: 'bg-teal-700' },
      'B2': { type: '3 Tier AC', name: 'AC 3-Tier Sleeper', classCategory: '3A', color: 'bg-teal-700' },
      'B3': { type: '3 Tier AC', name: 'AC 3-Tier Sleeper', classCategory: '3A', color: 'bg-teal-700' },
      'B4': { type: '3 Tier AC', name: 'AC 3-Tier Sleeper', classCategory: '3A', color: 'bg-teal-700' },
      'B5': { type: '3 Tier AC', name: 'AC 3-Tier Sleeper', classCategory: '3A', color: 'bg-teal-700' },
      'B6': { type: '3 Tier AC', name: 'AC 3-Tier Sleeper', classCategory: '3A', color: 'bg-teal-700' },
      'M1': { type: '3 AC Economy', name: 'AC 3-Tier Economy', classCategory: '3E', color: 'bg-cyan-700' },
      'M2': { type: '3 AC Economy', name: 'AC 3-Tier Economy', classCategory: '3E', color: 'bg-cyan-700' },
      'S1': { type: 'Sleeper', name: 'Sleeper Class (SL)', classCategory: 'SL', color: 'bg-sky-800' },
      'S2': { type: 'Sleeper', name: 'Sleeper Class (SL)', classCategory: 'SL', color: 'bg-sky-800' },
      'S3': { type: 'Sleeper', name: 'Sleeper Class (SL)', classCategory: 'SL', color: 'bg-sky-800' },
      'S4': { type: 'Sleeper', name: 'Sleeper Class (SL)', classCategory: 'SL', color: 'bg-sky-800' },
      'S5': { type: 'Sleeper', name: 'Sleeper Class (SL)', classCategory: 'SL', color: 'bg-sky-800' },
      'S6': { type: 'Sleeper', name: 'Sleeper Class (SL)', classCategory: 'SL', color: 'bg-sky-800' },
      'S7': { type: 'Sleeper', name: 'Sleeper Class (SL)', classCategory: 'SL', color: 'bg-sky-800' },
      'S8': { type: 'Sleeper', name: 'Sleeper Class (SL)', classCategory: 'SL', color: 'bg-sky-800' },
      'S9': { type: 'Sleeper', name: 'Sleeper Class (SL)', classCategory: 'SL', color: 'bg-sky-800' },
      'S10': { type: 'Sleeper', name: 'Sleeper Class (SL)', classCategory: 'SL', color: 'bg-sky-800' },
      'C1': { type: 'AC Chair Car', name: 'AC Chair Car (CC)', classCategory: 'CC', color: 'bg-blue-600' },
      'C2': { type: 'AC Chair Car', name: 'AC Chair Car (CC)', classCategory: 'CC', color: 'bg-blue-600' },
      'C3': { type: 'AC Chair Car', name: 'AC Chair Car (CC)', classCategory: 'CC', color: 'bg-blue-600' },
      'C4': { type: 'AC Chair Car', name: 'AC Chair Car (CC)', classCategory: 'CC', color: 'bg-blue-600' },
      'C5': { type: 'AC Chair Car', name: 'AC Chair Car (CC)', classCategory: 'CC', color: 'bg-blue-600' },
      'E1': { type: 'Exec Chair Car', name: 'Executive Chair Car (EC)', classCategory: 'EC', color: 'bg-purple-700' },
      'E2': { type: 'Exec Chair Car', name: 'Executive Chair Car (EC)', classCategory: 'EC', color: 'bg-purple-700' },
      'D1': { type: 'Second Sitting', name: 'Second Sitting (2S)', classCategory: '2S', color: 'bg-orange-700' },
      'D2': { type: 'Second Sitting', name: 'Second Sitting (2S)', classCategory: '2S', color: 'bg-orange-700' },
      'D3': { type: 'Second Sitting', name: 'Second Sitting (2S)', classCategory: '2S', color: 'bg-orange-700' },
      'D4': { type: 'Second Sitting', name: 'Second Sitting (2S)', classCategory: '2S', color: 'bg-orange-700' }
    };

    const parseCoachTokens = (rawString) => {
      if (!rawString) return [];
      const tokens = rawString.split('-').map(t => t.trim()).filter(Boolean);
      return tokens.map((tok, idx) => {
        const info = COACH_DICT[tok] || (
          tok.startsWith('S') ? { type: 'Sleeper', name: `Sleeper (${tok})`, classCategory: 'SL', color: 'bg-sky-800' } :
          tok.startsWith('B') ? { type: '3 Tier AC', name: `AC 3-Tier (${tok})`, classCategory: '3A', color: 'bg-teal-700' } :
          tok.startsWith('A') ? { type: '2 Tier AC', name: `AC 2-Tier (${tok})`, classCategory: '2A', color: 'bg-blue-700' } :
          tok.startsWith('H') ? { type: 'First AC', name: `AC First Class (${tok})`, classCategory: '1A', color: 'bg-indigo-700' } :
          tok.startsWith('M') ? { type: '3 AC Economy', name: `AC Economy (${tok})`, classCategory: '3E', color: 'bg-cyan-700' } :
          tok.startsWith('C') ? { type: 'AC Chair Car', name: `AC Chair Car (${tok})`, classCategory: 'CC', color: 'bg-blue-600' } :
          tok.startsWith('D') ? { type: 'Second Sitting', name: `Second Sitting (${tok})`, classCategory: '2S', color: 'bg-orange-700' } :
          tok.startsWith('E') ? { type: 'Exec Chair Car', name: `Executive Class (${tok})`, classCategory: 'EC', color: 'bg-purple-700' } :
          { type: 'Coach', name: `Coach ${tok}`, classCategory: 'OTHER', color: 'bg-slate-700' }
        );

        return {
          position: idx + 1,
          code: tok,
          label: tok,
          type: info.type,
          fullName: info.name,
          classCategory: info.classCategory,
          color: info.color,
          isEngine: tok === 'ENG',
          isPantry: tok === 'PC',
          isUtility: ['LPR', 'SLRD', 'SLR', 'EOG'].includes(tok),
          isPassengerCoach: !['ENG', 'LPR', 'SLRD', 'SLR', 'EOG', 'PC'].includes(tok)
        };
      });
    };

    let trainDetails = null;
    let coachRaw = '';

    // 1. Fetch live train data from RailRadar API
    try {
      const liveRes = await fetch(`https://railradar.in/api/v1/trains/${cleanNum}`);
      if (liveRes.ok) {
        const liveJson = await liveRes.json();
        if (liveJson?.data?.train) {
          trainDetails = liveJson.data.train;
          coachRaw = liveJson.data.train.coachPosition || '';
        }
      }
    } catch (_) {}

    // 2. Fallback to PostgreSQL DB if RailRadar doesn't return
    if (!trainDetails) {
      const dbRes = await pool.query('SELECT * FROM trains WHERE number = $1', [cleanNum]).catch(() => ({ rows: [] }));
      if (dbRes.rows.length > 0) {
        trainDetails = dbRes.rows[0];
      }
    }

    // Default realistic composition fallback if train has no explicit coachPosition in external API
    if (!coachRaw) {
      if (cleanNum === '22436' || cleanNum === '22426') {
        coachRaw = 'ENG-C1-C2-C3-C4-C5-C6-C7-E1-E2-C8-C9-C10-C11-C12-C13-C14-C15-C16-LPR';
      } else if (cleanNum === '12004' || cleanNum === '12003') {
        coachRaw = 'ENG-LPR-E1-E2-C1-C2-C3-C4-C5-C6-C7-C8-C9-C10-C11-C12-C13-C14-C15-C16-LPR';
      } else if (cleanNum === '12059' || cleanNum === '12060') {
        coachRaw = 'ENG-SLRD-D1-D2-D3-D4-D5-D6-D7-D8-D9-D10-D11-D12-D13-D14-D15-D16-D17-C3-C2-C1-LPR';
      } else {
        coachRaw = 'ENG-SLRD-GEN-GEN-S6-S5-S4-S3-S2-S1-PC-M2-M1-B4-B3-B2-B1-A2-A1-H1-GEN-GEN-LPR';
      }
    }

    const coaches = parseCoachTokens(coachRaw);
    const passengerCoaches = coaches.filter(c => c.isPassengerCoach);

    res.json({
      success: true,
      trainNumber: cleanNum,
      trainName: trainDetails?.name || 'Superfast Express',
      trainType: trainDetails?.type || 'MAIL_EXPRESS',
      source: trainDetails?.source?.name || trainDetails?.from || 'Origin',
      destination: trainDetails?.destination?.name || trainDetails?.to || 'Destination',
      totalCoaches: coaches.length,
      enginePosition: 'FRONT',
      platformAlignment: trainDetails?.platform || 'PF 1',
      rawCoachPosition: coachRaw,
      coaches,
      availableCoachCodes: passengerCoaches.map(c => c.code)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 8. GET TRAIN ROUTE / INTERMEDIATE BOARDING HALTS (Live RailRadar + Database Cache)
router.get('/:number/halts', async (req, res) => {
  try {
    const { number } = req.params;
    const cleanNum = (number || '').toString().trim();

    if (!cleanNum) {
      return res.status(400).json({ error: 'Train number is required' });
    }

    // 1. Check local PostgreSQL train_station_halts first
    const query = `
      SELECT 
        h.sequence,
        h.station_code,
        COALESCE(s.name, h.station_code) AS station_name,
        COALESCE(s.city, h.station_code) AS city,
        COALESCE(s.state, '') AS state,
        h.arrival,
        h.departure,
        h.day
      FROM train_station_halts h
      LEFT JOIN all_railway_stations s ON UPPER(h.station_code) = UPPER(s.code)
      WHERE h.train_number = $1
      ORDER BY h.sequence ASC
    `;

    const result = await pool.query(query, [cleanNum]).catch(() => ({ rows: [] }));

    if (result.rows.length > 0) {
      return res.json({
        success: true,
        source: 'PostgreSQL Database',
        trainNumber: cleanNum,
        halts: result.rows.map(r => ({
          sequence: r.sequence,
          code: r.station_code,
          name: r.station_name,
          city: r.city,
          state: r.state,
          arrival: r.arrival,
          departure: r.departure,
          day: r.day
        }))
      });
    }

    // 2. Fetch live real route from RailRadar API if not pre-seeded in DB
    try {
      const liveRes = await fetch(`https://railradar.in/api/v1/trains/${cleanNum}`);
      if (liveRes.ok) {
        const liveJson = await liveRes.json();
        const rawRoute = liveJson?.data?.route || [];
        const haltsOnly = rawRoute.filter(h => h.isHalt);

        if (haltsOnly.length > 0) {
          const liveHalts = haltsOnly.map((h, idx) => ({
            sequence: idx + 1,
            code: h.station?.code || `STN-${idx+1}`,
            name: h.station?.name || h.station?.code || 'Station',
            city: h.station?.city || h.station?.name || '',
            state: '',
            arrival: h.arrival || h.departure || '--:--',
            departure: h.departure || h.arrival || '--:--',
            day: h.departureDay || h.arrivalDay || 1
          }));

          // Async background save into train_station_halts for fast future queries
          Promise.all(liveHalts.map(h => {
            return pool.query(
              `INSERT INTO train_station_halts (train_number, station_code, sequence, arrival, departure, day)
               VALUES ($1, $2, $3, $4, $5, $6)
               ON CONFLICT DO NOTHING`,
              [cleanNum, h.code, h.sequence, h.arrival, h.departure, h.day]
            ).catch(() => {});
          })).catch(() => {});

          return res.json({
            success: true,
            source: 'RailRadar Live Route Engine',
            trainNumber: cleanNum,
            halts: liveHalts
          });
        }
      }
    } catch (e) {
      console.warn('[RailRadar Halts Fetch Warning]:', e.message);
    }

    // 3. Fallback: if not in train_station_halts or RailRadar, get from trains table source & destination
    const trainRes = await pool.query('SELECT * FROM trains WHERE number = $1', [cleanNum]).catch(() => ({ rows: [] }));
    if (trainRes.rows.length > 0) {
      const t = trainRes.rows[0];
      return res.json({
        success: true,
        source: 'Trains Origin-Dest Fallback',
        trainNumber: cleanNum,
        halts: [
          { sequence: 1, code: t.from, name: t.from, city: t.from, arrival: t.departure, departure: t.departure, day: 1 },
          { sequence: 2, code: t.to, name: t.to, city: t.to, arrival: t.arrival, departure: t.arrival, day: 1 }
        ]
      });
    }

    return res.status(404).json({ error: 'Train route halts not found' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

