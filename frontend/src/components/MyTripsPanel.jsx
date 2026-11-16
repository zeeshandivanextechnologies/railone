import React, { useState, useEffect } from 'react';
import { 
  Ticket, 
  Search, 
  Calendar, 
  Train, 
  Clock, 
  Filter, 
  QrCode, 
  Share2, 
  Download, 
  AlertCircle,
  FileCheck,
  ChevronRight,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Loader2
} from 'lucide-react';

export default function MyTripsPanel({ bookings = [], user, onOpenTicketModal, onCancelBooking, onRefreshBookings }) {
  const [filterType, setFilterType] = useState('ALL'); // ALL | RESERVED | UTS | PLATFORM
  const [journeyStatusFilter, setJourneyStatusFilter] = useState('UPCOMING'); // UPCOMING | COMPLETED | CANCELLED
  const [searchQuery, setSearchQuery] = useState('');
  const [cancelledTicket, setCancelledTicket] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Auto-refresh from backend on panel mount
  useEffect(() => {
    if (onRefreshBookings) {
      onRefreshBookings();
    }
  }, []);

  const handleManualRefresh = async () => {
    if (onRefreshBookings) {
      setIsRefreshing(true);
      await onRefreshBookings();
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  // Filter bookings according to active tabs
  const filteredBookings = bookings.filter(b => {
    // Search query matching
    const matchesSearch = !searchQuery || 
      b.pnr.includes(searchQuery) || 
      b.trainName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.from.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.to.toLowerCase().includes(searchQuery.toLowerCase());

    // Type filter
    let matchesType = true;
    if (filterType === 'RESERVED') matchesType = b.ticketType === 'RESERVED';
    if (filterType === 'UTS') matchesType = b.ticketType?.includes('UTS') || b.ticketType?.includes('UNRESERVED');
    if (filterType === 'PLATFORM') matchesType = b.ticketType?.includes('PLATFORM');

    return matchesSearch && matchesType;
  });

  const handleCancelTicket = (booking) => {
    if (confirm(`Are you sure you want to cancel ticket PNR: ${booking.pnr}? Refund of ₹${Math.round(booking.fare * 0.85)} will be credited back to your R-Wallet.`)) {
      if (onCancelBooking) {
        onCancelBooking(booking.pnr);
      }
      setCancelledTicket(booking);
      setTimeout(() => setCancelledTicket(null), 3000);
    }
  };

  return (
    <div className="p-4 space-y-4 ">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-4 rounded-3xl shadow-lg relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="bg-amber-400 text-blue-950 font-black text-[10px] px-2 py-0.5 rounded shadow">CRIS</span>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-200">Unified Travel Ledger</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition active:scale-95 disabled:opacity-50"
              title="Sync with PostgreSQL Database"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
            <span className="text-[10px] text-amber-300 font-bold bg-white/10 px-2.5 py-1 rounded-full border border-white/15">
              {bookings.length} Bookings
            </span>
          </div>
        </div>
        <h2 className="text-base font-black mt-2 text-white">My Trips & Travel History</h2>
        <p className="text-[11px] text-blue-200 mt-0.5">
          Access all your Reserved (IRCTC) and Paperless Unreserved (UTS/Platform) tickets.
        </p>
      </div>

      {/* Ticket Category Tabs */}
      <div className="bg-slate-200 p-1 rounded-2xl flex text-xs font-bold text-slate-700">
        {[
          { id: 'ALL', label: 'All Trips' },
          { id: 'RESERVED', label: 'IRCTC Reserved' },
          { id: 'UTS', label: 'UTS General' },
          { id: 'PLATFORM', label: 'Platform' }
        ].map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilterType(tab.id)}
            className={`flex-1 py-2 rounded-xl transition ${
              filterType === tab.id ? 'bg-blue-700 text-white shadow' : 'hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input 
          type="text"
          placeholder="Search by PNR, Train, Station..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white border border-slate-200 rounded-2xl pl-10 pr-4 py-2.5 text-xs font-bold text-slate-800 outline-none shadow-xs"
        />
      </div>

      {/* Cancelled Banner if any */}
      {cancelledTicket && (
        <div className="bg-amber-50 border border-amber-200 p-3 rounded-2xl text-xs text-amber-900 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>Ticket <strong>{cancelledTicket.pnr}</strong> cancelled. Refund initiated to R-Wallet.</span>
        </div>
      )}

      {/* Bookings List */}
      <div className="space-y-3">
        {filteredBookings.length === 0 ? (
          <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center space-y-2">
            <Ticket className="w-10 h-10 text-slate-300 mx-auto" />
            <h4 className="text-xs font-bold text-slate-700">No journeys found in this category</h4>
            <p className="text-[10px] text-slate-400">Book new trains or paperless UTS tickets from the home tab.</p>
          </div>
        ) : (
          filteredBookings.map((ticket, index) => {
            const isUts = ticket.ticketType?.includes('UTS') || ticket.ticketType?.includes('UNRESERVED');
            const isPlatform = ticket.ticketType?.includes('PLATFORM');

            return (
              <div 
                key={ticket.pnr || index}
                className="bg-white border border-slate-200 rounded-3xl p-4 shadow-sm space-y-3 relative overflow-hidden"
              >
                {/* Header tag */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${
                      isPlatform ? 'bg-emerald-100 text-emerald-800' : (isUts ? 'bg-teal-100 text-teal-800' : 'bg-blue-100 text-blue-800')
                    }`}>
                      {ticket.ticketType || 'RESERVED'}
                    </span>
                    <span className="font-mono text-xs font-bold text-slate-500">PNR: {ticket.pnr}</span>
                  </div>

                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {ticket.status || 'CONFIRMED'}
                  </span>
                </div>

                {/* Train and Stations info */}
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-black text-slate-900">{ticket.from}</div>
                    <div className="text-[10px] text-slate-400">{ticket.departureTime || '10:00 AM'}</div>
                  </div>

                  <div className="text-center px-2">
                    <Train className="w-4 h-4 text-blue-600 mx-auto" />
                    <div className="text-[9px] font-bold text-slate-700 mt-0.5">{ticket.trainNumber}</div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-black text-slate-900">{ticket.to}</div>
                    <div className="text-[10px] text-slate-400">{ticket.arrivalTime || 'Next Day'}</div>
                  </div>
                </div>

                {/* Seat / Coach details */}
                <div className="flex justify-between items-center text-xs px-1">
                  <div>
                    <span className="text-[10px] text-slate-400">Coach / Seat: </span>
                    <strong className="text-slate-900">{ticket.coach} - {ticket.seat}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400">Class: </span>
                    <strong className="text-blue-700">{ticket.className || '3A'}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400">Fare: </span>
                    <strong className="text-slate-900">₹{ticket.fare}</strong>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="pt-2 border-t border-slate-100 flex gap-2">
                  <button
                    onClick={() => onOpenTicketModal(ticket)}
                    className="flex-1 bg-blue-700 hover:bg-blue-800 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>View QR</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => window.open(`http://localhost:5000/api/bookings/${encodeURIComponent(ticket.pnr)}/download-pdf`, '_blank')}
                    title="Download Official IRCTC E-Ticket PDF"
                    className="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1 transition active:scale-95"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>PDF</span>
                  </button>

                  <button
                    onClick={() => handleCancelTicket(ticket)}
                    className="bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-600 font-bold px-3 py-2 rounded-xl text-xs transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

