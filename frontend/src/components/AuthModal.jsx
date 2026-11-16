import React, { useState } from 'react';
import { 
  Lock, 
  Smartphone, 
  ArrowRight, 
  ShieldCheck, 
  User, 
  KeyRound, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  ChevronLeft,
  Mail,
  AlertCircle,
  Sparkles,
  Phone,
  MessageSquare
} from 'lucide-react';

const API_AUTH = 'http://localhost:5000/api/auth';

export default function AuthModal({ initialMode = 'LOGIN', isOpen, onClose, onLoginSuccess }) {
  // Modes: LOGIN | REGISTER | SET_MPIN | FORGOT | RESET
  const [mode, setMode] = useState(initialMode);
  const [loginMethod, setLoginMethod] = useState('PASSWORD'); // 'PASSWORD' | 'MPIN'
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showMpin, setShowMpin] = useState(false);

  // Form Fields for Exact Official RailOne Registration:
  // 1. Name
  // 2. Mobile (+91 with in-line Verify)
  // 3. Email (with in-line Verify)
  // 4. User ID *
  // 5. Password *
  // 6. Confirm Password *
  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // SEPARATE In-line Verification States
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isMobileVerified, setIsMobileVerified] = useState(false);

  // Modal Dialogs for In-Line Verification
  // 'EMAIL' or 'MOBILE' or null
  const [activeVerificationType, setActiveVerificationType] = useState(null);
  const [emailOtp, setEmailOtp] = useState(['', '', '', '']);
  const [mobileOtp, setMobileOtp] = useState(['', '', '', '']);

  // Login & MPIN states
  const [identifier, setIdentifier] = useState(''); // Mobile, Email or User ID
  const [mPin, setMpin] = useState('');
  const [newMpin, setNewMpin] = useState('');
  const [confirmMpin, setConfirmMpin] = useState('');
  const [pendingUser, setPendingUser] = useState(null);

  // Forgot Password & Reset States
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [resetOtp, setResetOtp] = useState(['', '', '', '']);
  const [newResetPassword, setNewResetPassword] = useState('');
  const [confirmResetPassword, setConfirmResetPassword] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showConfirmResetPassword, setShowConfirmResetPassword] = useState(false);
  const [targetResetUser, setTargetResetUser] = useState(null);

  // Forgot MPIN States
  const [forgotMpinIdentifier, setForgotMpinIdentifier] = useState('');
  const [accountPasswordForMpin, setAccountPasswordForMpin] = useState('');
  const [showAccountPasswordForMpin, setShowAccountPasswordForMpin] = useState(false);
  const [newMpinReset, setNewMpinReset] = useState('');
  const [confirmMpinReset, setConfirmMpinReset] = useState('');

  // Slide & Match to Sign Up State
  const [sliderPosition, setSliderPosition] = useState(0);

  // Status indicators
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  if (!isOpen) return null;

  // --- GENERIC OTP HANDLERS (Paste & Single-Key Backspace) ---
  const handleOtpBoxChange = (val, index, type) => {
    const cleaned = val.replace(/\D/g, '');
    const currentOtp = type === 'EMAIL' ? [...emailOtp] : [...mobileOtp];
    const setTargetOtp = type === 'EMAIL' ? setEmailOtp : setMobileOtp;
    const prefix = type === 'EMAIL' ? 'email-otp' : 'mobile-otp';

    if (!cleaned) {
      currentOtp[index] = '';
      setTargetOtp(currentOtp);
      return;
    }

    if (cleaned.length > 1) {
      // Direct Paste Handler
      const digits = cleaned.slice(0, 4);
      const newArr = ['', '', '', ''];
      for (let i = 0; i < digits.length; i++) newArr[i] = digits[i];
      setTargetOtp(newArr);
      const nextIdx = Math.min(digits.length, 3);
      document.getElementById(`${prefix}-${nextIdx}`)?.focus();
      return;
    }

    currentOtp[index] = cleaned;
    setTargetOtp(currentOtp);
    if (index < 3) {
      const next = document.getElementById(`${prefix}-${index + 1}`);
      next?.focus();
      next?.select?.();
    }
  };

  const handleOtpBoxKeyDown = (e, index, type) => {
    const currentOtp = type === 'EMAIL' ? [...emailOtp] : [...mobileOtp];
    const setTargetOtp = type === 'EMAIL' ? setEmailOtp : setMobileOtp;
    const prefix = type === 'EMAIL' ? 'email-otp' : 'mobile-otp';

    if (e.key === 'Backspace') {
      if (currentOtp[index] === '' && index > 0) {
        e.preventDefault();
        currentOtp[index - 1] = '';
        setTargetOtp(currentOtp);
        const prev = document.getElementById(`${prefix}-${index - 1}`);
        prev?.focus();
        prev?.select?.();
      } else if (currentOtp[index] !== '') {
        currentOtp[index] = '';
        setTargetOtp(currentOtp);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      document.getElementById(`${prefix}-${index - 1}`)?.focus();
    } else if (e.key === 'ArrowRight' && index < 3) {
      e.preventDefault();
      document.getElementById(`${prefix}-${index + 1}`)?.focus();
    }
  };

  const handleOtpPasteEvent = (e, type) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    const setTargetOtp = type === 'EMAIL' ? setEmailOtp : setMobileOtp;
    const prefix = type === 'EMAIL' ? 'email-otp' : 'mobile-otp';
    if (!pasted) return;
    const newArr = ['', '', '', ''];
    for (let i = 0; i < pasted.length; i++) newArr[i] = pasted[i];
    setTargetOtp(newArr);
    const nextIdx = Math.min(pasted.length, 3);
    document.getElementById(`${prefix}-${nextIdx}`)?.focus();
  };

  // ==========================================
  // 1. EMAIL IN-LINE VERIFICATION LOGIC
  // ==========================================
  const handleSendEmailOtp = async () => {
    setErrorMessage('');
    if (!emailAddress.trim() || !emailAddress.includes('@')) {
      setErrorMessage("Please enter a valid email address first.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_AUTH}/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailAddress.trim().toLowerCase(),
          fullName: fullName.trim(),
          mobile: mobileNumber.trim()
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send Email OTP');

      setEmailOtp(['', '', '', '']);
      setActiveVerificationType('EMAIL');
      setSuccessMessage(data.message || 'OTP emailed! Please check your inbox.');
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmailOtp = async () => {
    setErrorMessage('');
    const code = emailOtp.join('');
    if (code.length < 4) {
      setErrorMessage("Please enter 4-digit Email OTP");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_AUTH}/verify-inline-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailAddress.trim().toLowerCase(),
          otp: code
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invalid Email OTP');

      setIsEmailVerified(true);
      setActiveVerificationType(null);
      setSuccessMessage("Email address verified successfully!");
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // 2. MOBILE IN-LINE VERIFICATION LOGIC (Separate SMS Modal)
  // ==========================================
  const handleSendMobileOtp = async () => {
    setErrorMessage('');
    if (!mobileNumber.trim() || mobileNumber.length < 10) {
      setErrorMessage("Please enter a 10-digit mobile number first.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_AUTH}/send-mobile-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile: mobileNumber.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send SMS OTP');

      setMobileOtp(['', '', '', '']);
      setActiveVerificationType('MOBILE');
      setSuccessMessage(data.message || 'SMS OTP dispatched to your mobile number!');
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyMobileOtp = async () => {
    setErrorMessage('');
    const code = mobileOtp.join('');
    if (code.length < 4) {
      setErrorMessage("Please enter 4-digit SMS OTP");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_AUTH}/verify-mobile-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mobile: mobileNumber.trim(),
          otp: code
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invalid SMS OTP code');

      setIsMobileVerified(true);
      setActiveVerificationType(null);
      setSuccessMessage("Mobile number verified successfully!");
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // 3. COMPLETE REGISTRATION (All fields check)
  // ==========================================
  const handleRegisterSubmit = async (e) => {
    if (e) e.preventDefault();
    setErrorMessage('');

    if (!fullName.trim()) {
      setErrorMessage("Please enter your Full Name");
      return;
    }
    if (!mobileNumber.trim() || mobileNumber.length < 10) {
      setErrorMessage("Please enter a valid 10-digit Mobile Number");
      return;
    }
    if (!emailAddress.trim()) {
      setErrorMessage("Please enter your Email address");
      return;
    }
    if (!isEmailVerified) {
      setErrorMessage("Please click 'Verify' next to Email to verify OTP before signing up.");
      return;
    }
    if (!userId.trim()) {
      setErrorMessage("Please choose a unique User ID");
      return;
    }
    if (!password || password.length < 6) {
      setErrorMessage("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage("Password and Confirm Password do not match");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_AUTH}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: fullName.trim(),
          mobile: mobileNumber.trim(),
          email: emailAddress.trim().toLowerCase(),
          userId: userId.trim(),
          password: password,
          confirmPassword: confirmPassword
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');

      setIdentifier(userId.trim() || emailAddress.trim());
      setSuccessMessage("Account created successfully! Now sign in with your Password.");
      setMode('LOGIN');
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // 4. LOGIN HANDLER
  // ==========================================
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    if (!identifier.trim()) {
      setErrorMessage("Please enter User ID, Mobile Number or Email");
      return;
    }

    const payload = { identifier: identifier.trim() };
    if (loginMethod === 'PASSWORD') {
      if (!password) {
        setErrorMessage("Please enter your password");
        return;
      }
      payload.password = password;
    } else {
      if (mPin.length < 4) {
        setErrorMessage("Please enter 4-digit MPIN");
        return;
      }
      payload.mpin = mPin;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_AUTH}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');

      if (data.requiresMpinSetup) {
        setPendingUser(data.user);
        setSuccessMessage("Login successful! Now setup your quick 4-digit MPIN.");
        setMode('SET_MPIN');
        return;
      }

      onLoginSuccess(data.user);
      onClose();
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // 5. SET MPIN HANDLER
  // ==========================================
  const handleSetMpinSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    if (!newMpin || newMpin.length < 4) {
      setErrorMessage("Please enter a 4-digit MPIN");
      return;
    }
    if (newMpin !== confirmMpin) {
      setErrorMessage("MPIN and Confirm MPIN do not match");
      return;
    }

    setLoading(true);
    try {
      const activeId = identifier || (pendingUser && pendingUser.userId) || (pendingUser && pendingUser.email);
      const res = await fetch(`${API_AUTH}/set-mpin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: activeId, mpin: newMpin })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save MPIN');

      setSuccessMessage("4-digit MPIN saved! Entering RailOne...");
      setTimeout(() => {
        onLoginSuccess(data.user);
        onClose();
      }, 900);
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // 6. FORGOT PASSWORD - REQUEST RESET OTP
  // ==========================================
  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    if (!forgotIdentifier.trim()) {
      setErrorMessage('Please enter your registered mobile, email, or user ID.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_AUTH}/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: forgotIdentifier.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'User not found');

      setTargetResetUser({
        identifier: forgotIdentifier.trim(),
        email: data.email,
        mobile: data.mobile
      });
      setSuccessMessage(data.message || 'Reset code sent to your registered email!');
      setResetOtp(['', '', '', '']);
      setMode('RESET');
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // 7. RESET PASSWORD - VERIFY OTP & UPDATE
  // ==========================================
  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    const otpCode = resetOtp.join('');
    if (otpCode.length < 4) {
      setErrorMessage('Please enter the complete 4-digit OTP code.');
      return;
    }
    if (!newResetPassword || newResetPassword.length < 6) {
      setErrorMessage('New password must be at least 6 characters.');
      return;
    }
    if (newResetPassword !== confirmResetPassword) {
      setErrorMessage('New password and confirm password do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_AUTH}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: targetResetUser?.identifier || forgotIdentifier,
          otp: otpCode,
          newPassword: newResetPassword
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reset password');

      setSuccessMessage('Password reset successful! You can now log in.');
      setTimeout(() => {
        setMode('LOGIN');
        setPassword('');
        setSuccessMessage('Password updated successfully. Please log in with your new password.');
      }, 1200);
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // 8. FORGOT MPIN - VERIFY MAIN PASSWORD & SET NEW MPIN
  // ==========================================
  const handleForgotMpinSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!forgotMpinIdentifier.trim()) {
      setErrorMessage('Please enter your registered mobile, email, or user ID.');
      return;
    }
    if (!accountPasswordForMpin) {
      setErrorMessage('Please enter your main Account Password to authenticate.');
      return;
    }
    if (!newMpinReset || newMpinReset.length !== 4) {
      setErrorMessage('Please enter a 4-digit numeric MPIN.');
      return;
    }
    if (newMpinReset !== confirmMpinReset) {
      setErrorMessage('New MPIN and Confirm MPIN do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_AUTH}/set-mpin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: forgotMpinIdentifier.trim(),
          currentPassword: accountPasswordForMpin,
          mpin: newMpinReset
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reset MPIN');

      setSuccessMessage('4-Digit Security MPIN successfully updated!');
      setTimeout(() => {
        setMode('LOGIN');
        setLoginMethod('MPIN');
        setMpin('');
        setAccountPasswordForMpin('');
        setNewMpinReset('');
        setConfirmMpinReset('');
        setSuccessMessage('MPIN reset successfully! Please sign in with your new 4-digit MPIN.');
      }, 1200);
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-200 animate-in slide-in-from-bottom duration-200 max-h-[94vh] overflow-y-auto">
        
        {/* =========================================================================
            TOP HEADER BAR (Official RailOne Layout)
           ========================================================================= */}
        <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-3">
          <button 
            type="button"
            onClick={() => {
              if (mode !== 'LOGIN') {
                setMode('LOGIN');
                setErrorMessage('');
                setSuccessMessage('');
              } else {
                onClose();
              }
            }}
            className="w-9 h-9 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-700 flex items-center justify-center transition"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* RailOne Official Logo */}
          <div className="flex items-center space-x-1">
            <span className="text-xl font-black tracking-tight text-slate-800">Rail</span>
            <div className="relative inline-block">
              <span className="text-xl font-black tracking-tight text-slate-800">One</span>
              <div className="absolute -top-0.5 right-6 w-1.5 h-1.5 bg-orange-500 rounded-full" />
            </div>
          </div>

          {/* Language Switcher Badge */}
          <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xs shadow-xs border border-blue-100">
            A/अ
          </div>
        </div>

        {/* Page Title */}
        <div className="mb-3">
          <h2 className="text-lg font-black text-slate-900 tracking-tight">
            {mode === 'LOGIN' && "Sign In to RailOne"}
            {mode === 'REGISTER' && "Create Account"}
            {mode === 'SET_MPIN' && "Setup 4-Digit Security MPIN"}
            {mode === 'FORGOT' && "Forgot Password"}
            {mode === 'RESET' && "Reset Account Password"}
            {mode === 'FORGOT_MPIN' && "Reset 4-Digit MPIN"}
          </h2>
          {mode === 'REGISTER' && (
            <p className="text-[11px] text-slate-400">Fill your official passenger registration details</p>
          )}
          {mode === 'FORGOT' && (
            <p className="text-[11px] text-slate-400">Enter your registered Mobile, Email or User ID to receive OTP</p>
          )}
          {mode === 'RESET' && (
            <p className="text-[11px] text-slate-400">Enter the 4-digit OTP sent to your email and set a new password</p>
          )}
          {mode === 'FORGOT_MPIN' && (
            <p className="text-[11px] text-slate-400">Authenticate with your main account password, then set your new 4-digit MPIN</p>
          )}
        </div>

        {/* Alert Messages */}
        {errorMessage && (
          <div className="mb-3 bg-rose-50 border border-rose-200 p-2.5 rounded-xl text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-3 bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* =========================================================================
            MODE: REGISTER (Exact Fields from Image)
           ========================================================================= */}
        {mode === 'REGISTER' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-2.5">
            {/* Field 1: Name */}
            <div className="relative">
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2.5 focus-within:border-blue-600 focus-within:bg-white transition">
                <User className="w-4 h-4 text-slate-400 shrink-0 mr-2.5" />
                <input 
                  type="text"
                  required
                  placeholder="Full Name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-transparent text-xs font-semibold text-slate-900 outline-none placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Field 2: Mobile Number (+91) with Verify Button */}
            <div className="relative">
              <div className={`flex items-center justify-between bg-slate-50 border ${isMobileVerified ? 'border-emerald-300 bg-emerald-50/40' : 'border-slate-200'} rounded-2xl px-3 py-2.5 focus-within:border-blue-600 focus-within:bg-white transition`}>
                <div className="flex items-center flex-1 mr-2">
                  <Phone className={`w-4 h-4 ${isMobileVerified ? 'text-emerald-600' : 'text-slate-400'} shrink-0 mr-2`} />
                  <span className="text-xs font-bold text-slate-600 mr-1.5">+91</span>
                  <input 
                    type="tel"
                    required
                    maxLength={10}
                    disabled={isMobileVerified}
                    placeholder="Mobile Number"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-transparent text-xs font-semibold text-slate-900 outline-none placeholder:text-slate-400 disabled:text-slate-500"
                  />
                </div>
                {isMobileVerified ? (
                  <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleSendMobileOtp}
                    disabled={loading || mobileNumber.length < 10}
                    className="text-xs font-black text-blue-600 hover:text-blue-800 disabled:text-slate-300 transition shrink-0"
                  >
                    Verify
                  </button>
                )}
              </div>
            </div>

            {/* Field 3: Email with in-line Verify Button */}
            <div className="relative">
              <div className={`flex items-center justify-between bg-slate-50 border ${isEmailVerified ? 'border-emerald-300 bg-emerald-50/40' : 'border-slate-200'} rounded-2xl px-3 py-2.5 focus-within:border-blue-600 focus-within:bg-white transition`}>
                <div className="flex items-center flex-1 mr-2">
                  <Mail className={`w-4 h-4 ${isEmailVerified ? 'text-emerald-600' : 'text-slate-400'} shrink-0 mr-2`} />
                  <input 
                    type="email"
                    required
                    disabled={isEmailVerified}
                    placeholder="Email Address"
                    value={emailAddress}
                    onChange={(e) => setEmailAddress(e.target.value)}
                    className="w-full bg-transparent text-xs font-semibold text-slate-900 outline-none placeholder:text-slate-400 disabled:text-slate-500"
                  />
                </div>
                {isEmailVerified ? (
                  <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleSendEmailOtp}
                    disabled={loading || !emailAddress.includes('@')}
                    className="text-xs font-black text-blue-600 hover:text-blue-800 disabled:text-slate-300 transition shrink-0"
                  >
                    Verify
                  </button>
                )}
              </div>
            </div>

            {/* Field 4: User ID * */}
            <div className="relative">
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2.5 focus-within:border-blue-600 focus-within:bg-white transition">
                <User className="w-4 h-4 text-slate-400 shrink-0 mr-2.5" />
                <input 
                  type="text"
                  required
                  placeholder="User ID *"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value.replace(/\s/g, ''))}
                  className="w-full bg-transparent text-xs font-semibold text-slate-900 outline-none placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Field 5: Password * */}
            <div className="relative">
              <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2.5 focus-within:border-blue-600 focus-within:bg-white transition">
                <div className="flex items-center flex-1 mr-2">
                  <Lock className="w-4 h-4 text-slate-400 shrink-0 mr-2.5" />
                  <input 
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    placeholder="Password *"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-transparent text-xs font-semibold text-slate-900 outline-none placeholder:text-slate-400"
                  />
                </div>
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Field 6: Confirm Password * */}
            <div className="relative">
              <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2.5 focus-within:border-blue-600 focus-within:bg-white transition">
                <div className="flex items-center flex-1 mr-2">
                  <Lock className="w-4 h-4 text-slate-400 shrink-0 mr-2.5" />
                  <input 
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    minLength={6}
                    placeholder="Confirm Password *"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-transparent text-xs font-semibold text-slate-900 outline-none placeholder:text-slate-400"
                  />
                </div>
                <button 
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Interactive "Slide & Match to Sign Up" */}
            <div className="pt-2">
              <div className="relative bg-slate-100 rounded-2xl h-12 flex items-center px-1 overflow-hidden border border-slate-200 select-none">
                <div 
                  className="absolute left-0 top-0 bottom-0 bg-blue-600/10 rounded-2xl transition-all"
                  style={{ width: `${Math.max(sliderPosition, 10)}%` }}
                />
                
                <div className="w-full text-center text-xs font-bold text-slate-600 pointer-events-none">
                  Slide &amp; Match to <span className="text-blue-600 font-black">Sign Up</span>
                </div>

                <div 
                  className="absolute left-1 w-10 h-10 bg-blue-700 hover:bg-blue-800 text-white rounded-xl flex items-center justify-center cursor-grab active:cursor-grabbing shadow-md transition-transform"
                  style={{ transform: `translateX(${(sliderPosition / 100) * 310}px)` }}
                  onMouseDown={(e) => {
                    const startX = e.clientX;
                    const onMouseMove = (moveEvent) => {
                      const diff = moveEvent.clientX - startX;
                      const percent = Math.min(Math.max((diff / 310) * 100, 0), 100);
                      setSliderPosition(percent);
                      if (percent > 90) {
                        setSliderPosition(100);
                        document.removeEventListener('mousemove', onMouseMove);
                        handleRegisterSubmit();
                      }
                    };
                    const onMouseUp = () => {
                      document.removeEventListener('mousemove', onMouseMove);
                      document.removeEventListener('mouseup', onMouseUp);
                      setSliderPosition(0);
                    };
                    document.addEventListener('mousemove', onMouseMove);
                    document.addEventListener('mouseup', onMouseUp);
                  }}
                  onTouchStart={(e) => {
                    const startX = e.touches[0].clientX;
                    const onTouchMove = (moveEvent) => {
                      const diff = moveEvent.touches[0].clientX - startX;
                      const percent = Math.min(Math.max((diff / 280) * 100, 0), 100);
                      setSliderPosition(percent);
                      if (percent > 90) {
                        setSliderPosition(100);
                        document.removeEventListener('touchmove', onTouchMove);
                        handleRegisterSubmit();
                      }
                    };
                    const onTouchEnd = () => {
                      document.removeEventListener('touchmove', onTouchMove);
                      document.removeEventListener('touchend', onTouchEnd);
                      setSliderPosition(0);
                    };
                    document.addEventListener('touchmove', onTouchMove);
                    document.addEventListener('touchend', onTouchEnd);
                  }}
                >
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>

              {/* Direct Click Fallback Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 bg-blue-700 hover:bg-blue-800 disabled:bg-slate-300 text-white font-bold py-2.5 rounded-xl text-xs transition shadow-xs"
              >
                {loading ? "Creating Account..." : "Direct Click to Sign Up"}
              </button>
            </div>

            <div className="text-center pt-2">
              <span className="text-xs text-slate-500">Already have an account? </span>
              <button 
                type="button"
                onClick={() => { setMode('LOGIN'); setErrorMessage(''); }}
                className="text-xs font-bold text-blue-600 hover:underline"
              >
                Sign In
              </button>
            </div>
          </form>
        )}

        {/* =========================================================================
            SEPARATE POPUP 1: EMAIL OTP VERIFICATION MODAL
           ========================================================================= */}
        {activeVerificationType === 'EMAIL' && (
          <div className="fixed inset-0 z-60 bg-black/60 flex items-center justify-center p-4">
            <div className="w-full max-w-xs bg-white rounded-2xl p-5 shadow-2xl border border-slate-200 text-center animate-in zoom-in-95">
              <div className="w-11 h-11 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-2 border border-blue-100">
                <Mail className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-black text-slate-900">Verify Email Address</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                4-digit code sent to your registered Gmail:
              </p>
              <div className="text-xs font-black text-blue-700 bg-blue-50/70 py-1 px-2 rounded-lg mt-1 break-all">
                {emailAddress}
              </div>

              {/* OTP Inputs with paste and backspace */}
              <div className="flex justify-center space-x-2 my-3">
                {[0, 1, 2, 3].map((idx) => (
                  <input 
                    key={idx}
                    id={`email-otp-${idx}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={emailOtp[idx]}
                    onChange={(e) => handleOtpBoxChange(e.target.value, idx, 'EMAIL')}
                    onKeyDown={(e) => handleOtpBoxKeyDown(e, idx, 'EMAIL')}
                    onPaste={(e) => handleOtpPasteEvent(e, 'EMAIL')}
                    onFocus={(e) => e.target.select()}
                    className="w-10 h-11 text-center text-base font-black border border-slate-200 rounded-xl bg-slate-50 outline-none focus:border-blue-600 focus:bg-white"
                  />
                ))}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setActiveVerificationType(null)}
                  className="flex-1 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleVerifyEmailOtp}
                  disabled={loading}
                  className="flex-1 py-2 rounded-xl text-xs font-bold bg-blue-700 hover:bg-blue-800 text-white"
                >
                  {loading ? "Verifying..." : "Verify Email"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            SEPARATE POPUP 2: MOBILE SMS OTP VERIFICATION MODAL
           ========================================================================= */}
        {activeVerificationType === 'MOBILE' && (
          <div className="fixed inset-0 z-60 bg-black/60 flex items-center justify-center p-4">
            <div className="w-full max-w-xs bg-white rounded-2xl p-5 shadow-2xl border border-slate-200 text-center animate-in zoom-in-95">
              <div className="w-11 h-11 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2 border border-emerald-100">
                <Smartphone className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-black text-slate-900">Verify Mobile Number</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                4-digit SMS OTP sent to:
              </p>
              <div className="text-xs font-black text-emerald-700 bg-emerald-50/70 py-1 px-2 rounded-lg mt-1 tracking-wider">
                +91 {mobileNumber}
              </div>

              {/* OTP Inputs with paste and backspace */}
              <div className="flex justify-center space-x-2 my-3">
                {[0, 1, 2, 3].map((idx) => (
                  <input 
                    key={idx}
                    id={`mobile-otp-${idx}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={mobileOtp[idx]}
                    onChange={(e) => handleOtpBoxChange(e.target.value, idx, 'MOBILE')}
                    onKeyDown={(e) => handleOtpBoxKeyDown(e, idx, 'MOBILE')}
                    onPaste={(e) => handleOtpPasteEvent(e, 'MOBILE')}
                    onFocus={(e) => e.target.select()}
                    className="w-10 h-11 text-center text-base font-black border border-slate-200 rounded-xl bg-slate-50 outline-none focus:border-emerald-600 focus:bg-white"
                  />
                ))}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setActiveVerificationType(null)}
                  className="flex-1 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleVerifyMobileOtp}
                  disabled={loading}
                  className="flex-1 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {loading ? "Verifying..." : "Verify Mobile"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            MODE: LOGIN
           ========================================================================= */}
        {mode === 'LOGIN' && (
          <form onSubmit={handleLoginSubmit} className="space-y-3.5">
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => { setLoginMethod('PASSWORD'); setErrorMessage(''); }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
                  loginMethod === 'PASSWORD' 
                    ? 'bg-white text-blue-700 shadow-xs' 
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Password
              </button>
              <button
                type="button"
                onClick={() => { setLoginMethod('MPIN'); setErrorMessage(''); }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
                  loginMethod === 'MPIN' 
                    ? 'bg-white text-blue-700 shadow-xs' 
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                4-Digit MPIN
              </button>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase">User ID / Mobile / Email</label>
              <div className="relative mt-1">
                <input 
                  type="text"
                  required
                  placeholder="Enter User ID, 10-digit mobile or email"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>
            </div>

            {loginMethod === 'PASSWORD' ? (
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Password</label>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotIdentifier(identifier);
                      setMode('FORGOT');
                      setErrorMessage('');
                      setSuccessMessage('');
                    }}
                    className="text-[11px] font-bold text-blue-600 hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative mt-1">
                  <input 
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 outline-none focus:border-blue-600 focus:bg-white"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">4-Digit Security MPIN</label>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotMpinIdentifier(identifier);
                      setAccountPasswordForMpin('');
                      setNewMpinReset('');
                      setConfirmMpinReset('');
                      setMode('FORGOT_MPIN');
                      setErrorMessage('');
                      setSuccessMessage('');
                    }}
                    className="text-[11px] font-bold text-blue-600 hover:underline"
                  >
                    Forgot MPIN?
                  </button>
                </div>
                <div className="relative mt-1">
                  <input 
                    type={showMpin ? "text" : "password"}
                    required
                    maxLength={4}
                    placeholder="••••"
                    value={mPin}
                    onChange={(e) => setMpin(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-center text-lg font-black tracking-widest text-slate-900 outline-none focus:border-blue-600 focus:bg-white"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowMpin(!showMpin)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showMpin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white font-bold py-3 rounded-xl text-xs shadow-md shadow-blue-700/25 flex items-center justify-center gap-1.5 active:scale-95 transition"
            >
              <span>{loading ? "Authenticating..." : `Sign In with ${loginMethod === 'PASSWORD' ? 'Password' : 'MPIN'}`}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="text-center pt-2 border-t border-slate-100">
              <span className="text-xs text-slate-500">New passenger on RailOne? </span>
              <button 
                type="button"
                onClick={() => { setMode('REGISTER'); setErrorMessage(''); }}
                className="text-xs font-bold text-blue-600 hover:underline"
              >
                Create Account
              </button>
            </div>
          </form>
        )}

        {/* =========================================================================
            MODE: SET MPIN
           ========================================================================= */}
        {mode === 'SET_MPIN' && (
          <form onSubmit={handleSetMpinSubmit} className="space-y-3.5">
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3 flex items-start gap-2.5">
              <Sparkles className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div className="text-xs text-blue-900 leading-relaxed">
                <span className="font-black">Create 4-digit MPIN:</span> Set a quick 4-digit security PIN for fast login!
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase">Set 4-Digit MPIN</label>
              <input 
                type="password"
                required
                maxLength={4}
                placeholder="••••"
                value={newMpin}
                onChange={(e) => setNewMpin(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-center text-lg font-black tracking-widest text-slate-900 outline-none mt-1 focus:bg-white focus:border-blue-600"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase">Confirm 4-Digit MPIN</label>
              <input 
                type="password"
                required
                maxLength={4}
                placeholder="••••"
                value={confirmMpin}
                onChange={(e) => setConfirmMpin(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-center text-lg font-black tracking-widest text-slate-900 outline-none mt-1 focus:bg-white focus:border-blue-600"
              />
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-3 rounded-xl text-xs shadow"
            >
              {loading ? "Saving MPIN..." : "Save 4-Digit MPIN & Enter"}
            </button>
          </form>
        )}
        {/* =========================================================================
            MODE: FORGOT PASSWORD (REQUEST OTP)
           ========================================================================= */}
        {mode === 'FORGOT' && (
          <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 flex items-start gap-2.5">
              <KeyRound className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900 leading-relaxed">
                <span className="font-black">Account Recovery:</span> Enter your registered User ID, Mobile number, or Email. We'll send an OTP to your email.
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase">Registered Mobile, Email or User ID</label>
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 mt-1 focus-within:border-blue-600 focus-within:bg-white transition">
                <User className="w-4 h-4 text-slate-400 shrink-0 mr-2" />
                <input 
                  type="text"
                  required
                  placeholder="e.g. rahul123 or rahul@gmail.com"
                  value={forgotIdentifier}
                  onChange={(e) => setForgotIdentifier(e.target.value)}
                  className="w-full bg-transparent text-xs font-bold text-slate-900 outline-none"
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white font-bold py-3 rounded-xl text-xs shadow-md shadow-blue-700/25 flex items-center justify-center gap-1.5 active:scale-95 transition"
            >
              <span>{loading ? "Sending OTP..." : "Send Verification OTP"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="text-center pt-2 border-t border-slate-100">
              <button 
                type="button"
                onClick={() => { setMode('LOGIN'); setErrorMessage(''); setSuccessMessage(''); }}
                className="text-xs font-bold text-slate-600 hover:text-blue-600 transition"
              >
                ← Back to Login
              </button>
            </div>
          </form>
        )}

        {/* =========================================================================
            MODE: RESET PASSWORD (VERIFY OTP & ENTER NEW PASSWORD)
           ========================================================================= */}
        {mode === 'RESET' && (
          <form onSubmit={handleResetPasswordSubmit} className="space-y-3.5">
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3 flex items-start gap-2.5">
              <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div className="text-xs text-blue-900 leading-relaxed">
                <span className="font-black">Verify OTP:</span> 4-digit reset OTP sent to{' '}
                <span className="font-bold underline">{targetResetUser?.email || 'registered email'}</span>.
              </div>
            </div>

            {/* 4-Digit OTP Box */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase text-center block mb-1">
                Enter 4-Digit Reset OTP
              </label>
              <div className="flex justify-center space-x-2 my-2">
                {[0, 1, 2, 3].map((idx) => (
                  <input 
                    key={idx}
                    id={`reset-otp-${idx}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={resetOtp[idx]}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      const copy = [...resetOtp];
                      if (!val) {
                        copy[idx] = '';
                        setResetOtp(copy);
                        return;
                      }
                      if (val.length > 1) {
                        const digits = val.slice(0, 4);
                        const newArr = ['', '', '', ''];
                        for (let i = 0; i < digits.length; i++) newArr[i] = digits[i];
                        setResetOtp(newArr);
                        const nextIdx = Math.min(digits.length, 3);
                        document.getElementById(`reset-otp-${nextIdx}`)?.focus();
                        return;
                      }
                      copy[idx] = val;
                      setResetOtp(copy);
                      if (idx < 3) {
                        document.getElementById(`reset-otp-${idx + 1}`)?.focus();
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Backspace' && !resetOtp[idx] && idx > 0) {
                        document.getElementById(`reset-otp-${idx - 1}`)?.focus();
                      }
                    }}
                    className="w-12 h-12 text-center text-lg font-black bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-blue-600 focus:bg-white outline-none transition"
                  />
                ))}
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase">New Password (Min 6 chars)</label>
              <div className="relative mt-1">
                <input 
                  type={showResetPassword ? "text" : "password"}
                  required
                  placeholder="Enter new password"
                  value={newResetPassword}
                  onChange={(e) => setNewResetPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 outline-none focus:border-blue-600 focus:bg-white"
                />
                <button 
                  type="button"
                  onClick={() => setShowResetPassword(!showResetPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showResetPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase">Confirm New Password</label>
              <div className="relative mt-1">
                <input 
                  type={showConfirmResetPassword ? "text" : "password"}
                  required
                  placeholder="Confirm new password"
                  value={confirmResetPassword}
                  onChange={(e) => setConfirmResetPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 outline-none focus:border-blue-600 focus:bg-white"
                />
                <button 
                  type="button"
                  onClick={() => setShowConfirmResetPassword(!showConfirmResetPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showConfirmResetPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold py-3 rounded-xl text-xs shadow-md shadow-emerald-600/25 flex items-center justify-center gap-1.5 active:scale-95 transition"
            >
              <span>{loading ? "Updating Password..." : "Reset Password & Login"}</span>
              <CheckCircle2 className="w-4 h-4" />
            </button>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
              <button 
                type="button"
                onClick={handleForgotPasswordSubmit}
                disabled={loading}
                className="font-bold text-blue-600 hover:underline"
              >
                Resend OTP
              </button>
              <button 
                type="button"
                onClick={() => { setMode('LOGIN'); setErrorMessage(''); setSuccessMessage(''); }}
                className="font-bold text-slate-600 hover:text-slate-900"
              >
                Back to Sign In
              </button>
            </div>
          </form>
        )}

        {/* =========================================================================
            MODE: FORGOT MPIN (AUTHENTICATE WITH MAIN PASSWORD -> SET NEW MPIN)
           ========================================================================= */}
        {mode === 'FORGOT_MPIN' && (
          <form onSubmit={handleForgotMpinSubmit} className="space-y-3.5">
            <div className="bg-purple-50 border border-purple-200 rounded-2xl p-3 flex items-start gap-2.5">
              <Lock className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
              <div className="text-xs text-purple-900 leading-relaxed">
                <span className="font-black">Security Verification:</span> Pehle apna registered account aur <span className="font-bold underline">Main Password</span> verify karein, uske baad naya 4-Digit MPIN set karein.
              </div>
            </div>

            {/* Step 1: User Identifier */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase">Registered Mobile, Email or User ID</label>
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 mt-1 focus-within:border-blue-600 focus-within:bg-white transition">
                <User className="w-4 h-4 text-slate-400 shrink-0 mr-2" />
                <input 
                  type="text"
                  required
                  placeholder="e.g. rahul123 or 9876543210"
                  value={forgotMpinIdentifier}
                  onChange={(e) => setForgotMpinIdentifier(e.target.value)}
                  className="w-full bg-transparent text-xs font-bold text-slate-900 outline-none"
                />
              </div>
            </div>

            {/* Step 2: Main Account Password */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase">Main Account Password *</label>
              <div className="relative mt-1">
                <input 
                  type={showAccountPasswordForMpin ? "text" : "password"}
                  required
                  placeholder="Enter your main account password"
                  value={accountPasswordForMpin}
                  onChange={(e) => setAccountPasswordForMpin(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 outline-none focus:border-blue-600 focus:bg-white"
                />
                <button 
                  type="button"
                  onClick={() => setShowAccountPasswordForMpin(!showAccountPasswordForMpin)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showAccountPasswordForMpin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Step 3: New 4-Digit MPIN */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase">New 4-Digit MPIN</label>
              <input 
                type="password"
                required
                maxLength={4}
                placeholder="••••"
                value={newMpinReset}
                onChange={(e) => setNewMpinReset(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-center text-lg font-black tracking-widest text-slate-900 outline-none mt-1 focus:bg-white focus:border-blue-600 font-mono"
              />
            </div>

            {/* Step 4: Confirm 4-Digit MPIN */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase">Confirm 4-Digit MPIN</label>
              <input 
                type="password"
                required
                maxLength={4}
                placeholder="••••"
                value={confirmMpinReset}
                onChange={(e) => setConfirmMpinReset(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-center text-lg font-black tracking-widest text-slate-900 outline-none mt-1 focus:bg-white focus:border-blue-600 font-mono"
              />
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-purple-700 hover:bg-purple-800 disabled:bg-purple-400 text-white font-bold py-3 rounded-xl text-xs shadow-md shadow-purple-700/25 flex items-center justify-center gap-1.5 active:scale-95 transition"
            >
              <span>{loading ? "Verifying & Updating..." : "Verify Password & Reset MPIN"}</span>
              <CheckCircle2 className="w-4 h-4" />
            </button>

            <div className="text-center pt-2 border-t border-slate-100">
              <button 
                type="button"
                onClick={() => { setMode('LOGIN'); setErrorMessage(''); setSuccessMessage(''); }}
                className="text-xs font-bold text-slate-600 hover:text-blue-600 transition"
              >
                ← Back to Login
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
