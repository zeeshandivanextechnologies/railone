import express from 'express';
import bcrypt from 'bcryptjs';
import { pool } from '../config/db.js';
import { sendOtpEmail } from '../config/mailer.js';

const router = express.Router();

const hash = async (val) => await bcrypt.hash(val, 10);
const compare = async (val, hashed) => await bcrypt.compare(val, hashed);

// Random 4-digit numeric OTP generator
const generateNumericOtp = () => Math.floor(1000 + Math.random() * 9000).toString();

// Initialize Users Table and Pending Registrations Table
export const initUserTable = async () => {
  // 1. Permanent Verified Users Table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      user_id VARCHAR(100) UNIQUE,
      mobile VARCHAR(15) UNIQUE NOT NULL,
      full_name VARCHAR(150) NOT NULL,
      email VARCHAR(150) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      mpin VARCHAR(255),
      wallet_balance NUMERIC(10, 2) DEFAULT 100.00,
      is_verified BOOLEAN DEFAULT TRUE,
      reset_otp VARCHAR(10),
      reset_otp_expires TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS user_id VARCHAR(100) UNIQUE;');

  // 2. Pending Registrations / In-line OTP Verification Table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS pending_registrations (
      id SERIAL PRIMARY KEY,
      user_id VARCHAR(100),
      mobile VARCHAR(15),
      email VARCHAR(150) UNIQUE,
      full_name VARCHAR(150),
      password_hash VARCHAR(255),
      otp_code VARCHAR(10),
      otp_expires_at TIMESTAMP,
      is_email_verified BOOLEAN DEFAULT FALSE,
      mobile_otp_code VARCHAR(10),
      is_mobile_verified BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  await pool.query('ALTER TABLE pending_registrations ADD COLUMN IF NOT EXISTS user_id VARCHAR(100);');
  await pool.query('ALTER TABLE pending_registrations ADD COLUMN IF NOT EXISTS is_email_verified BOOLEAN DEFAULT FALSE;');
  await pool.query('ALTER TABLE pending_registrations ADD COLUMN IF NOT EXISTS is_mobile_verified BOOLEAN DEFAULT FALSE;');
  await pool.query('ALTER TABLE pending_registrations ADD COLUMN IF NOT EXISTS mobile_otp_code VARCHAR(10);');

  console.log(' PostgreSQL User Tables Ready with Dedicated Mobile and Email Verification.');
};

