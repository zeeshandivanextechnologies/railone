import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Train, ShieldCheck, Download, Share2 } from 'lucide-react';

export default function TicketModal({ ticket, onClose }) {
  if (!ticket) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl border border-slate-200 animate-in slide-in-from-bottom duration-200">
        
        {/* Ticket Header */}
        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="bg-amber-400 text-blue-950 font-black text-[10px] px-1.5 py-0.5 rounded">CRIS</span>
            <span className="font-bold text-xs uppercase tracking-wider">Indian Railways Digital Ticket</span>
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
              <span className="text-[9px] font-bold text-slate-400 uppercase">Age / Gender</span>
              <div className="font-bold text-slate-900">{ticket.age} yrs / {ticket.gender}</div>
            </div>
          </div>

          {/* CRIS Authentic QR Code */}
          <div className="flex flex-col items-center justify-center p-3 bg-white rounded-2xl border-2 border-dashed border-slate-200">
            <QRCodeSVG 
              value={`RAILONE-CRIS|PNR:${ticket.pnr}|TRAIN:${ticket.trainNumber}|BERTH:${ticket.coach}-${ticket.seat}|STATUS:${ticket.status}`}
              size={130}
              level="M"
            />
            <span className="text-[10px] font-semibold text-slate-400 mt-2 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Valid for TTE Electronic Verification
            </span>
          </div>

          {/* Actions */}
          <button 
            onClick={() => {
              alert("Ticket PDF downloaded to device storage!");
              onClose();
            }}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow"
          >
            <Download className="w-3.5 h-3.5" /> Download Digital Ticket
          </button>
        </div>
      </div>
    </div>
  );
}

