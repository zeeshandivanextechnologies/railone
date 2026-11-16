import React, { useState } from 'react';
import { 
  Ticket, 
  Search, 
  Download, 
  Filter
} from 'lucide-react';

export default function BookingsLedgerPage({ bookings, stats }) {
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = bookings.filter(b => 
    b.pnr.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.passenger.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.trainName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 space-y-6 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Ticket className="w-5 h-5 text-blue-600" />
            Passenger Ticketing & Revenue Ledger
          </h2>
          <p className="text-xs text-slate-500">Unified audit trail of Reserved IRCTC, UTS Paperless suburban and platform tickets</p>
        </div>

        <div className="flex items-center space-x-3 text-xs self-start sm:self-auto">
          <div className="admin-card px-3.5 py-2">
            <span className="text-slate-500">Total Bookings Today: </span>
            <strong className="text-slate-900 font-mono">24.81 Lakh</strong>
          </div>
          <button className="bg-white hover:bg-slate-50 text-slate-700 font-semibold px-3 py-2 rounded-lg border border-slate-200 flex items-center gap-1.5 transition">
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative w-full">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input 
          type="text" 
          placeholder="Filter by PNR, Passenger Name, Train..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-900 outline-none focus:border-blue-500 shadow-xs"
        />
      </div>

      {/* Table */}
      <div className="admin-card overflow-hidden w-full">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-xs min-w-[750px]">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3.5">PNR / Ticket Ref</th>
                <th className="py-2.5 px-3.5">Passenger Name</th>
                <th className="py-2.5 px-3.5">Train & Service</th>
                <th className="py-2.5 px-3.5">Journey Route</th>
                <th className="py-2.5 px-3.5">Class</th>
                <th className="py-2.5 px-3.5">Fare (₹)</th>
                <th className="py-2.5 px-3.5">Payment Method</th>
                <th className="py-2.5 px-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(b => (
                <tr key={b.pnr} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-3.5 font-mono font-semibold text-blue-600">
                    {b.pnr}
                  </td>
                  <td className="py-3 px-3.5 font-semibold text-slate-900">
                    {b.passenger}
                  </td>
                  <td className="py-3 px-3.5">
                    <div className="font-medium text-slate-800">{b.trainName}</div>
                    <div className="text-[10px] text-slate-400 font-mono">#{b.trainNumber}</div>
                  </td>
                  <td className="py-3 px-3.5 font-medium text-slate-700">
                    {b.from} <span className="text-slate-400 mx-1">➔</span> {b.to}
                  </td>
                  <td className="py-3 px-3.5">
                    <span className="bg-slate-100 text-slate-700 text-[10px] font-semibold px-2 py-0.5 rounded border border-slate-200">
                      {b.classType}
                    </span>
                  </td>
                  <td className="py-3 px-3.5 font-semibold text-slate-900 font-mono">
                    ₹{b.fare}
                  </td>
                  <td className="py-3 px-3.5 text-slate-600">
                    {b.paymentMethod}
                  </td>
                  <td className="py-3 px-3.5">
                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold px-2 py-0.5 rounded-full font-mono">
                      {b.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
