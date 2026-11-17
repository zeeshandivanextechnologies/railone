import React, { useState, useEffect } from 'react';
import MobileHeader from './components/MobileHeader.jsx';
import MobileBottomNav from './components/MobileBottomNav.jsx';
import WelcomeScreen from './components/WelcomeScreen.jsx';
import HomePanel from './components/HomePanel.jsx';
import BookingPanel from './components/BookingPanel.jsx';
import TrackingPanel from './components/TrackingPanel.jsx';
import ServicesPanel from './components/ServicesPanel.jsx';
import ProfilePanel from './components/ProfilePanel.jsx';
import AdminPanel from './components/AdminPanel.jsx';
import TicketModal from './components/TicketModal.jsx';
import AuthModal from './components/AuthModal.jsx';
import UTSPlatformPanel from './components/UTSPlatformPanel.jsx';
import RWalletPanel from './components/RWalletPanel.jsx';
import RailMadadPanel from './components/RailMadadPanel.jsx';
import ECateringPanel from './components/ECateringPanel.jsx';
import MyTripsPanel from './components/MyTripsPanel.jsx';
import { STATIONS, INITIAL_TRAINS, INITIAL_BOOKINGS } from './data/railData.js';
import { passengerApi } from './services/passengerApi.js';
import { User, LogIn, ShieldAlert } from 'lucide-react';
import { LanguageProvider, useLanguage } from './context/LanguageContext.jsx';

