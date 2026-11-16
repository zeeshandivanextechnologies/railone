import React, { useState, useEffect, useRef } from 'react';
import { 
  User, 
  Smartphone, 
  Mail, 
  Shield, 
  Wallet, 
  CreditCard, 
  History, 
  Lock, 
  LogOut, 
  ChevronRight, 
  Globe, 
  Bell, 
  CheckCircle, 
  KeyRound,
  FileText,
  Edit3,
  Save,
  X,
  Trash2,
  PlusCircle,
  MapPin,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Camera,
  Image as ImageIcon
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.jsx';

const API_AUTH = 'http://localhost:5000/api/auth';

// 6 CRIS / RailOne Default Avatars
const DEFAULT_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80'
];

export default function ProfilePanel({ user, onLogout, onOpenAuth, bookings, onOpenTicketModal, onUpdateUser }) {
  const { t, changeLanguage } = useLanguage();

  // Navigation Sections: MAIN | EDIT_PROFILE | HISTORY | PASSENGERS
  const [activeSection, setActiveSection] = useState('MAIN');
  const [selectedLanguage, setSelectedLanguage] = useState(user?.appLanguage || 'English');
  const [whatsappAlerts, setWhatsappAlerts] = useState(user?.whatsappAlerts !== false);

  // Profile Edit Form States
  const [editName, setEditName] = useState(user ? user.name : '');
  const [editGender, setEditGender] = useState(user ? (user.gender || 'M') : 'M');
  const [editCity, setEditCity] = useState(user ? (user.city || '') : '');
  const [editState, setEditState] = useState(user ? (user.state || '') : '');
  const [editPincode, setEditPincode] = useState(user ? (user.pincode || '') : '');
  const [avatarUrl, setAvatarUrl] = useState(user ? (user.avatarUrl || '') : '');

  // Master Passengers List (Loaded from PostgreSQL)
  const [savedPassengers, setSavedPassengers] = useState([]);
  const [newPassName, setNewPassName] = useState('');
  const [newPassDob, setNewPassDob] = useState('');
  const [newPassAge, setNewPassAge] = useState('');
  const [newPassGender, setNewPassGender] = useState('Male');
  const [newPassConcession, setNewPassConcession] = useState('Select Concession Type');
  const [newPassBerth, setNewPassBerth] = useState('Berth Preferences');
  const [newPassMeal, setNewPassMeal] = useState('Meal Preferences');
  const [newPassIdType, setNewPassIdType] = useState('Aadhaar Card');
  const [newPassIdNumber, setNewPassIdNumber] = useState('');
  const [isAadhaarVerified, setIsAadhaarVerified] = useState(false);
  const [verifyingAadhaar, setVerifyingAadhaar] = useState(false);

  // Edit Existing Passenger State
  const [editingPassengerId, setEditingPassengerId] = useState(null);
  const [editPassName, setEditPassName] = useState('');
  const [editPassDob, setEditPassDob] = useState('');
  const [editPassAge, setEditPassAge] = useState('');
  const [editPassGender, setEditPassGender] = useState('Male');
  const [editPassConcession, setEditPassConcession] = useState('Select Concession Type');
  const [editPassBerth, setEditPassBerth] = useState('Berth Preferences');
  const [editPassMeal, setEditPassMeal] = useState('Meal Preferences');
  const [editPassIdType, setEditPassIdType] = useState('Aadhaar Card');
  const [editPassIdNumber, setEditPassIdNumber] = useState('');
  const [editIsVerified, setEditIsVerified] = useState(false);

  // Dynamic Status
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Hidden File Input ref for custom picture upload
  const fileInputRef = useRef(null);

  // Quick update setting in PostgreSQL
  const handleUpdateLanguage = async (newLang) => {
    setSelectedLanguage(newLang);
    changeLanguage(newLang);
    if (!user || !user.id) return;
    try {
      const res = await fetch(`${API_AUTH}/profile/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appLanguage: newLang })
      });
      const data = await res.json();
      if (res.ok && onUpdateUser) onUpdateUser(data.user);
    } catch (_) {}
  };

  const handleToggleWhatsappAlerts = async () => {
    const nextVal = !whatsappAlerts;
    setWhatsappAlerts(nextVal);
    try {
      const res = await fetch(`${API_AUTH}/profile/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ whatsappAlerts: nextVal })
      });
      const data = await res.json();
      if (res.ok && onUpdateUser) onUpdateUser(data.user);
    } catch (_) {}
  };

  // 1. Fetch live profile details and master passengers when user changes or section opens
  useEffect(() => {
    if (user && user.id) {
      setEditName(user.name);
      setEditGender(user.gender || 'M');
      setEditCity(user.city || '');
      setEditState(user.state || '');
      setEditPincode(user.pincode || '');
      setAvatarUrl(user.avatarUrl || '');
      if (user.appLanguage) setSelectedLanguage(user.appLanguage);
      if (user.whatsappAlerts !== undefined) setWhatsappAlerts(user.whatsappAlerts);

      // Load Master Passengers from backend
      fetch(`${API_AUTH}/passengers/${user.id}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.passengers) {
            setSavedPassengers(data.passengers);
          }
        })
        .catch(() => {});
    }
  }, [user]);

  // 2. Local File Upload to base64 Avatar
  const handleImageFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setErrorMessage("Please select an image smaller than 2MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const b64 = event.target.result;
      setAvatarUrl(b64);
      // Auto-save avatar directly
      saveAvatarOnly(b64);
    };
    reader.readAsDataURL(file);
  };

  // Quick Save Avatar
  const saveAvatarOnly = async (newAvatar) => {
    try {
      const res = await fetch(`${API_AUTH}/profile/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: editName || user.name,
          gender: editGender,
          city: editCity,
          state: editState,
          pincode: editPincode,
          avatarUrl: newAvatar
        })
      });
      const data = await res.json();
      if (res.ok && onUpdateUser) {
        onUpdateUser(data.user);
        setStatusMessage("Avatar updated successfully!");
        setTimeout(() => setStatusMessage(''), 2000);
      }
    } catch (_) {}
  };

  // 3. Dynamic Update Profile Handler
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setStatusMessage('');

    if (!editName.trim()) {
      setErrorMessage("Full Name cannot be empty");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_AUTH}/profile/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: editName.trim(),
          gender: editGender,
          city: editCity.trim(),
          state: editState.trim(),
          pincode: editPincode.trim(),
          avatarUrl: avatarUrl
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update profile');

      if (onUpdateUser) {
        onUpdateUser(data.user);
      }
      setStatusMessage("Profile updated successfully in PostgreSQL!");
      setTimeout(() => {
        setActiveSection('MAIN');
        setStatusMessage('');
      }, 1000);
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 4. Aadhaar Auto-Verify & Auto-Fill Handler
  const handleVerifyAadhaar = async (aadhaarVal) => {
    const clean = (aadhaarVal || newPassIdNumber).replace(/\s|-/g, '').trim();
    if (clean.length !== 12) {
      setErrorMessage("Please enter a 12-digit Aadhaar Number.");
      setTimeout(() => setErrorMessage(''), 2500);
      return;
    }

    // Check if this Aadhaar is already verified in our list
    const alreadySaved = savedPassengers.find(p => p.idCardNumber === clean);
    if (alreadySaved) {
      setErrorMessage(`This Aadhaar ID is already verified for ${alreadySaved.name}!`);
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    setVerifyingAadhaar(true);
    setErrorMessage('');
    try {
      const res = await fetch(`${API_AUTH}/verify-aadhaar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aadhaarNumber: clean })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Aadhaar verification failed');

      // Auto-populate details from Aadhaar
      setNewPassName(data.fullName);
      setNewPassDob(data.dob || '1998-01-01');
      setNewPassAge(data.age ? data.age.toString() : '26');
      setNewPassGender(data.gender === 'F' ? 'Female' : (data.gender === 'T' ? 'Trans' : 'Male'));
      setIsAadhaarVerified(true);
      setStatusMessage(data.message || 'Aadhaar Verified! Details auto-filled.');
      setTimeout(() => setStatusMessage(''), 3000);
    } catch (err) {
      setErrorMessage(err.message);
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setVerifyingAadhaar(false);
    }
  };

  // 5. Dynamic Add Master Passenger Handler
  const handleAddPassenger = async (e) => {
    e.preventDefault();
    if (!newPassName.trim()) {
      setErrorMessage("Please enter passenger's full name or verify Aadhaar.");
      return;
    }

    // Calculate age if not set
    let computedAge = parseInt(newPassAge, 10);
    if ((!computedAge || isNaN(computedAge)) && newPassDob) {
      const birthYear = new Date(newPassDob).getFullYear();
      computedAge = new Date().getFullYear() - birthYear;
    }
    if (!computedAge || isNaN(computedAge)) computedAge = 25;

    setLoading(true);
    try {
      const res = await fetch(`${API_AUTH}/passengers/${user.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newPassName.trim(),
          age: computedAge,
          gender: newPassGender === 'Female' ? 'F' : (newPassGender === 'Trans' ? 'T' : 'M'),
          berth: newPassBerth === 'Berth Preferences' ? 'No Preference' : newPassBerth,
          dob: newPassDob,
          concessionType: newPassConcession === 'Select Concession Type' ? 'None' : newPassConcession,
          mealPreference: newPassMeal === 'Meal Preferences' ? 'No Preference' : newPassMeal,
          idCardType: newPassIdType,
          idCardNumber: newPassIdNumber.trim() || null,
          isIdVerified: isAadhaarVerified || (newPassIdNumber.trim().length === 12)
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add passenger');

      setSavedPassengers(prev => [data.passenger, ...prev]);
      // Reset form
      setNewPassName('');
      setNewPassDob('');
      setNewPassAge('');
      setNewPassGender('Male');
      setNewPassConcession('Select Concession Type');
      setNewPassBerth('Berth Preferences');
      setNewPassMeal('Meal Preferences');
      setNewPassIdNumber('');
      setIsAadhaarVerified(false);
      setStatusMessage("Passenger verified and added to Master List!");
      setTimeout(() => setStatusMessage(''), 2500);
    } catch (err) {
      setErrorMessage(err.message);
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  // 6. Dynamic Edit & Update Passenger Handler
  const startEditPassenger = (p) => {
    setEditingPassengerId(p.id);
    setEditPassName(p.name);
    setEditPassAge(p.age);
    setEditPassDob(p.dob || '');
    setEditPassGender(p.gender === 'F' ? 'Female' : (p.gender === 'T' ? 'Trans' : 'Male'));
    setEditPassBerth(p.berth || 'Berth Preferences');
    setEditPassConcession(p.concessionType || 'Select Concession Type');
    setEditPassMeal(p.mealPreference || 'Meal Preferences');
    setEditPassIdType(p.idCardType || 'Aadhaar Card');
    setEditPassIdNumber(p.idCardNumber || '');
    setEditIsVerified(p.isIdVerified || false);
  };

  const handleUpdatePassenger = async (e) => {
    e.preventDefault();
    if (!editPassName.trim() || !editingPassengerId) return;

    let computedAge = parseInt(editPassAge, 10);
    if ((!computedAge || isNaN(computedAge)) && editPassDob) {
      const birthYear = new Date(editPassDob).getFullYear();
      computedAge = new Date().getFullYear() - birthYear;
    }
    if (!computedAge || isNaN(computedAge)) computedAge = 25;

    setLoading(true);
    try {
      const res = await fetch(`${API_AUTH}/passengers/${editingPassengerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editPassName.trim(),
          age: computedAge,
          gender: editPassGender === 'Female' ? 'F' : (editPassGender === 'Trans' ? 'T' : 'M'),
          berth: editPassBerth === 'Berth Preferences' ? 'No Preference' : editPassBerth,
          dob: editPassDob,
          concessionType: editPassConcession === 'Select Concession Type' ? 'None' : editPassConcession,
          mealPreference: editPassMeal === 'Meal Preferences' ? 'No Preference' : editPassMeal,
          idCardType: editPassIdType,
          idCardNumber: editPassIdNumber.trim() || null,
          isIdVerified: editIsVerified
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update passenger');

      setSavedPassengers(prev => prev.map(p => p.id === editingPassengerId ? data.passenger : p));
      setEditingPassengerId(null);
      setStatusMessage("Passenger updated successfully!");
      setTimeout(() => setStatusMessage(''), 2000);
    } catch (err) {
      setErrorMessage(err.message);
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  // 7. Dynamic Delete Passenger Handler
  const handleDeletePassenger = async (passId) => {
    try {
      await fetch(`${API_AUTH}/passengers/${passId}`, { method: 'DELETE' });
      setSavedPassengers(prev => prev.filter(p => p.id !== passId));
      setStatusMessage("Passenger deleted from Master List.");
      setTimeout(() => setStatusMessage(''), 2000);
    } catch (_) {}
  };

  // If user is not logged in
  if (!user) {
    return (
      <div className="p-4 space-y-4  text-center">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
          <div className="w-16 h-16 bg-blue-50 text-blue-700 rounded-full flex items-center justify-center mx-auto">
            <User className="w-8 h-8" />
          </div>
          <h2 className="text-base font-bold text-slate-900">Sign In to RailOne</h2>
          <p className="text-xs text-slate-500">
            Access your bookings, saved passengers, R-Wallet and faster Tatkal ticket bookings.
          </p>
          <div className="pt-2 space-y-2">
            <button 
              onClick={() => onOpenAuth('LOGIN')}
              className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-2.5 rounded-xl text-xs shadow"
            >
              Sign In
            </button>
            <button 
              onClick={() => onOpenAuth('REGISTER')}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-xs"
            >
              Create Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 ">
      {/* Hidden File Input for uploading photo */}
      <input 
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={handleImageFileChange}
        className="hidden"
      />

      {/* User Header Profile Card */}
      <div className="bg-gradient-to-br from-blue-900 via-indigo-950 to-slate-900 text-white p-5 rounded-3xl shadow-lg border border-blue-800/60 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3.5">
            {/* AVATAR DISPLAY (Supports Image Avatar or Gradient Fallback Initials) */}
            <div className="relative group">
              {avatarUrl || user.avatarUrl ? (
                <img 
                  src={avatarUrl || user.avatarUrl} 
                  alt={user.name} 
                  className="w-14 h-14 rounded-2xl object-cover border-2 border-amber-300 shadow-md"
                />
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-200 text-blue-950 font-black text-xl flex items-center justify-center shadow">
                  {user.name.charAt(0)}
                </div>
              )}

              {/* Quick Camera Icon on Avatar to change picture */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Change Avatar"
                className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow border border-white"
              >
                <Camera className="w-3 h-3" />
              </button>
            </div>

            <div>
              <h2 className="text-base font-black text-white">{user.name}</h2>
              <div className="flex items-center space-x-1.5 text-xs text-blue-200 mt-0.5">
                <Smartphone className="w-3.5 h-3.5" />
                <span>+91 {user.mobile}</span>
              </div>
              {user.userId && (
                <div className="text-[10px] text-blue-300 font-mono">
                  ID: @{user.userId}
                </div>
              )}
              <div className="text-[10px] text-amber-400 font-semibold mt-0.5 flex items-center gap-1">
                <Shield className="w-3 h-3" /> CRIS Verified Passenger
              </div>
            </div>
          </div>

          {/* Quick Edit Profile Button */}
          <button
            onClick={() => {
              setActiveSection(activeSection === 'EDIT_PROFILE' ? 'MAIN' : 'EDIT_PROFILE');
              setStatusMessage('');
              setErrorMessage('');
            }}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition flex items-center gap-1 text-xs font-bold border border-white/15"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit</span>
          </button>
        </div>

        {/* Quick Wallet Summary in Profile */}
        <div className="mt-4 pt-3 border-t border-white/10 flex justify-between items-center text-xs">
          <span className="text-blue-200">R-Wallet Balance:</span>
          <span className="font-bold text-amber-400">₹{user.wallet || 100}.00</span>
        </div>
      </div>

      {/* Global Status / Error Message */}
      {statusMessage && (
        <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}
      {errorMessage && (
        <div className="bg-rose-50 border border-rose-200 p-2.5 rounded-xl text-xs text-rose-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* =========================================================================
          SECTION 1: EDIT PROFILE FORM (With Avatar Picker & Photo Upload)
         ========================================================================= */}
      {activeSection === 'EDIT_PROFILE' && (
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4 animate-in slide-in-from-top-2">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-black text-slate-800 flex items-center gap-1.5">
              <Edit3 className="w-4 h-4 text-blue-600" />
              Edit Personal Profile
            </h3>
            <button 
              onClick={() => setActiveSection('MAIN')}
              className="text-xs font-bold text-slate-400 hover:text-slate-600"
            >
              Cancel
            </button>
          </div>

          {/* Avatar Selection Carousel / Picker */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase">Choose Profile Avatar</label>
            <div className="flex items-center space-x-2.5 mt-2 overflow-x-auto pb-1">
              {DEFAULT_AVATARS.map((av, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => {
                    setAvatarUrl(av);
                    saveAvatarOnly(av);
                  }}
                  className={`relative w-11 h-11 rounded-xl overflow-hidden shrink-0 border-2 transition ${
                    avatarUrl === av ? 'border-blue-600 scale-105 shadow-md' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <img src={av} alt="avatar" className="w-full h-full object-cover" />
                </button>
              ))}

              {/* Upload Custom Photo Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-11 h-11 rounded-xl border-2 border-dashed border-blue-400 bg-blue-50/60 hover:bg-blue-100 text-blue-700 flex flex-col items-center justify-center shrink-0 transition"
                title="Upload Photo from device"
              >
                <Camera className="w-4 h-4" />
                <span className="text-[8px] font-bold mt-0.5">Upload</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-3">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase">Full Name</label>
              <input 
                type="text"
                required
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-900 outline-none mt-1 focus:bg-white focus:border-blue-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Gender</label>
                <select 
                  value={editGender}
                  onChange={(e) => setEditGender(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-900 outline-none mt-1 focus:bg-white focus:border-blue-600"
                >
                  <option value="M">Male (M)</option>
                  <option value="F">Female (F)</option>
                  <option value="T">Transgender (T)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">City / District</label>
                <input 
                  type="text"
                  placeholder="e.g. New Delhi"
                  value={editCity}
                  onChange={(e) => setEditCity(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-900 outline-none mt-1 focus:bg-white focus:border-blue-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">State</label>
                <input 
                  type="text"
                  placeholder="e.g. Delhi / UP"
                  value={editState}
                  onChange={(e) => setEditState(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-900 outline-none mt-1 focus:bg-white focus:border-blue-600"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Pincode</label>
                <input 
                  type="text"
                  maxLength={6}
                  placeholder="6-digit PIN"
                  value={editPincode}
                  onChange={(e) => setEditPincode(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-900 outline-none mt-1 focus:bg-white focus:border-blue-600"
                />
              </div>
            </div>

            {/* Read-Only Verified Identifiers */}
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-[11px] space-y-1.5 text-slate-500">
              <div className="flex justify-between">
                <span>Verified Mobile:</span>
                <span className="font-bold text-slate-700">+91 {user.mobile}</span>
              </div>
              <div className="flex justify-between">
                <span>Verified Email:</span>
                <span className="font-bold text-slate-700">{user.email}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-700 hover:bg-blue-800 disabled:bg-blue-300 text-white font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? "Saving to PostgreSQL..." : "Save Profile Changes"}</span>
            </button>
          </form>
        </div>
      )}

      {/* =========================================================================
          SECTION 2: MAIN PROFILE NAVIGATION
         ========================================================================= */}
      {activeSection === 'MAIN' && (
        <div className="space-y-3">
          {/* Quick Actions List */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm divide-y divide-slate-100 overflow-hidden text-xs">
            <button 
              onClick={() => setActiveSection('EDIT_PROFILE')}
              className="w-full p-3.5 flex items-center justify-between hover:bg-slate-50 transition text-left"
            >
              <div className="flex items-center space-x-3">
                <Edit3 className="w-4 h-4 text-blue-600" />
                <span className="font-bold text-slate-800">{t('editPersonalDetails')}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>

            <button 
              onClick={() => setActiveSection('HISTORY')}
              className="w-full p-3.5 flex items-center justify-between hover:bg-slate-50 transition text-left"
            >
              <div className="flex items-center space-x-3">
                <History className="w-4 h-4 text-blue-600" />
                <span className="font-bold text-slate-800">{t('myBookingsAndJourneyHistory')}</span>
              </div>
              <div className="flex items-center text-slate-400">
                <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full mr-2">
                  {bookings ? bookings.length : 0}
                </span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </button>

            <button 
              onClick={() => setActiveSection('PASSENGERS')}
              className="w-full p-3.5 flex items-center justify-between hover:bg-slate-50 transition text-left"
            >
              <div className="flex items-center space-x-3">
                <User className="w-4 h-4 text-indigo-600" />
                <span className="font-bold text-slate-800">{t('masterPassengerList')}</span>
              </div>
              <div className="flex items-center text-slate-400">
                <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded-full mr-2">
                  {savedPassengers.length}
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>
            </button>

            <button 
              onClick={() => onOpenAuth('RESET')}
              className="w-full p-3.5 flex items-center justify-between hover:bg-slate-50 transition text-left"
            >
              <div className="flex items-center space-x-3">
                <KeyRound className="w-4 h-4 text-emerald-600" />
                <span className="font-bold text-slate-800">{t('changeMpinPassword')}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          {/* App Settings */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm divide-y divide-slate-100 overflow-hidden text-xs">
            <div className="p-3.5 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Globe className="w-4 h-4 text-slate-500" />
                <span className="font-bold text-slate-800">{t('appLanguage')}</span>
              </div>
              <select 
                value={selectedLanguage}
                onChange={(e) => handleUpdateLanguage(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg p-1 text-xs font-semibold outline-none focus:border-blue-600"
              >
                <option value="English">English</option>
                <option value="Hindi">हिंदी (Hindi)</option>
                <option value="Bengali">বাংলা (Bengali)</option>
                <option value="Marathi">मराठी (Marathi)</option>
              </select>
            </div>

            <div className="p-3.5 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Bell className="w-4 h-4 text-slate-500" />
                <span className="font-bold text-slate-800">{t('tripWhatsappAlerts')}</span>
              </div>
              <button
                type="button"
                onClick={handleToggleWhatsappAlerts}
                className={`text-[10px] font-bold px-2.5 py-1 rounded-full border transition active:scale-95 ${
                  whatsappAlerts 
                    ? 'text-emerald-700 bg-emerald-50 border-emerald-200' 
                    : 'text-slate-500 bg-slate-100 border-slate-200'
                }`}
              >
                {whatsappAlerts ? t('active') : t('muted')}
              </button>
            </div>
          </div>

          {/* LOGOUT BUTTON */}
          <button 
            onClick={onLogout}
            className="w-full bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold py-3 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-sm transition active:scale-95"
          >
            <LogOut className="w-4 h-4" />
            <span>{t('logoutFromRailOne')}</span>
          </button>
        </div>
      )}

      {/* =========================================================================
          SECTION 3: BOOKINGS HISTORY
         ========================================================================= */}
      {activeSection === 'HISTORY' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">All Booked Tickets</h3>
            <button 
              onClick={() => setActiveSection('MAIN')}
              className="text-xs font-bold text-blue-600"
            >
              &larr; Back to Profile
            </button>
          </div>

          {bookings && bookings.length > 0 ? (
            bookings.map((b) => (
              <div key={b.pnr} className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-mono font-bold text-blue-900">PNR: {b.pnr}</span>
                  <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                    {b.status} ({b.quota})
                  </span>
                </div>
                <div className="text-xs font-bold text-slate-800">
                  {b.trainNumber} - {b.trainName}
                </div>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>{b.from} ➔ {b.to}</span>
                  <span>Coach {b.coach}-{b.seat}</span>
                </div>
                <button 
                  onClick={() => onOpenTicketModal(b)}
                  className="w-full mt-2 bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 rounded-xl text-xs"
                >
                  View Digital Ticket / QR
                </button>
              </div>
            ))
          ) : (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center text-xs text-slate-500">
              No journey history found. Book your first train ticket!
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          SECTION 4: MASTER PASSENGER LIST
         ========================================================================= */}
      {activeSection === 'PASSENGERS' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Saved Master Passengers</h3>
            <button 
              onClick={() => setActiveSection('MAIN')}
              className="text-xs font-bold text-blue-600"
            >
              &larr; Back to Profile
            </button>
          </div>

          {/* Add or Edit Passenger Form */}
          {editingPassengerId ? (
            <form onSubmit={handleUpdatePassenger} className="bg-amber-50/60 p-4 rounded-2xl border border-amber-200 shadow-sm space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-amber-900 flex items-center gap-1.5">
                  <Edit3 className="w-3.5 h-3.5 text-amber-700" />
                  Edit Passenger Details
                </h4>
                <button
                  type="button"
                  onClick={() => setEditingPassengerId(null)}
                  className="text-[10px] font-bold text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>
              </div>

              {/* Gender Radio-style Tabs */}
              <div className="flex gap-2">
                {[
                  { id: 'Male', label: 'Male' },
                  { id: 'Female', label: 'Female' },
                  { id: 'Trans', label: 'Trans Gender' }
                ].map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setEditPassGender(g.id)}
                    className={`flex-1 py-2 px-1 rounded-xl border flex flex-col items-center justify-center gap-1 text-[11px] font-bold transition ${
                      editPassGender === g.id
                        ? 'border-blue-600 bg-blue-50/60 text-blue-700 shadow-sm'
                        : 'border-slate-200 bg-white text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    <User className="w-4 h-4" />
                    <span>{g.label}</span>
                  </button>
                ))}
              </div>

              {/* Full Name */}
              <input 
                type="text"
                required
                placeholder="Full Name"
                value={editPassName}
                onChange={(e) => setEditPassName(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-medium text-slate-800 placeholder-slate-400 outline-none focus:border-blue-600 shadow-sm"
              />

              {/* DOB */}
              <input 
                type="text"
                placeholder="DOB (YYYY-MM-DD or DD/MM/YYYY)"
                value={editPassDob}
                onChange={(e) => {
                  setEditPassDob(e.target.value);
                  const year = parseInt(e.target.value.slice(0, 4), 10);
                  if (year > 1900 && year < 2026) {
                    setEditPassAge((new Date().getFullYear() - year).toString());
                  }
                }}
                className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-medium text-slate-800 placeholder-slate-400 outline-none focus:border-blue-600 shadow-sm"
              />

              {/* Berth Preferences */}
              <div className="relative">
                <select
                  value={editPassBerth}
                  onChange={(e) => setEditPassBerth(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-medium text-slate-700 outline-none appearance-none focus:border-blue-600 shadow-sm pr-8"
                >
                  <option value="Berth Preferences">Berth Preferences</option>
                  <option value="No Preference">No Preference</option>
                  <option value="Lower">Lower</option>
                  <option value="Middle">Middle</option>
                  <option value="Upper">Upper</option>
                  <option value="Side Lower">Side Lower</option>
                  <option value="Side Upper">Side Upper</option>
                  <option value="Window Side">Window Side (Cabin)</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-blue-600">
                  <ChevronRight className="w-4 h-4 rotate-90" />
                </div>
              </div>

              <div className="flex gap-2">
                <button 
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-1 shadow"
                >
                  <span>{loading ? "Updating..." : "Update Passenger"}</span>
                </button>
                <button 
                  type="button"
                  onClick={() => setEditingPassengerId(null)}
                  className="px-4 bg-white border border-slate-200 text-slate-700 font-bold py-3 rounded-xl text-xs hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm space-y-3.5">
              {/* Form Title exactly matching user screenshot */}
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">Add Passenger</h3>
                <button 
                  onClick={() => setActiveSection('MAIN')}
                  className="w-6 h-6 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-50 text-xs"
                >
                  ✕
                </button>
              </div>

              {/* 1. GENDER RADIO CARDS (Male | Female | Trans Gender) */}
              <div className="flex gap-2">
                {[
                  { id: 'Male', label: 'Male' },
                  { id: 'Female', label: 'Female' },
                  { id: 'Trans', label: 'Trans Gender' }
                ].map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setNewPassGender(g.id)}
                    className={`flex-1 py-3 px-1 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition ${
                      newPassGender === g.id
                        ? 'border-blue-600 bg-blue-50/50 text-blue-600 shadow-sm ring-1 ring-blue-600'
                        : 'border-slate-200 bg-white text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    <User className={`w-5 h-5 ${newPassGender === g.id ? 'text-blue-600' : 'text-slate-400'}`} />
                    <span className="text-[10px] font-bold">{g.label}</span>
                  </button>
                ))}
              </div>

              {/* 2. FULL NAME */}
              <input 
                type="text"
                required
                placeholder="Full Name"
                value={newPassName}
                onChange={(e) => setNewPassName(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-2xl p-3.5 text-xs font-semibold text-slate-800 placeholder-slate-400 outline-none focus:border-blue-600 shadow-sm"
              />

              {/* 3. DOB */}
              <input 
                type="text"
                placeholder="DOB"
                value={newPassDob}
                onChange={(e) => {
                  setNewPassDob(e.target.value);
                  const year = parseInt(e.target.value.slice(0, 4), 10);
                  if (year > 1900 && year < 2026) {
                    setNewPassAge((new Date().getFullYear() - year).toString());
                  }
                }}
                className="w-full bg-white border border-slate-200 rounded-2xl p-3.5 text-xs font-semibold text-slate-800 placeholder-slate-400 outline-none focus:border-blue-600 shadow-sm"
              />

              {/* 4. BERTH PREFERENCES */}
              <div className="relative">
                <select
                  value={newPassBerth}
                  onChange={(e) => setNewPassBerth(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-2xl p-3.5 text-xs font-medium text-slate-600 outline-none appearance-none focus:border-blue-600 shadow-sm pr-9"
                >
                  <option value="Berth Preferences">Berth Preferences</option>
                  <option value="No Preference">No Preference</option>
                  <option value="Lower">Lower Berth</option>
                  <option value="Middle">Middle Berth</option>
                  <option value="Upper">Upper Berth</option>
                  <option value="Side Lower">Side Lower</option>
                  <option value="Side Upper">Side Upper</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-blue-600">
                  <ChevronRight className="w-4 h-4 rotate-90" />
                </div>
              </div>

              {/* 5. ADD PASSENGER BUTTON */}
              <button 
                type="button"
                onClick={handleAddPassenger}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-2xl text-xs flex items-center justify-center gap-1 shadow active:scale-[0.99] transition"
              >
                <span>{loading ? "Adding..." : "Add Passenger"}</span>
              </button>
            </div>
          )}

          {/* Master Passenger List */}
          <div className="space-y-2 pt-2">
            <h4 className="text-[11px] font-bold text-slate-500 uppercase px-1">Master Passenger Records</h4>
            {savedPassengers && savedPassengers.length > 0 ? (
              savedPassengers.map(p => (
                <div key={p.id} className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{p.name}</span>
                      {p.isIdVerified && (
                        <span className="text-[9px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                          <CheckCircle2 className="w-2.5 h-2.5" /> AADHAAR VERIFIED
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {p.age} Yrs • {p.gender === 'F' ? 'Female' : (p.gender === 'T' ? 'Trans' : 'Male')} • Berth: {p.berth}
                    </div>
                    {p.idCardNumber && (
                      <div className="text-[10px] font-mono text-slate-500">
                        {p.idCardType || 'Aadhaar'}: •••• •••• {p.idCardNumber.slice(-4)}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button 
                      onClick={() => startEditPassenger(p)}
                      title="Edit Passenger"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => handleDeletePassenger(p.id)}
                      title="Delete Passenger"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center text-xs text-slate-500">
                No passengers in master list yet. Add one above!
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
