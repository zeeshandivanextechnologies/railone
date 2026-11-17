import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Train, ShieldCheck, Download, AlertTriangle, Lock } from 'lucide-react';

export default function TicketModal({ ticket, onClose }) {
  if (!ticket) return null;

  const isPaperlessUts = (ticket.ticketType || '').toUpperCase().includes('UTS') ||
                         (ticket.ticketType || '').toUpperCase().includes('PLATFORM') ||
                         (ticket.ticketType || '').toUpperCase().includes('SEASON') ||
                         (ticket.ticketType || '').toUpperCase().includes('UNRESERVED');

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 select-none"
      onContextMenu={(e) => isPaperlessUts && e.preventDefault()}
    >
      <div className={`w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl border border-slate-200 animate-in slide-in-from-bottom duration-200 ${isPaperlessUts ? 'print:hidden' : ''}`}>
        
        {/* Ticket Header */}
        <div className={`text-white p-4 flex items-center justify-between ${isPaperlessUts ? 'bg-gradient-to-r from-emerald-800 to-teal-900' : 'bg-gradient-to-r from-blue-900 to-indigo-900'}`}>
          <div className="flex items-center space-x-2">
            <span className={`font-black text-[10px] px-1.5 py-0.5 rounded ${isPaperlessUts ? 'bg-amber-400 text-emerald-950' : 'bg-amber-400 text-blue-950'}`}>
              {isPaperlessUts ? 'UTS' : 'CRIS'}
            </span>
            <span className="font-bold text-xs uppercase tracking-wider">
              {isPaperlessUts ? 'Paperless Mobile Ticket (Active)' : 'Indian Railways Digital Ticket'}
            </span>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-full bg-white/10 hover:bg-white/20 text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Ticket Body */}
        <div className="p-4 space-y-3">
          <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <div>
              <span className="text-[9px] font-bold text-slate-400 uppercase">PNR NUMBER</span>
              <div className="font-mono font-black text-sm text-blue-900">{ticket.pnr}</div>
            </div>
            <div className="text-right">
              <span className="text-[9px] font-bold text-slate-400 uppercase">STATUS</span>
              <div className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                {ticket.status} / {ticket.quota}
              </div>
            </div>
          </div>

          <div className="bg-blue-50/50 p-3 rounded-2xl border border-blue-100 flex items-center justify-between">
            <div>
              <div className="text-sm font-black text-slate-900">{ticket.from}</div>
              <div className="text-[10px] text-slate-500">{ticket.departureTime}</div>
            </div>
            <div className="text-center">
              <Train className="w-4 h-4 text-blue-600 mx-auto" />
              <div className="text-[9px] font-bold text-blue-800 mt-0.5">{ticket.trainNumber}</div>
            </div>
            <div className="text-right">
              <div className="text-sm font-black text-slate-900">{ticket.to}</div>
              <div className="text-[10px] text-slate-500">{ticket.arrivalTime}</div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-center text-xs">
            <div>
              <span className="text-[9px] font-bold text-slate-400 uppercase">Coach</span>
              <div className="font-black text-slate-900">{ticket.coach}</div>
            </div>
            <div>
              <span className="text-[9px] font-bold text-slate-400 uppercase">Berth/Seat</span>
              <div className="font-black text-indigo-700">{ticket.seat}</div>
            </div>
            <div>
              <span className="text-[9px] font-bold text-slate-400 uppercase">Class</span>
              <div className="font-black text-slate-900">{ticket.className}</div>
            </div>
          </div>

          {/* Passenger Details */}
          <div className="text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex justify-between">
            <div>
              <span className="text-[9px] font-bold text-slate-400 uppercase">Passenger</span>
              <div className="font-bold text-slate-900">{ticket.passengerName}</div>
            </div>
            <div className="text-right">
              <span className="text-[9px] font-bold text-slate-400 uppercase">Fare Paid</span>
              <div className="font-bold text-slate-900">₹{ticket.fare}</div>
            </div>
          </div>

          {/* CRIS Authentic QR Code with Complete Ticket Details */}
          <div className="flex flex-col items-center justify-center p-3.5 bg-white rounded-2xl border-2 border-dashed border-slate-200 relative">
            <QRCodeSVG 
              value={JSON.stringify({
                issuer: 'INDIAN RAILWAYS / CRIS RAILONE',
                pnr: ticket.pnr,
                ticketType: ticket.ticketType || 'RESERVED',
                train: `${ticket.trainNumber || ''} ${ticket.trainName || ''}`.trim(),
                from: ticket.from,
                to: ticket.to,
                departure: ticket.departureTime || '',
                arrival: ticket.arrivalTime || '',
                coach: ticket.coach,
                berth_seat: ticket.seat,
                class: ticket.className || ticket.classType || '',
                quota: ticket.quota || 'GN',
                passenger: ticket.passengerName || '',
                fare: `₹${ticket.fare}`,
                status: ticket.status || 'CONFIRMED',
                validity: ticket.validUntil || ticket.arrivalTime || 'Valid for travel',
                bookingDate: ticket.bookingDate || ticket.date || 'Today'
              })}
              size={145}
              level="M"
              includeMargin={true}
            />
            <span className="text-[10px] font-semibold text-slate-500 mt-2 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Scan for Complete Ticket Verification
            </span>
          </div>

          {/* Action or UTS Restriction Notice */}
          {isPaperlessUts ? (
            <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-2xl text-[11px] text-amber-900 flex items-start gap-2">
              <Lock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <strong>Non-transferable in-app ticket:</strong> Per Railway rules, General/Platform/Season tickets cannot be shared, printed or screenshotted. Show directly to TTE on screen.
              </div>
            </div>
          ) : (
            <button 
              onClick={() => {
                window.open(`http://localhost:5000/api/bookings/${encodeURIComponent(ticket.pnr)}/download-pdf`, '_blank');
              }}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow"
            >
              <Download className="w-3.5 h-3.5" /> Download Digital Ticket (PDF)
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