function AppContent({
  user,
  setUser,
  activeTab,
  setActiveTab,
  hasEnteredApp,
  setHasEnteredApp,
  trains,
  setTrains,
  bookings,
  setBookings,
  selectedTicketForModal,
  setSelectedTicketForModal,
  walletBalance,
  setWalletBalance,
  authModalState,
  setAuthModalState,
  handleOpenAuth,
  handleLoginSuccess,
  handleUpdateUser,
  handleLogout,
  handleBookSuccess,
  handleCancelBooking,
  handleUpdateTrainDelay,
  handleAddTrain,
  sharedOriginStation,
  setSharedOriginStation,
  sharedDestStation,
  setSharedDestStation,
  stations,
  trackingTrainNumber,
  setTrackingTrainNumber
}) {
  const { t, language, changeLanguage } = useLanguage();

  const getHeaderTitle = () => {
    switch (activeTab) {
      case 'home': return t('railone');
      case 'booking': return t('ticketBooking');
      case 'uts': return t('utsUnreserved');
      case 'trips': return t('myTripsAndPasses');
      case 'tracking': return t('liveTrainAndPnr');
      case 'wallet': return t('crisRWallet');
      case 'ecatering': return t('foodOnTrack');
      case 'madad': return t('railMadadHelp');
      case 'services': return t('allTravelServices');
      case 'profile': return t('myProfileAccount');
      case 'admin': return 'Operations Admin';
      default: return t('railone');
    }
  };

  const getHeaderSubtitle = () => {
    switch (activeTab) {
      case 'home': return t('indianRailwaysSuperApp');
      case 'booking': return t('irctcUnifiedEngine');
      case 'uts': return t('paperlessSuburban');
      case 'trips': return t('reservedAndSuburbanLedger');
      case 'tracking': return t('gpsCoachPosition');
      case 'wallet': return t('instantDiscountBalance');
      case 'ecatering': return t('irctcSeatDeliveryMeals');
      case 'madad': return t('trainCaptainGrievance');
      case 'services': return t('pantryWalletSupport');
      case 'profile': return user ? `${user.name}` : t('crisPassengerAccount');
      case 'admin': return 'Live Status & Route Manager';
      default: return '';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex justify-center items-stretch antialiased selection:bg-blue-600 selection:text-white">
      <main className="w-full max-w-md bg-slate-50 h-screen relative flex flex-col shadow-2xl overflow-hidden">
        
        {/* FIRST INTERFACE / WELCOME SCREEN */}
        {!hasEnteredApp ? (
          <div className="flex-1 overflow-y-auto">
            <WelcomeScreen 
              onGetStarted={() => handleOpenAuth('LOGIN')}
              onGuestExplore={() => setHasEnteredApp(true)}
            />
          </div>
        ) : (
          /* MAIN APP INTERFACE (After Login / Entering) */
          <>
            {/* Fixed Mobile Header with simulated status bar */}
            <MobileHeader 
              title={getHeaderTitle()} 
              subtitle={getHeaderSubtitle()}
              showBack={activeTab !== 'home'}
              onBack={() => setActiveTab('home')}
              rightAction={
                user ? (
                  <button 
                    onClick={() => setActiveTab('profile')}
                    title="View Profile"
                    className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/20 active:scale-95 transition flex items-center justify-center bg-amber-400 text-blue-950 shadow-xs shrink-0"
                  >
                    {user.avatarUrl ? (
                      <img 
                        src={user.avatarUrl} 
                        alt={user.name} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="font-black text-xs leading-none">
                        {user.name.charAt(0)}
                      </span>
                    )}
                  </button>
                ) : (
                  <button 
                    onClick={() => handleOpenAuth('LOGIN')}
                    className="bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg border border-white/20 flex items-center gap-1 active:scale-95 transition"
                  >
                    <LogIn className="w-3.5 h-3.5 text-amber-400" />
                    <span>Sign In</span>
                  </button>
                )
              }
            />

            {/* Scrollable View Content - Header remains strictly fixed at top */}
            <div className="flex-1 overflow-y-auto relative scroll-smooth">
              <section className="min-h-full pb-20">
                {/* 1. HOME SCREEN */}
                {activeTab === 'home' && (
                  <HomePanel 
                    onNavigate={(tab, params) => {
                      if (params?.trainNumber) {
                        setTrackingTrainNumber(params.trainNumber);
                      }
                      setActiveTab(tab);
                    }}
                    bookings={bookings}
                    trains={trains}
                    openTicketModal={(ticket) => setSelectedTicketForModal(ticket)}
                    walletBalance={walletBalance}
                    fromStation={sharedOriginStation}
                    setFromStation={setSharedOriginStation}
                    toStation={sharedDestStation}
                    setToStation={setSharedDestStation}
                  />
                )}

                {/* 2. RESERVED BOOKING SCREEN */}
                {activeTab === 'booking' && (
                  <BookingPanel 
                    stations={stations}
                    trains={trains}
                    user={user}
                    walletBalance={walletBalance}
                    setWalletBalance={setWalletBalance}
                    onBookSuccess={handleBookSuccess}
                    onOpenAuth={handleOpenAuth}
                    initialFromStation={sharedOriginStation}
                    initialToStation={sharedDestStation}
                    onStationsChange={(f, t) => {
                      if (f) setSharedOriginStation(f);
                      if (t) setSharedDestStation(t);
                    }}
                    onUpdateUser={handleUpdateUser}
                  />
                )}

                {/* 3. UTS & PLATFORM TICKETING SCREEN */}
                {activeTab === 'uts' && (
                  <UTSPlatformPanel 
                    stations={stations}
                    user={user}
                    walletBalance={walletBalance}
                    setWalletBalance={setWalletBalance}
                    onBookSuccess={handleBookSuccess}
                    onOpenTicketModal={(ticket) => setSelectedTicketForModal(ticket)}
                    onOpenAuth={handleOpenAuth}
                    initialFromStation={sharedOriginStation}
                    initialToStation={sharedDestStation}
                    onUpdateUser={handleUpdateUser}
                  />
                )}

                {/* 4. MY TRIPS & PASSES SCREEN */}
                {activeTab === 'trips' && (
                  <MyTripsPanel 
                    bookings={bookings}
                    user={user}
                    onOpenTicketModal={(ticket) => setSelectedTicketForModal(ticket)}
                    onCancelBooking={handleCancelBooking}
                    onRefreshBookings={async () => {
                      const fresh = await passengerApi.getBookings(INITIAL_BOOKINGS, user?.id || null);
                      setBookings(fresh);
                    }}
                  />
                )}

                {/* 5. LIVE TRAIN & COACH POSITION SCREEN */}
                {activeTab === 'tracking' && (
                  <TrackingPanel 
                    trains={trains}
                    bookings={bookings}
                    initialTrainNumber={trackingTrainNumber}
                  />
                )}

                {/* 6. R-WALLET SCREEN */}
                {activeTab === 'wallet' && (
                  <RWalletPanel 
                    user={user}
                    walletBalance={walletBalance}
                    setWalletBalance={setWalletBalance}
                    onOpenAuth={handleOpenAuth}
                    onUpdateUser={handleUpdateUser}
                  />
                )}

                {/* 7. E-CATERING / FOOD ON TRACK SCREEN */}
                {activeTab === 'ecatering' && (
                  <ECateringPanel 
                    bookings={bookings}
                    onNavigateToWallet={() => setActiveTab('wallet')}
                  />
                )}

                {/* 8. RAIL MADAD COMPLAINTS SCREEN */}
                {activeTab === 'madad' && (
                  <RailMadadPanel 
                    user={user}
                    bookings={bookings}
                  />
                )}

                {/* 9. SERVICES HUB */}
                {activeTab === 'services' && (
                  <ServicesPanel 
                    bookings={bookings}
                    user={user}
                    walletBalance={walletBalance}
                    setWalletBalance={setWalletBalance}
                    onOpenAuth={handleOpenAuth}
                    onNavigate={(tab) => setActiveTab(tab)}
                  />
                )}

                {/* 10. PROFILE & MASTER PASSENGERS SCREEN */}
                {activeTab === 'profile' && (
                  <ProfilePanel 
                    user={user}
                    walletBalance={walletBalance}
                    onLogout={handleLogout}
                    onOpenAuth={handleOpenAuth}
                    bookings={bookings}
                    onOpenTicketModal={(ticket) => setSelectedTicketForModal(ticket)}
                    onUpdateUser={handleUpdateUser}
                  />
                )}

                {/* 11. ADMIN OPERATIONS SCREEN */}
                {activeTab === 'admin' && (
                  <AdminPanel 
                    trains={trains}
                    onUpdateTrainDelay={handleUpdateTrainDelay}
                    onAddTrain={handleAddTrain}
                  />
                )}
              </section>
            </div>

            {/* Persistent Bottom Mobile Navigation Bar */}
            <MobileBottomNav 
              activeTab={activeTab} 
              setActiveTab={setActiveTab} 
            />
          </>
        )}

        {/* QR Code Digital Ticket View Modal */}
        {selectedTicketForModal && (
          <TicketModal 
            ticket={selectedTicketForModal}
            onClose={() => setSelectedTicketForModal(null)}
          />
        )}

        {/* Authentication Modal (Login / Register / Forgot / Reset / OTP) */}
        <AuthModal 
          isOpen={authModalState.isOpen}
          initialMode={authModalState.mode}
          onClose={() => setAuthModalState({ isOpen: false, mode: 'LOGIN' })}
          onLoginSuccess={handleLoginSuccess}
        />
      </main>
    </div>
  );
}

export default function App() {
  // First Interface state: Starts on Welcome Screen unless already visited or logged in
  const [hasEnteredApp, setHasEnteredApp] = useState(() => {
    return localStorage.getItem('railone_has_entered') === 'true';
  });

  // Active Screen / Tab Navigation: persistent across page reloads
  // 'home' | 'booking' | 'uts' | 'trips' | 'tracking' | 'wallet' | 'ecatering' | 'madad' | 'services' | 'profile' | 'admin'
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('railone_active_tab') || 'home';
  });

  const [trains, setTrains] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [stations, setStations] = useState([]);
  const [selectedTicketForModal, setSelectedTicketForModal] = useState(null);
  const [walletBalance, setWalletBalance] = useState(480);
  const [trackingTrainNumber, setTrackingTrainNumber] = useState('');

  // Global shared station search state between HomePanel and BookingPanel
  const [sharedOriginStation, setSharedOriginStation] = useState({ code: 'NDLS', name: 'New Delhi' });
  const [sharedDestStation, setSharedDestStation] = useState({ code: 'MMCT', name: 'Mumbai Central' });

  // Authentication State: persistent across page reloads
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('railone_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [authModalState, setAuthModalState] = useState({ isOpen: false, mode: 'LOGIN' });

  // Sync user, activeTab, and hasEnteredApp to localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem('railone_user', JSON.stringify(user));
      if (user.wallet !== undefined) {
        setWalletBalance(parseFloat(user.wallet));
      }
    } else {
      localStorage.removeItem('railone_user');
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem('railone_active_tab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    localStorage.setItem('railone_has_entered', hasEnteredApp ? 'true' : 'false');
  }, [hasEnteredApp]);

  // Fetch Live Trains, Bookings & Stations from Backend PostgreSQL
  useEffect(() => {
    const fetchInitialData = async () => {
      const [liveTrains, liveBookings, liveStations] = await Promise.all([
        passengerApi.getTrains(),
        passengerApi.getBookings([], user?.id || null),
        passengerApi.getStations()
      ]);
      if (liveTrains && liveTrains.length > 0) setTrains(liveTrains);
      if (liveBookings) setBookings(liveBookings);
      if (liveStations && liveStations.length > 0) {
        setStations(liveStations);
        const ndls = liveStations.find(s => s.code === 'NDLS') || liveStations[0];
        const mmct = liveStations.find(s => s.code === 'MMCT') || liveStations[1] || liveStations[0];
        if (ndls) setSharedOriginStation(ndls);
        if (mmct) setSharedDestStation(mmct);
      }
    };
    fetchInitialData();
  }, [user?.id]);

  // Add new booking from Reserved or UTS
  const handleBookSuccess = (newBooking) => {
    setBookings(prev => [newBooking, ...prev]);
    passengerApi.createBooking(newBooking);
  };

  // Cancel booking
  const handleCancelBooking = (pnr) => {
    setBookings(prev => prev.filter(b => b.pnr !== pnr));
    passengerApi.cancelBooking(pnr);
  };

  // Admin updates live status of a train
  const handleUpdateTrainDelay = (trainNumber, updatedLiveStatus) => {
    setTrains(prevTrains =>
      prevTrains.map(t =>
        t.number === trainNumber
          ? {
              ...t,
              liveStatus: {
                ...t.liveStatus,
                ...updatedLiveStatus,
                updatedAt: 'Just now'
              }
            }
          : t
      )
    );
  };

  // Admin adds a brand new train
  const handleAddTrain = (newTrain) => {
    setTrains(prev => [newTrain, ...prev]);
  };

  // Auth Handlers
  const handleOpenAuth = (mode = 'LOGIN') => {
    setAuthModalState({ isOpen: true, mode });
  };

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    if (userData.wallet) {
      setWalletBalance(userData.wallet);
    }
    setAuthModalState({ isOpen: false, mode: 'LOGIN' });
    setHasEnteredApp(true);
  };

  const handleUpdateUser = (updatedUserData) => {
    setUser(prev => ({ ...prev, ...updatedUserData }));
  };

  const handleLogout = () => {
    if (confirm("Are you sure you want to logout from RailOne?")) {
      setUser(null);
      localStorage.removeItem('railone_user');
      localStorage.removeItem('railone_has_entered');
      localStorage.setItem('railone_active_tab', 'home');
      setHasEnteredApp(false);
      setActiveTab('home');
    }
  };

  return (
    <LanguageProvider 
      currentLanguage={user?.appLanguage || localStorage.getItem('railone_language') || 'English'}
      onLanguageChange={(newLang) => {
        if (user && user.id) {
          handleUpdateUser({ appLanguage: newLang });
        }
      }}
    >
      <AppContent 
        user={user}
        setUser={setUser}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        hasEnteredApp={hasEnteredApp}
        setHasEnteredApp={setHasEnteredApp}
        trains={trains}
        setTrains={setTrains}
        bookings={bookings}
        setBookings={setBookings}
        selectedTicketForModal={selectedTicketForModal}
        setSelectedTicketForModal={setSelectedTicketForModal}
        walletBalance={walletBalance}
        setWalletBalance={setWalletBalance}
        authModalState={authModalState}
        setAuthModalState={setAuthModalState}
        handleOpenAuth={handleOpenAuth}
        handleLoginSuccess={handleLoginSuccess}
        handleUpdateUser={handleUpdateUser}
        handleLogout={handleLogout}
        handleBookSuccess={handleBookSuccess}
        handleCancelBooking={handleCancelBooking}
        handleUpdateTrainDelay={handleUpdateTrainDelay}
        handleAddTrain={handleAddTrain}
        sharedOriginStation={sharedOriginStation}
        setSharedOriginStation={setSharedOriginStation}
        sharedDestStation={sharedDestStation}
        setSharedDestStation={setSharedDestStation}
        stations={stations}
        trackingTrainNumber={trackingTrainNumber}
        setTrackingTrainNumber={setTrackingTrainNumber}
      />
    </LanguageProvider>
  );
}
