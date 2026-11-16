import React from 'react';
import { Wifi, BatteryMedium, Signal } from 'lucide-react';

export default function MobileHeader({ title, subtitle, showBack, onBack, rightAction }) {
  const [time, setTime] = React.useState('');

  React.useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-950 text-white shadow-md">
      {/* Mobile OS Status Bar */}
      {/* <div className="flex items-center justify-between px-5 pt-2 pb-1 text-xs font-semibold tracking-wider text-slate-300">
        <span>{time || "12:00"}</span>
        <div className="flex items-center space-x-2">
          <Signal className="w-3.5 h-3.5" />
          <Wifi className="w-3.5 h-3.5" />
          <BatteryMedium className="w-4 h-4" />
        </div>
      </div> */}

      {/* App Bar */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center space-x-3">
          {showBack && (
            <button 
              onClick={onBack}
              className="p-1 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 transition"
            >
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
              {!showBack && <span className="bg-amber-400 text-blue-950 text-[10px] font-black px-1.5 py-0.5 rounded tracking-normal">CRIS</span>}
              {title}
            </h1>
            {subtitle && <p className="text-[11px] text-blue-200">{subtitle}</p>}
          </div>
        </div>
        {rightAction && <div>{rightAction}</div>}
      </div>
    </header>
  );
}

