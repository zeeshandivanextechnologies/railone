import React, { createContext, useContext, useState, useEffect } from 'react';

// Comprehensive translations for Indian Railways RailOne Super App
export const TRANSLATIONS = {
  English: {
    // Navigation
    home: 'Home',
    booking: 'Bookings',
    trips: 'My Trips',
    tracking: 'Live Track',
    wallet: 'R-Wallet',
    account: 'Account',
    services: 'Services',
    admin: 'Operations',

    // Headers & Subtitles
    railone: 'RailOne',
    indianRailwaysSuperApp: 'Indian Railways Super App',
    ticketBooking: 'Ticket Booking',
    irctcUnifiedEngine: 'IRCTC Unified Engine',
    utsUnreserved: 'UTS Unreserved',
    paperlessSuburban: 'Paperless Suburban & Platform',
    myTripsAndPasses: 'My Trips & Passes',
    reservedAndSuburbanLedger: 'Reserved & Suburban Ledger',
    liveTrainAndPnr: 'Live Train & PNR',
    gpsCoachPosition: 'GPS & Coach Position',
    crisRWallet: 'CRIS R-Wallet',
    instantDiscountBalance: 'Instant 3% Discount Balance',
    foodOnTrack: 'Food on Track',
    irctcSeatDeliveryMeals: 'IRCTC Seat Delivery Meals',
    railMadadHelp: 'Rail Madad Help',
    trainCaptainGrievance: 'Direct Train Captain Grievance',
    allTravelServices: 'All Travel Services',
    pantryWalletSupport: 'Pantry, Wallet & Support',
    myProfileAccount: 'My Profile & Account',
    crisPassengerAccount: 'CRIS Passenger Account',

    // Home Screen
    welcomeToRailOne: 'Welcome to RailOne',
    helloTraveler: 'Hello, Traveler 👋',
    searchTrains: 'Search Trains',
    fromStation: 'From Station',
    toStation: 'To Station',
    travelDate: 'Travel Date',
    allClasses: 'All Classes',
    generalQuota: 'General Quota',
    findTrains: 'Find Trains',
    bookTicket: 'Book Ticket',
    utsSuburban: 'UTS Suburban',
    pnrStatus: 'PNR Status',
    liveTrainStatus: 'Live Train',
    orderFood: 'Order Food',
    railMadad: 'Rail Madad',
    upcomingJourney: 'Upcoming Journey',
    viewTicket: 'View Ticket',
    trackTrain: 'Track Train',

    // Profile Screen
    crisVerifiedPassenger: 'CRIS Verified Passenger',
    rWalletBalance: 'R-Wallet Balance',
    edit: 'Edit',
    editPersonalDetails: 'Edit Personal Details',
    myBookingsAndJourneyHistory: 'My Bookings & Journey History',
    masterPassengerList: 'Master Passenger List',
    changeMpinPassword: 'Change 4-Digit MPIN / Password',
    appLanguage: 'App Language',
    tripWhatsappAlerts: 'Trip WhatsApp Alerts',
    logoutFromRailOne: 'Logout from RailOne',
    cancel: 'Cancel',
    saveProfileChanges: 'Save Profile Changes',
    savingToPostgres: 'Saving to PostgreSQL...',
    fullName: 'Full Name',
    gender: 'Gender',
    male: 'Male (M)',
    female: 'Female (F)',
    transgender: 'Transgender (T)',
    cityDistrict: 'City / District',
    state: 'State',
    pincode: 'Pincode',
    verifiedMobile: 'Verified Mobile',
    verifiedEmail: 'Verified Email',
    chooseProfileAvatar: 'Choose Profile Avatar',
    upload: 'Upload',
    savedMasterPassengers: 'Saved Master Passengers',
    allBookedTickets: 'All Booked Tickets',
    backToProfile: 'Back to Profile',
    active: 'ACTIVE ✔',
    muted: 'MUTED ✕',
    addPassenger: 'Add Passenger for 1-Click Tatkal Booking',
    age: 'Age',
    berthPreference: 'Berth Preference',
    noPreference: 'No Preference',
    lower: 'Lower',
    middle: 'Middle',
    upper: 'Upper',
    sideLower: 'Side Lower',
    addToMasterList: 'Add to Master List'
  },

  Hindi: {
    // Navigation
    home: 'होम',
    booking: 'बुकिंग',
    trips: 'मेरी यात्राएं',
    tracking: 'लाइव ट्रैक',
    wallet: 'आर-वॉलेट',
    account: 'खाता',
    services: 'सेवाएं',
    admin: 'प्रबंधन',

    // Headers & Subtitles
    railone: 'रेलवन',
    indianRailwaysSuperApp: 'भारतीय रेल सुपर ऐप',
    ticketBooking: 'टिकट बुकिंग',
    irctcUnifiedEngine: 'आईआरसीटीसी एकीकृत इंजन',
    utsUnreserved: 'यूटीएस अनारक्षित',
    paperlessSuburban: 'कागज़ रहित उपनगरीय एवं प्लेटफॉर्म',
    myTripsAndPasses: 'मेरी यात्राएं एवं पास',
    reservedAndSuburbanLedger: 'आरक्षित एवं उपनगरीय खाता',
    liveTrainAndPnr: 'लाइव ट्रेन एवं पीएनआर',
    gpsCoachPosition: 'जीपीएस एवं कोच स्थिति',
    crisRWallet: 'क्रिस आर-वॉलेट',
    instantDiscountBalance: 'तत्काल 3% छूट शेष',
    foodOnTrack: 'ऑन-ट्रैक भोजन',
    irctcSeatDeliveryMeals: 'आईआरसीटीसी सीट डिलीवरी भोजन',
    railMadadHelp: 'रेल मदद सहायता',
    trainCaptainGrievance: 'ट्रेन कैप्टन सीधी शिकायत',
    allTravelServices: 'सभी यात्रा सेवाएं',
    pantryWalletSupport: 'पैंट्री, वॉलेट एवं सहायता',
    myProfileAccount: 'मेरा प्रोफाइल एवं खाता',
    crisPassengerAccount: 'क्रिस यात्री खाता',

    // Home Screen
    welcomeToRailOne: 'रेलवन में आपका स्वागत है',
    helloTraveler: 'नमस्ते, यात्री 👋',
    searchTrains: 'ट्रेन खोजें',
    fromStation: 'कहाँ से',
    toStation: 'कहाँ तक',
    travelDate: 'यात्रा तिथि',
    allClasses: 'सभी श्रेणियां',
    generalQuota: 'सामान्य कोटा',
    findTrains: 'ट्रेनें खोजें',
    bookTicket: 'टिकट बुक करें',
    utsSuburban: 'यूटीएस लोकल',
    pnrStatus: 'पीएनआर स्थिति',
    liveTrainStatus: 'लाइव ट्रेन',
    orderFood: 'खाना मंगाएं',
    railMadad: 'रेल मदद',
    upcomingJourney: 'आगामी यात्रा',
    viewTicket: 'टिकट देखें',
    trackTrain: 'ट्रेन ट्रैक करें',

    // Profile Screen
    crisVerifiedPassenger: 'क्रिस सत्यापित यात्री',
    rWalletBalance: 'आर-वॉलेट शेष',
    edit: 'संपादित करें',
    editPersonalDetails: 'व्यक्तिगत विवरण संपादित करें',
    myBookingsAndJourneyHistory: 'मेरी बुकिंग एवं यात्रा इतिहास',
    masterPassengerList: 'मास्टर यात्री सूची',
    changeMpinPassword: '4-अंकीय एमपिन / पासवर्ड बदलें',
    appLanguage: 'ऐप की भाषा',
    tripWhatsappAlerts: 'यात्रा व्हाट्सएप अलर्ट',
    logoutFromRailOne: 'रेलवन से लॉगआउट करें',
    cancel: 'रद्द करें',
    saveProfileChanges: 'बदलाव सहेजें',
    savingToPostgres: 'डेटाबेस में सहेजा जा रहा है...',
    fullName: 'पूरा नाम',
    gender: 'लिंग',
    male: 'पुरुष (M)',
    female: 'महिला (F)',
    transgender: 'ट्रांसजेंडर (T)',
    cityDistrict: 'शहर / ज़िला',
    state: 'राज्य',
    pincode: 'पिनकोड',
    verifiedMobile: 'सत्यापित मोबाइल',
    verifiedEmail: 'सत्यापित ईमेल',
    chooseProfileAvatar: 'प्रोफ़ाइल अवतार चुनें',
    upload: 'अपलोड',
    savedMasterPassengers: 'सहेजे गए मास्टर यात्री',
    allBookedTickets: 'सभी बुक किए गए टिकट',
    backToProfile: 'प्रोफ़ाइल पर वापस जाएं',
    active: 'सक्रिय ✔',
    muted: 'मूक ✕',
    addPassenger: '1-क्लिक तत्काल के लिए यात्री जोड़ें',
    age: 'आयु',
    berthPreference: 'बर्थ प्राथमिकता',
    noPreference: 'कोई प्राथमिकता नहीं',
    lower: 'निचला (Lower)',
    middle: 'मध्य (Middle)',
    upper: 'ऊपरी (Upper)',
    sideLower: 'साइड लोअर',
    addToMasterList: 'मास्टर सूची में जोड़ें'
  },

  Bengali: {
    // Navigation
    home: 'হোম',
    booking: 'বুকিং',
    trips: 'আমার ট্রিপ',
    tracking: 'লাইভ ট্র্যাক',
    wallet: 'আর-ওয়ালেট',
    account: 'অ্যাকাউন্ট',
    services: 'পরিষেবা',
    admin: 'অপারেশন',

    // Headers & Subtitles
    railone: 'রেলওয়ান',
    indianRailwaysSuperApp: 'ভারতীয় রেল সুপার অ্যাপ',
    ticketBooking: 'টিকিট বুকিং',
    irctcUnifiedEngine: 'আইআরসিটিসি ইঞ্জিন',
    utsUnreserved: 'ইউটিএস অনারক্ষিত',
    paperlessSuburban: 'কাগজবিহীন লোকাল ও প্ল্যাটফর্ম',
    myTripsAndPasses: 'আমার ভ্রমণ ও পাস',
    reservedAndSuburbanLedger: 'সংরক্ষিত ও শহরতলি খতিয়ান',
    liveTrainAndPnr: 'লাইভ ট্রেন ও পিএনআর',
    gpsCoachPosition: 'জিপিএস ও কামরার অবস্থান',
    crisRWallet: 'ক্রিস আর-ওয়ালেট',
    instantDiscountBalance: 'তাৎক্ষণিক ৩% ছাড় ব্যালেন্স',
    foodOnTrack: 'ট্র্যাক খাবার',
    irctcSeatDeliveryMeals: 'সিটে খাবার ডেলিভারি',
    railMadadHelp: 'রেল মদত সাহায্য',
    trainCaptainGrievance: 'ট্রেন ক্যাপ্টেন সরাসরি অভিযোগ',
    allTravelServices: 'সমস্ত ভ্রমণ পরিষেবা',
    pantryWalletSupport: 'প্যান্ট্রি, ওয়ালেট ও সাপোর্ট',
    myProfileAccount: 'আমার প্রোফাইল ও অ্যাকাউন্ট',
    crisPassengerAccount: 'ক্রিস যাত্রী অ্যাকাউন্ট',

    // Home Screen
    welcomeToRailOne: 'রেলওয়ানে স্বাগতম',
    helloTraveler: 'নমস্কার, যাত্রী 👋',
    searchTrains: 'ট্রেন খুঁজুন',
    fromStation: 'কোথা থেকে',
    toStation: 'কোথায়',
    travelDate: 'ভ্রমণের তারিখ',
    allClasses: 'সব শ্রেণি',
    generalQuota: 'সাধারণ কোটা',
    findTrains: 'ট্রেন খুঁজুন',
    bookTicket: 'টিকিট বুক করুন',
    utsSuburban: 'ইউটিএস লোকাল',
    pnrStatus: 'পিএনআর স্থিতি',
    liveTrainStatus: 'লাইভ ট্রেন',
    orderFood: 'খাবার অর্ডার করুন',
    railMadad: 'রেল মদত',
    upcomingJourney: 'আসন্ন ভ্রমণ',
    viewTicket: 'টিকিট দেখুন',
    trackTrain: 'ট্রেন ট্র্যাক করুন',

    // Profile Screen
    crisVerifiedPassenger: 'ক্রিস যাচাইকৃত যাত্রী',
    rWalletBalance: 'আর-ওয়ালেট ব্যালেন্স',
    edit: 'সম্পাদনা',
    editPersonalDetails: 'ব্যক্তিগত তথ্য সম্পাদনা',
    myBookingsAndJourneyHistory: 'আমার বুকিং ও ভ্রমণ ইতিহাস',
    masterPassengerList: 'মাস্টার যাত্রী তালিকা',
    changeMpinPassword: '৪-সংখ্যার এমপিন পরিবর্তন করুন',
    appLanguage: 'অ্যাপের ভাষা',
    tripWhatsappAlerts: 'হোয়াটসঅ্যাপ সতর্কতা',
    logoutFromRailOne: 'লগআউট করুন',
    cancel: 'বাতিল',
    saveProfileChanges: 'পরিবর্তন সংরক্ষণ করুন',
    savingToPostgres: 'সংরক্ষণ করা হচ্ছে...',
    fullName: 'পুরো নাম',
    gender: 'লিঙ্গ',
    male: 'পুরুষ (M)',
    female: 'মহিলা (F)',
    transgender: 'হিজড়া (T)',
    cityDistrict: 'শহর / জেলা',
    state: 'রাজ্য',
    pincode: 'পিনকোড',
    verifiedMobile: 'যাচাইকৃত মোবাইল',
    verifiedEmail: 'যাচাইকৃত ইমেল',
    chooseProfileAvatar: 'প্রোফাইল অবতার নির্বাচন করুন',
    upload: 'আপলোড',
    savedMasterPassengers: 'সংরক্ষিত যাত্রী তালিকা',
    allBookedTickets: 'সব বুকিং টিকিট',
    backToProfile: 'প্রোফাইলে ফিরুন',
    active: 'সক্রিয় ✔',
    muted: 'নিঃশব্দ ✕',
    addPassenger: 'তাত্ক্ষণিক বুকিংয়ের জন্য যাত্রী যোগ করুন',
    age: 'বয়স',
    berthPreference: 'বার্থ পছন্দ',
    noPreference: 'কোনো পছন্দ নেই',
    lower: 'লোয়ার',
    middle: 'মিডল',
    upper: 'আপার',
    sideLower: 'সাইড লোয়ার',
    addToMasterList: 'তালিকায় যোগ করুন'
  },

  Marathi: {
    // Navigation
    home: 'मुख्यपृष्ठ',
    booking: 'बुकिंग',
    trips: 'माझे प्रवास',
    tracking: 'थेट ट्रॅक',
    wallet: 'आर-वॉलेट',
    account: 'खाते',
    services: 'सेवा',
    admin: 'प्रशासन',

    // Headers & Subtitles
    railone: 'रेलवन',
    indianRailwaysSuperApp: 'भारतीय रेल्वे सुपर ॲप',
    ticketBooking: 'तिकीट बुकिंग',
    irctcUnifiedEngine: 'आयआरसीटीसी इंजिन',
    utsUnreserved: 'यूटीएस अनारक्षित',
    paperlessSuburban: 'कागदविरहित लोकल व प्लॅटफॉर्म',
    myTripsAndPasses: 'माझे प्रवास व पासेस',
    reservedAndSuburbanLedger: 'आरक्षित व उपनगरीय खाते',
    liveTrainAndPnr: 'थेट ट्रेन व पीएनआर',
    gpsCoachPosition: 'जीपीएस व डब्यांची स्थिती',
    crisRWallet: 'क्रिस आर-वॉलेट',
    instantDiscountBalance: 'तात्काळ ३% सवलत शिल्लक',
    foodOnTrack: 'ऑन-ट्रॅक जेवण',
    irctcSeatDeliveryMeals: 'आसनावरील जेवण वितरण',
    railMadadHelp: 'रेल मदत साहाय्य',
    trainCaptainGrievance: 'ट्रेन कॅप्टन थेट तक्रार',
    allTravelServices: 'सर्व प्रवास सेवा',
    pantryWalletSupport: 'पँट्री, वॉलेट व मदत',
    myProfileAccount: 'माझे प्रोफाइल व खाते',
    crisPassengerAccount: 'क्रिस प्रवासी खाते',

    // Home Screen
    welcomeToRailOne: 'रेलवनमध्ये आपले स्वागत आहे',
    helloTraveler: 'नमस्ते, प्रवासी 👋',
    searchTrains: 'ट्रेन शोधा',
    fromStation: 'येथून',
    toStation: 'येथे',
    travelDate: 'प्रवासाची तारीख',
    allClasses: 'सर्व वर्ग',
    generalQuota: 'सामान्य कोटा',
    findTrains: 'ट्रेन शोधा',
    bookTicket: 'तिकीट बुक करा',
    utsSuburban: 'यूटीएस लोकल',
    pnrStatus: 'पीएनआर स्थिती',
    liveTrainStatus: 'थेट ट्रेन',
    orderFood: 'जेवण मागवा',
    railMadad: 'रेल मदत',
    upcomingJourney: 'पुढील प्रवास',
    viewTicket: 'तिकीट पहा',
    trackTrain: 'ट्रेन ट्रॅक करा',

    // Profile Screen
    crisVerifiedPassenger: 'क्रिस सत्यापित प्रवासी',
    rWalletBalance: 'आर-वॉलेट शिल्लक',
    edit: 'संपादित करा',
    editPersonalDetails: 'वैयक्तिक माहिती संपादित करा',
    myBookingsAndJourneyHistory: 'माझी बुकिंग व प्रवास इतिहास',
    masterPassengerList: 'मास्टर प्रवासी यादी',
    changeMpinPassword: '४-अंकी एमपिन बदला',
    appLanguage: 'ॲपची भाषा',
    tripWhatsappAlerts: 'प्रवास व्हॉट्सॲप अलर्ट',
    logoutFromRailOne: 'लॉगआउट करा',
    cancel: 'रद्द करा',
    saveProfileChanges: 'बदल जतन करा',
    savingToPostgres: 'डेटाबेसमध्ये जतन करत आहे...',
    fullName: 'पूर्ण नाव',
    gender: 'लिंग',
    male: 'पुरुष (M)',
    female: 'स्त्री (F)',
    transgender: 'तृतीयपंथी (T)',
    cityDistrict: 'शहर / जिल्हा',
    state: 'राज्य',
    pincode: 'पिनकोड',
    verifiedMobile: 'सत्यापित मोबाईल',
    verifiedEmail: 'सत्यापित ईमेल',
    chooseProfileAvatar: 'प्रोफाइल अवतार निवडा',
    upload: 'अपलोड',
    savedMasterPassengers: 'जतन केलेले प्रवासी',
    allBookedTickets: 'सर्व बुक केलेली तिकिटे',
    backToProfile: 'प्रोफाइलवर परत जा',
    active: 'सक्रिय ✔',
    muted: 'मूक ✕',
    addPassenger: 'तत्काळसाठी प्रवासी जोडा',
    age: 'वय',
    berthPreference: 'बर्थ पसंती',
    noPreference: 'पसंती नाही',
    lower: 'खालचा (Lower)',
    middle: 'मधला (Middle)',
    upper: 'वरचा (Upper)',
    sideLower: 'साइड लोअर',
    addToMasterList: 'यादीत जोडा'
  }
};

const LanguageContext = createContext({
  language: 'English',
  setLanguage: () => {},
  t: (key) => key
});

export function LanguageProvider({ children, currentLanguage = 'English', onLanguageChange }) {
  const [language, setLanguageState] = useState(() => {
    return localStorage.getItem('railone_language') || currentLanguage || 'English';
  });

  useEffect(() => {
    if (currentLanguage && currentLanguage !== language) {
      setLanguageState(currentLanguage);
      localStorage.setItem('railone_language', currentLanguage);
    }
  }, [currentLanguage]);

  const changeLanguage = (newLang) => {
    setLanguageState(newLang);
    localStorage.setItem('railone_language', newLang);
    if (onLanguageChange) {
      onLanguageChange(newLang);
    }
  };

  const t = (key) => {
    const langDict = TRANSLATIONS[language] || TRANSLATIONS['English'];
    return langDict[key] || TRANSLATIONS['English'][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}