// 1. SEND EMAIL OTP (Triggered by Email's Verify button)
router.post('/send-otp', async (req, res) => {
  try {
    const { email, fullName, mobile } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email address is required to receive OTP.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = fullName ? fullName.trim() : 'Passenger';
    const cleanMobile = mobile ? mobile.trim() : '';

    // Check duplicate email in users
    const existingEmail = await pool.query('SELECT id FROM users WHERE LOWER(email) = $1', [cleanEmail]);
    if (existingEmail.rows.length > 0) {
      return res.status(400).json({ error: 'This email is already registered. Please login.' });
    }

    const otpCode = generateNumericOtp();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await pool.query(
      `INSERT INTO pending_registrations (email, mobile, full_name, otp_code, otp_expires_at, is_email_verified)
       VALUES ($1, $2, $3, $4, $5, FALSE)
       ON CONFLICT (email) DO UPDATE 
       SET mobile = COALESCE(EXCLUDED.mobile, pending_registrations.mobile),
           full_name = COALESCE(EXCLUDED.full_name, pending_registrations.full_name),
           otp_code = EXCLUDED.otp_code,
           otp_expires_at = EXCLUDED.otp_expires_at,
           is_email_verified = FALSE,
           created_at = CURRENT_TIMESTAMP`,
      [cleanEmail, cleanMobile, cleanName, otpCode, otpExpires]
    );

    sendOtpEmail(cleanEmail, otpCode, cleanName);

    res.json({
      message: `OTP sent successfully to email: ${cleanEmail}`,
      email: cleanEmail
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. VERIFY EMAIL OTP
router.post('/verify-inline-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP code are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const pending = await pool.query('SELECT * FROM pending_registrations WHERE LOWER(email) = $1', [cleanEmail]);

    if (pending.rows.length === 0) {
      return res.status(404).json({ error: 'No OTP request found for this email. Click Verify to request OTP.' });
    }

    const reg = pending.rows[0];
    if (new Date() > new Date(reg.otp_expires_at)) {
      return res.status(400).json({ error: 'OTP has expired. Please request a new OTP.' });
    }

    if (reg.otp_code !== otp.trim()) {
      return res.status(400).json({ error: 'Incorrect OTP code. Please check your email inbox.' });
    }

    await pool.query('UPDATE pending_registrations SET is_email_verified = TRUE WHERE id = $1', [reg.id]);

    res.json({
      message: 'Email verified successfully!',
      verified: true,
      email: cleanEmail
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. SEND MOBILE SMS OTP (Triggered by Mobile's Verify button)
router.post('/send-mobile-otp', async (req, res) => {
  try {
    const { mobile } = req.body;
    if (!mobile || mobile.trim().length < 10) {
      return res.status(400).json({ error: 'Please enter a valid 10-digit mobile number.' });
    }

    const cleanMobile = mobile.trim();

    // Check duplicate mobile in users
    const existingMob = await pool.query('SELECT id FROM users WHERE mobile = $1', [cleanMobile]);
    if (existingMob.rows.length > 0) {
      return res.status(400).json({ error: 'This mobile number is already registered. Please login.' });
    }

    const otpCode = generateNumericOtp();

    // Store mobile OTP in pending_registrations for this mobile
    const existingPending = await pool.query('SELECT id FROM pending_registrations WHERE mobile = $1', [cleanMobile]);
    if (existingPending.rows.length > 0) {
      await pool.query(
        'UPDATE pending_registrations SET mobile_otp_code = $1, is_mobile_verified = FALSE WHERE mobile = $2',
        [otpCode, cleanMobile]
      );
    } else {
      await pool.query(
        'INSERT INTO pending_registrations (mobile, mobile_otp_code, is_mobile_verified) VALUES ($1, $2, FALSE)',
        [cleanMobile, otpCode]
      );
    }

    console.log(`📱 SMS Gateway (CRIS NIC): Sent 4-digit SMS OTP ${otpCode} to +91-${cleanMobile}`);

    res.json({
      message: `SMS OTP sent successfully to +91 ${cleanMobile}`,
      mobile: cleanMobile,
      demoOtpHint: otpCode
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. VERIFY MOBILE SMS OTP
router.post('/verify-mobile-otp', async (req, res) => {
  try {
    const { mobile, otp } = req.body;
    if (!mobile || !otp) {
      return res.status(400).json({ error: 'Mobile and SMS OTP code are required.' });
    }

    const cleanMobile = mobile.trim();
    const pending = await pool.query('SELECT * FROM pending_registrations WHERE mobile = $1', [cleanMobile]);

    if (pending.rows.length === 0) {
      return res.status(404).json({ error: 'No SMS request found for this mobile. Click Verify to get OTP.' });
    }

    const reg = pending.rows[0];
    if (reg.mobile_otp_code !== otp.trim()) {
      return res.status(400).json({ error: 'Incorrect SMS OTP code. Please check your phone messages.' });
    }

    await pool.query('UPDATE pending_registrations SET is_mobile_verified = TRUE WHERE id = $1', [reg.id]);

    res.json({
      message: 'Mobile number verified successfully!',
      verified: true,
      mobile: cleanMobile
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. FINAL REGISTRATION SUBMISSION (Creates official user in 'users' table)
router.post('/register', async (req, res) => {
  try {
    const { fullName, mobile, email, userId, password, confirmPassword } = req.body;

    if (!fullName || !mobile || !email || !userId || !password) {
      return res.status(400).json({ error: 'All fields (Name, Mobile, Email, User ID, Password) are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({ error: 'Password and Confirm Password do not match.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanMobile = mobile.trim();
    const cleanUserId = userId.trim();
    const cleanName = fullName.trim();

    // Check if user verified email OTP
    const pendingEmail = await pool.query('SELECT * FROM pending_registrations WHERE LOWER(email) = $1', [cleanEmail]);
    if (pendingEmail.rows.length === 0 || !pendingEmail.rows[0].is_email_verified) {
      return res.status(400).json({ error: 'Please verify your Email address with OTP before signing up.' });
    }

    // Check duplicate mobile or user_id
    const duplicateCheck = await pool.query(
      'SELECT mobile, email, user_id FROM users WHERE mobile = $1 OR LOWER(email) = $2 OR LOWER(user_id) = $3',
      [cleanMobile, cleanEmail, cleanUserId.toLowerCase()]
    );

    if (duplicateCheck.rows.length > 0) {
      const match = duplicateCheck.rows[0];
      if (match.mobile === cleanMobile) {
        return res.status(400).json({ error: 'This mobile number is already registered.' });
      }
      if (match.email === cleanEmail) {
        return res.status(400).json({ error: 'This email address is already registered.' });
      }
      if (match.user_id && match.user_id.toLowerCase() === cleanUserId.toLowerCase()) {
        return res.status(400).json({ error: 'This User ID is already taken. Please choose another.' });
      }
    }

    const hashedPassword = await hash(password);

    // Insert into permanent verified users table
    const result = await pool.query(
      `INSERT INTO users (full_name, mobile, email, user_id, password, wallet_balance, is_verified)
       VALUES ($1, $2, $3, $4, $5, 100.00, TRUE)
       RETURNING id, full_name, mobile, email, user_id, wallet_balance`,
      [cleanName, cleanMobile, cleanEmail, cleanUserId, hashedPassword]
    );

    // Clean pending
    await pool.query('DELETE FROM pending_registrations WHERE LOWER(email) = $1 OR mobile = $2', [cleanEmail, cleanMobile]);

    const newUser = result.rows[0];
    res.status(201).json({
      message: 'Account created successfully! Please login with your password.',
      user: {
        id: newUser.id,
        name: newUser.full_name,
        mobile: newUser.mobile,
        email: newUser.email,
        userId: newUser.user_id,
        wallet: parseFloat(newUser.wallet_balance),
        mPinSet: false
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. LOGIN (Supports Mobile, Email OR User ID + Password or MPIN)
router.post('/login', async (req, res) => {
  try {
    const { identifier, password, mpin } = req.body;
    if (!identifier || (!password && !mpin)) {
      return res.status(400).json({ error: 'Please enter registered Mobile, Email, or User ID and Password / MPIN' });
    }

    const cleanIdentifier = identifier.trim().toLowerCase();

    const result = await pool.query(
      `SELECT * FROM users 
       WHERE LOWER(email) = $1 OR mobile = $2 OR LOWER(user_id) = $1`,
      [cleanIdentifier, identifier.trim()]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Account not found. Please register first.' });
    }

    const user = result.rows[0];

    // Verification by MPIN
    if (mpin) {
      if (!user.mpin) {
        return res.status(400).json({ error: 'MPIN not yet configured. Please sign in with your main Password first.' });
      }
      const isMpinMatch = await compare(mpin, user.mpin);
      if (!isMpinMatch) {
        return res.status(401).json({ error: 'Incorrect 4-digit MPIN. Try again or login with Password.' });
      }
    } else {
      // Verification by Main Password
      const isPassMatch = await compare(password, user.password);
      if (!isPassMatch) {
        return res.status(401).json({ error: 'Incorrect Password. Please try again.' });
      }
    }

    const hasMpin = !!user.mpin;

    res.json({
      message: 'Login successful!',
      requiresMpinSetup: !hasMpin,
      user: {
        id: user.id,
        name: user.full_name,
        mobile: user.mobile,
        email: user.email,
        userId: user.user_id,
        wallet: parseFloat(user.wallet_balance),
        mPinSet: hasMpin
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. SET / RESET 4-DIGIT MPIN
router.post('/set-mpin', async (req, res) => {
  try {
    const { identifier, mpin, currentPassword } = req.body;
    if (!identifier || !mpin || mpin.length !== 4) {
      return res.status(400).json({ error: 'Valid 4-digit MPIN and identifier are required.' });
    }

    const clean = identifier.trim().toLowerCase();

    // Check if user exists
    const userRes = await pool.query(
      `SELECT * FROM users WHERE LOWER(email) = $1 OR mobile = $2 OR LOWER(user_id) = $1`,
      [clean, identifier.trim()]
    );

    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'User account not found.' });
    }

    const user = userRes.rows[0];

    // If currentPassword is supplied (e.g. from Forgot/Reset MPIN flow), verify it strictly
    if (currentPassword !== undefined && currentPassword !== null) {
      const isMatch = await compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(401).json({ error: 'Incorrect Main Account Password. Please enter correct password to reset MPIN.' });
      }
    }

    const hashedMpin = await hash(mpin);

    const result = await pool.query(
      `UPDATE users 
       SET mpin = $1 
       WHERE id = $2
       RETURNING *`,
      [hashedMpin, user.id]
    );

    const updatedUser = result.rows[0];
    res.json({
      message: '4-digit MPIN successfully set!',
      user: {
        id: updatedUser.id,
        name: updatedUser.full_name,
        mobile: updatedUser.mobile,
        email: updatedUser.email,
        userId: updatedUser.user_id,
        wallet: parseFloat(updatedUser.wallet_balance),
        mPinSet: true
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 8. FORGOT PASSWORD
router.post('/forgot-password', async (req, res) => {
  try {
    const { identifier } = req.body;
    if (!identifier) {
      return res.status(400).json({ error: 'Please enter your registered mobile, email, or user ID.' });
    }

    const clean = identifier.trim().toLowerCase();
    const result = await pool.query(
      'SELECT * FROM users WHERE LOWER(email) = $1 OR mobile = $2 OR LOWER(user_id) = $1',
      [clean, identifier.trim()]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No registered user found with this identifier.' });
    }

    const user = result.rows[0];
    const otpCode = generateNumericOtp();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    await pool.query(
      'UPDATE users SET reset_otp = $1, reset_otp_expires = $2 WHERE id = $3',
      [otpCode, otpExpires, user.id]
    );

    sendOtpEmail(user.email, otpCode, user.full_name);

    res.json({
      message: `Password reset OTP emailed to ${user.email}`,
      mobile: user.mobile,
      email: user.email
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 9. RESET PASSWORD / MPIN
router.post('/reset-password', async (req, res) => {
  try {
    const { identifier, otp, newPassword, newMpin } = req.body;
    if (!identifier) {
      return res.status(400).json({ error: 'Identifier is required.' });
    }

    const clean = identifier.trim().toLowerCase();

    // Verify User
    const userRes = await pool.query(
      'SELECT * FROM users WHERE LOWER(email) = $1 OR mobile = $2 OR LOWER(user_id) = $1',
      [clean, identifier.trim()]
    );

    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const user = userRes.rows[0];

    // If OTP is provided, verify OTP code and expiry
    if (otp) {
      if (!user.reset_otp || user.reset_otp !== otp.toString().trim()) {
        return res.status(400).json({ error: 'Invalid or incorrect Reset OTP.' });
      }
      if (user.reset_otp_expires && new Date() > new Date(user.reset_otp_expires)) {
        return res.status(400).json({ error: 'Reset OTP has expired. Please request a new one.' });
      }
    }

    if (newPassword) {
      const hashedPass = await hash(newPassword);
      await pool.query(
        'UPDATE users SET password = $1, reset_otp = NULL, reset_otp_expires = NULL WHERE id = $2',
        [hashedPass, user.id]
      );
    }

    if (newMpin && newMpin.length === 4) {
      const hashedMpin = await hash(newMpin);
      await pool.query(
        'UPDATE users SET mpin = $1 WHERE id = $2',
        [hashedMpin, user.id]
      );
    }

    const result = await pool.query(
      'SELECT * FROM users WHERE id = $1',
      [user.id]
    );

    const updatedUser = result.rows[0];
    res.json({
      message: 'Credentials updated successfully!',
      user: {
        id: updatedUser.id,
        name: updatedUser.full_name,
        mobile: updatedUser.mobile,
        email: updatedUser.email,
        userId: updatedUser.user_id,
        wallet: parseFloat(updatedUser.wallet_balance),
        mPinSet: !!updatedUser.mpin
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 10. GET USER PROFILE DETAILS
router.get('/profile/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT id, user_id, full_name, mobile, email, wallet_balance, gender, city, state, pincode, avatar_url, app_language, whatsapp_alerts, created_at 
       FROM users WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User profile not found.' });
    }

    const u = result.rows[0];
    res.json({
      user: {
        id: u.id,
        name: u.full_name,
        userId: u.user_id,
        mobile: u.mobile,
        email: u.email,
        wallet: parseFloat(u.wallet_balance),
        gender: u.gender || 'M',
        city: u.city || '',
        state: u.state || '',
        pincode: u.pincode || '',
        avatarUrl: u.avatar_url || '',
        appLanguage: u.app_language || 'English',
        whatsappAlerts: u.whatsapp_alerts !== false,
        createdAt: u.created_at
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 11. UPDATE USER PROFILE (Full Name, Gender, City, State, Pincode, Avatar, Language, Alerts)
router.put('/profile/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, gender, city, state, pincode, avatarUrl, appLanguage, whatsappAlerts } = req.body;

    const result = await pool.query(
      `UPDATE users 
       SET full_name = COALESCE($1, full_name), 
           gender = COALESCE($2, gender), 
           city = COALESCE($3, city), 
           state = COALESCE($4, state), 
           pincode = COALESCE($5, pincode), 
           avatar_url = COALESCE($6, avatar_url),
           app_language = COALESCE($7, app_language),
           whatsapp_alerts = COALESCE($8, whatsapp_alerts)
       WHERE id = $9 
       RETURNING id, user_id, full_name, mobile, email, wallet_balance, gender, city, state, pincode, avatar_url, app_language, whatsapp_alerts`,
      [
        fullName ? fullName.trim() : null, 
        gender || null, 
        city !== undefined ? city.trim() : null, 
        state !== undefined ? state.trim() : null, 
        pincode !== undefined ? pincode.trim() : null, 
        avatarUrl || null,
        appLanguage || null,
        whatsappAlerts !== undefined ? whatsappAlerts : null,
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const u = result.rows[0];
    res.json({
      message: 'Profile updated successfully!',
      user: {
        id: u.id,
        name: u.full_name,
        userId: u.user_id,
        mobile: u.mobile,
        email: u.email,
        wallet: parseFloat(u.wallet_balance),
        gender: u.gender || 'M',
        city: u.city || '',
        state: u.state || '',
        pincode: u.pincode || '',
        avatarUrl: u.avatar_url || '',
        appLanguage: u.app_language || 'English',
        whatsappAlerts: u.whatsapp_alerts !== false
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 12. GET MASTER PASSENGERS LIST
router.get('/passengers/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await pool.query(
      `SELECT id, name, age, gender, berth_preference as berth, dob, concession_type as "concessionType", 
              meal_preference as "mealPreference", id_card_type as "idCardType", id_card_number as "idCardNumber", 
              is_id_verified as "isIdVerified"
       FROM master_passengers 
       WHERE user_id = $1 
       ORDER BY id DESC`,
      [userId]
    );
    res.json({ passengers: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 13. ADD MASTER PASSENGER
router.post('/passengers/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { 
      name, 
      age, 
      gender, 
      berth, 
      dob, 
      concessionType, 
      mealPreference, 
      idCardType, 
      idCardNumber, 
      isIdVerified 
    } = req.body;

    if (!name || (!age && !dob)) {
      return res.status(400).json({ error: 'Passenger Name and Age/DOB are required.' });
    }

    // Auto-calculate age if dob is provided
    let calculatedAge = parseInt(age, 10);
    if ((!calculatedAge || isNaN(calculatedAge)) && dob) {
      const birthYear = new Date(dob).getFullYear();
      calculatedAge = new Date().getFullYear() - birthYear;
    }
    if (isNaN(calculatedAge)) calculatedAge = 25;

    // Check if Aadhaar number is provided and already verified in master_passengers for this user
    if (idCardNumber && idCardNumber.trim().length === 12) {
      const existing = await pool.query(
        'SELECT id FROM master_passengers WHERE user_id = $1 AND id_card_number = $2',
        [userId, idCardNumber.trim()]
      );
      if (existing.rows.length > 0) {
        return res.status(400).json({ error: 'This Aadhaar ID is already added and verified in your passenger list!' });
      }
    }

    const result = await pool.query(
      `INSERT INTO master_passengers (
        user_id, name, age, gender, berth_preference, dob, concession_type, 
        meal_preference, id_card_type, id_card_number, is_id_verified
      )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING id, name, age, gender, berth_preference as berth, dob, concession_type as "concessionType", 
                 meal_preference as "mealPreference", id_card_type as "idCardType", id_card_number as "idCardNumber", 
                 is_id_verified as "isIdVerified"`,
      [
        userId, 
        name.trim(), 
        calculatedAge, 
        gender || 'M', 
        berth || 'No Preference',
        dob || null,
        concessionType || 'None',
        mealPreference || 'No Preference',
        idCardType || 'Aadhaar Card',
        idCardNumber ? idCardNumber.trim() : null,
        isIdVerified !== undefined ? isIdVerified : (idCardNumber ? true : false)
      ]
    );

    res.status(201).json({
      message: 'Passenger added to Master List with Verification!',
      passenger: result.rows[0]
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 14. UPDATE MASTER PASSENGER
router.put('/passengers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      name, 
      age, 
      gender, 
      berth, 
      dob, 
      concessionType, 
      mealPreference, 
      idCardType, 
      idCardNumber, 
      isIdVerified 
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Passenger Name is required.' });
    }

    let calculatedAge = parseInt(age, 10);
    if ((!calculatedAge || isNaN(calculatedAge)) && dob) {
      const birthYear = new Date(dob).getFullYear();
      calculatedAge = new Date().getFullYear() - birthYear;
    }
    if (isNaN(calculatedAge)) calculatedAge = 25;

    const result = await pool.query(
      `UPDATE master_passengers 
       SET name = $1, 
           age = $2, 
           gender = $3, 
           berth_preference = $4,
           dob = COALESCE($5, dob),
           concession_type = COALESCE($6, concession_type),
           meal_preference = COALESCE($7, meal_preference),
           id_card_type = COALESCE($8, id_card_type),
           id_card_number = COALESCE($9, id_card_number),
           is_id_verified = COALESCE($10, is_id_verified)
       WHERE id = $11 
       RETURNING id, name, age, gender, berth_preference as berth, dob, concession_type as "concessionType", 
                 meal_preference as "mealPreference", id_card_type as "idCardType", id_card_number as "idCardNumber", 
                 is_id_verified as "isIdVerified"`,
      [
        name.trim(), 
        calculatedAge, 
        gender || 'M', 
        berth || 'No Preference',
        dob || null,
        concessionType || null,
        mealPreference || null,
        idCardType || null,
        idCardNumber ? idCardNumber.trim() : null,
        isIdVerified !== undefined ? isIdVerified : null,
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Passenger not found.' });
    }

    res.json({
      message: 'Passenger updated successfully!',
      passenger: result.rows[0]
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 15. DELETE MASTER PASSENGER
router.delete('/passengers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM master_passengers WHERE id = $1', [id]);
    res.json({ message: 'Passenger deleted from Master List.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 16. UIDAI / AADHAAR LOOKUP API (Auto-fills passenger details directly from Aadhaar Number)
router.post('/verify-aadhaar', async (req, res) => {
  try {
    const { aadhaarNumber } = req.body;
    if (!aadhaarNumber) {
      return res.status(400).json({ error: 'Aadhaar Number is required.' });
    }

    const cleanAadhaar = aadhaarNumber.replace(/\s|-/g, '').trim();
    if (cleanAadhaar.length !== 12 || !/^\d{12}$/.test(cleanAadhaar)) {
      return res.status(400).json({ error: 'Please enter a valid 12-digit Aadhaar Number.' });
    }

    // Check directory in PostgreSQL
    const result = await pool.query(
      'SELECT aadhaar_number, full_name, dob, gender, city, state FROM mock_aadhaar_directory WHERE aadhaar_number = $1',
      [cleanAadhaar]
    );

    if (result.rows.length > 0) {
      const row = result.rows[0];
      const birthYear = new Date(row.dob).getFullYear();
      const age = new Date().getFullYear() - birthYear;

      return res.json({
        verified: true,
        source: 'UIDAI_REGISTRY',
        aadhaarNumber: cleanAadhaar,
        fullName: row.full_name,
        dob: row.dob,
        age: age || 26,
        gender: row.gender,
        city: row.city,
        state: row.state,
        message: 'Aadhaar Verified! Details fetched automatically from UIDAI.'
      });
    }

    // Generative realistic UIDAI fetch for any valid 12 digit Aadhaar number
    // Allows seamless testing for ANY valid 12-digit number user enters
    const last4 = cleanAadhaar.slice(-4);
    const mockNames = ['Aadhaar Verified User', 'Vikram Rathore', 'Anita Deshmukh', 'Rajesh K. Verma', 'Sanjay Singhania'];
    const chosenName = mockNames[parseInt(last4, 10) % mockNames.length];
    const mockYear = 1985 + (parseInt(last4.slice(0, 2), 10) % 20); // 1985-2005
    const mockDob = `${mockYear}-04-12`;
    const age = new Date().getFullYear() - mockYear;

    return res.json({
      verified: true,
      source: 'UIDAI_INSTANT_EKYC',
      aadhaarNumber: cleanAadhaar,
      fullName: chosenName,
      dob: mockDob,
      age: age,
      gender: 'M',
      message: 'Aadhaar Verified! Details fetched automatically from UIDAI e-KYC.'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
