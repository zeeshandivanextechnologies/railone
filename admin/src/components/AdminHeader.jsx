import React from 'react';
import { 
  Menu, 
  Bell, 
  Search, 
  Radio, 
  PanelLeftClose, 
  PanelLeft, 
  ExternalLink,
  ChevronDown
} from 'lucide-react';

export default function AdminHeader({ 
  title, 
  subtitle, 
  onToggleSidebar, 
  isCollapsed,
  onBroadcastClick,
  onOpenMobileMenu 
}) {
  return (
    <header className="h-16 border-b border-slate-200 bg-white px-4 flex items-center justify-between shrink-0 sticky top-0 z-30">
      {/* Left: Toggle & Title */}
      <div className="flex items-center space-x-3 lg:space-x-4">
        {/* Mobile Hamburger */}
        <button 
          onClick={onOpenMobileMenu}
          className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Desktop Toggle Button */}
        <button 
          onClick={onToggleSidebar}
          className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition items-center justify-center border border-slate-200"
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? (
            <PanelLeft className="w-4 h-4 text-blue-600" />
          ) : (
            <PanelLeftClose className="w-4 h-4 text-slate-500" />
          )}
        </button>

        <div>
          <h1 className="text-sm lg:text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            {title}
          </h1>
          {subtitle && (
            <p className="text-[11px] text-slate-500 font-normal hidden sm:block">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Right: Search & Actions */}
      <div className="flex items-center space-x-3">
        {/* Clean Search Input */}
        <div className="relative hidden md:block">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search Train, PNR, Station..." 
            className="w-48 lg:w-64 bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-blue-500 transition"
          />
        </div>

        {/* System Status */}
        <div className="hidden sm:flex bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg items-center space-x-1.5 text-[11px] font-semibold text-emerald-700">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Live Network</span>
        </div>

        {/* Emergency Alert Button */}
        <button 
          onClick={onBroadcastClick}
          className="bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 border border-amber-200 transition"
        >
          <Radio className="w-3.5 h-3.5 text-amber-600" />
          <span className="hidden sm:inline">Dispatch Alert</span>
        </button>

        {/* Notification Bell */}
        <button className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 border border-slate-200 relative transition">
          <Bell className="w-4 h-4" />
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 absolute top-2 right-2" />
        </button>
      </div>
    </header>
  );
}
