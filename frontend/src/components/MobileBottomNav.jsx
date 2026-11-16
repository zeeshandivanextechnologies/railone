import React from 'react';
import { 
  Home, 
  Ticket, 
  Compass, 
  Briefcase, 
  Wallet, 
  User, 
  ShieldCheck 
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.jsx';

export default function MobileBottomNav({ activeTab, setActiveTab }) {
  const { t } = useLanguage();

  const tabs = [
    { id: 'home', label: t('home'), icon: Home },
    { id: 'booking', label: t('booking'), icon: Ticket },
    { id: 'trips', label: t('trips'), icon: Briefcase },
    { id: 'tracking', label: t('tracking'), icon: Compass },
    { id: 'wallet', label: t('wallet'), icon: Wallet },
    { id: 'profile', label: t('account'), icon: User }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto z-40 bg-white/95 backdrop-blur-xl border-t border-slate-100 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-2 py-1.5 flex justify-between items-center">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center justify-center flex-1 py-1 px-0.5 rounded-2xl transition-all duration-200 relative ${
              isActive 
                ? 'text-blue-600' 
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <div className={`p-1.5 rounded-xl transition-all duration-200 ${
              isActive ? 'bg-blue-50 text-blue-600 -translate-y-0.5' : 'bg-transparent'
            }`}>
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.2px]' : 'stroke-[1.7px]'}`} />
            </div>
            <span className={`text-[9.5px] tracking-tight mt-0.5 ${
              isActive ? 'font-bold text-blue-600' : 'font-medium text-slate-500'
            }`}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
