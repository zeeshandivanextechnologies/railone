import React from 'react';
import { 
  Train, 
  ShieldCheck, 
  Ticket, 
  MapPin, 
  CreditCard, 
  ArrowRight, 
  Zap, 
  ChevronRight, 
  Lock, 
  Sparkles,
  PhoneCall
} from 'lucide-react';

export default function WelcomeScreen({ onGetStarted, onGuestExplore }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-950 via-slate-900 to-slate-950 text-white flex flex-col justify-between p-6 relative overflow-hidden select-none">
      {/* Decorative Background Glows */}
      <div className="absolute -top-24 -left-24 w-72 h-72 bg-blue-600/25 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -right-24 w-80 h-80 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

      {/* Top CRIS / Indian Railways Branding */}
      <div className="pt-8 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
            <span className="bg-amber-400 text-blue-950 font-black text-[10px] px-1.5 py-0.5 rounded tracking-normal">
              CRIS
            </span>
            <span className="text-[11px] font-bold tracking-wider text-slate-200 uppercase">
              Indian Railways
            </span>
          </div>

          <div className="flex items-center space-x-1 text-[11px] text-amber-400 font-bold bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-400/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Super App</span>
          </div>
        </div>
      </div>

      {/* Center Hero Section */}
      <div className="py-6 z-10 flex flex-col items-center text-center">
        {/* Animated Train Icon Badge */}
        <div className="relative mb-6">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-amber-400 p-0.5 shadow-2xl shadow-blue-500/30">
            <div className="w-full h-full bg-slate-950/90 rounded-[22px] flex items-center justify-center">
              <Train className="w-12 h-12 text-amber-400 animate-pulse" />
            </div>
          </div>
          <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-slate-950 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow">
            All-In-One
          </div>
        </div>

        <h1 className="text-3xl font-black tracking-tight text-white">
          Rail<span className="text-amber-400">One</span>
        </h1>
        <p className="text-xs text-blue-200 mt-2 max-w-[280px] font-medium leading-relaxed">
          One unified platform for Reserved, UTS Local, Platform Tickets, Live GPS Tracking & e-Catering.
        </p>

        {/* 3 Key Feature Chips */}
        <div className="grid grid-cols-3 gap-2 w-full mt-8">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-2.5 rounded-2xl flex flex-col items-center">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 flex items-center justify-center mb-1">
              <Ticket className="w-4 h-4 text-blue-400" />
            </div>
            <span className="text-[10px] font-bold text-slate-200">IRCTC & UTS</span>
            <span className="text-[8px] text-slate-400">Zero Convenience</span>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-2.5 rounded-2xl flex flex-col items-center">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center mb-1">
              <MapPin className="w-4 h-4 text-amber-400" />
            </div>
            <span className="text-[10px] font-bold text-slate-200">Live GPS</span>
            <span className="text-[8px] text-slate-400">Coach Position</span>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-2.5 rounded-2xl flex flex-col items-center">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center mb-1">
              <CreditCard className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="text-[10px] font-bold text-slate-200">R-Wallet</span>
            <span className="text-[8px] text-slate-400">3% Extra Off</span>
          </div>
        </div>
      </div>

      {/* Bottom Action Area */}
      <div className="pb-6 z-10 space-y-3">
        <button
          onClick={onGetStarted}
          className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold py-3.5 rounded-2xl text-sm shadow-xl shadow-blue-900/50 flex items-center justify-center gap-2 transition active:scale-95"
        >
          <span>Sign In / Create Account</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        <button
          onClick={onGuestExplore}
          className="w-full bg-white/10 hover:bg-white/15 text-slate-200 font-semibold py-3 rounded-2xl text-xs backdrop-blur-md border border-white/15 transition active:scale-95 flex items-center justify-center gap-1.5"
        >
          <span>Explore App as Guest</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        </button>

        {/* Footer Note */}
        <div className="pt-2 text-center text-[10px] text-slate-500 flex items-center justify-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Official CRIS • Ministry of Railways, Govt of India</span>
        </div>
      </div>
    </div>
  );
}

