import React, { useState } from 'react';
import { 
  UtensilsCrossed, 
  LifeBuoy, 
  Wallet, 
  Plus, 
  CheckCircle, 
  AlertTriangle, 
  Send,
  Coffee,
  ShoppingBag
} from 'lucide-react';

export default function ServicesPanel({ bookings }) {
  const [activeTab, setActiveTab] = useState('FOOD'); // FOOD | MADAD | WALLET
  const [walletBalance, setWalletBalance] = useState(480);
  const [complaintText, setComplaintText] = useState('');
  const [complaintCategory, setComplaintCategory] = useState('CLEANLINESS');
  const [submittedMadad, setSubmittedMadad] = useState(false);

  const foodItems = [
    { id: 1, name: "North Indian Standard Thali", vendor: "Haldiram's", price: 180, station: "Kota Jn" },
    { id: 2, name: "Veg Cheese Pizza & Cold Drink", vendor: "Domino's", price: 249, station: "New Delhi" },
    { id: 3, name: "Fresh Masala Tea + Samosa (2 pcs)", vendor: "Chai Point", price: 70, station: "Kanpur Central" }
  ];

  const handleOrderFood = (item) => {
    alert(`Order Placed for "${item.name}" from ${item.vendor}! It will be delivered to your coach seat.`);
  };

  const handleMadadSubmit = (e) => {
    e.preventDefault();
    setSubmittedMadad(true);
    setTimeout(() => {
      setSubmittedMadad(false);
      setComplaintText('');
    }, 4000);
  };

  return (
    <div className="p-4 space-y-4 pb-24">
      {/* Tab Switcher */}
      <div className="bg-slate-200 p-1 rounded-2xl flex text-xs font-bold text-slate-700">
        <button 
          onClick={() => setActiveTab('FOOD')}
          className={`flex-1 py-2 rounded-xl transition ${activeTab === 'FOOD' ? 'bg-orange-600 text-white shadow' : 'hover:text-slate-900'}`}
        >
          e-Catering
        </button>
        <button 
          onClick={() => setActiveTab('MADAD')}
          className={`flex-1 py-2 rounded-xl transition ${activeTab === 'MADAD' ? 'bg-rose-600 text-white shadow' : 'hover:text-slate-900'}`}
        >
          Rail Madad
        </button>
        <button 
          onClick={() => setActiveTab('WALLET')}
          className={`flex-1 py-2 rounded-xl transition ${activeTab === 'WALLET' ? 'bg-blue-700 text-white shadow' : 'hover:text-slate-900'}`}
        >
          R-Wallet
        </button>
      </div>

      {/* 1. Food on Track */}
      {activeTab === 'FOOD' && (
        <div className="space-y-3">
          <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white p-4 rounded-3xl shadow-md">
            <h2 className="text-base font-black flex items-center gap-2">
              <UtensilsCrossed className="w-5 h-5" /> Food Delivery at Seat
            </h2>
            <p className="text-xs text-orange-100 mt-1">Order hygienic food from IRCTC approved vendors straight to your berth.</p>
          </div>

          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
            Popular on Your Route
          </div>

          {foodItems.map(item => (
            <div key={item.id} className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900">{item.name}</h4>
                <div className="text-[10px] text-slate-400 mt-0.5">By {item.vendor} • {item.station}</div>
                <div className="text-xs font-black text-orange-600 mt-1">₹{item.price}</div>
              </div>
              <button 
                onClick={() => handleOrderFood(item)}
                className="bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-sm flex items-center gap-1"
              >
                <ShoppingBag className="w-3.5 h-3.5" /> Order
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 2. Rail Madad */}
      {activeTab === 'MADAD' && (
        <div className="space-y-3">
          <div className="bg-gradient-to-r from-rose-600 to-pink-600 text-white p-4 rounded-3xl shadow-md">
            <h2 className="text-base font-black flex items-center gap-2">
              <LifeBuoy className="w-5 h-5" /> Rail Madad Portal
            </h2>
            <p className="text-xs text-rose-100 mt-1">Instant Grievance Redressal & Passenger Help directly from CRIS.</p>
          </div>

          {submittedMadad ? (
            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl text-center space-y-2">
              <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto" />
              <h4 className="text-xs font-bold text-emerald-900">Complaint Registered!</h4>
              <p className="text-[10px] text-emerald-700">Ref ID: #RM-92813. Train staff on duty will attend your seat shortly.</p>
            </div>
          ) : (
            <form onSubmit={handleMadadSubmit} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Issue Type</label>
                <select 
                  value={complaintCategory}
                  onChange={(e) => setComplaintCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 outline-none mt-1"
                >
                  <option value="CLEANLINESS">Coach / Toilet Cleanliness</option>
                  <option value="ELECTRICAL">Fan / AC / Charging Point Not Working</option>
                  <option value="SECURITY">Security / Misbehavior / RPF Help</option>
                  <option value="WATER">Water Shortage in Coach</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Describe Grievance</label>
                <textarea 
                  required
                  rows="3"
                  placeholder="Tell us what is wrong with coach, seat or station..."
                  value={complaintText}
                  onChange={(e) => setComplaintText(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-800 outline-none mt-1 focus:border-rose-500"
                />
              </div>

              <button 
                type="submit"
                className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 rounded-xl text-xs shadow flex items-center justify-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" /> Submit to On-Duty Staff
              </button>
            </form>
          )}
        </div>
      )}

      {/* 3. R-Wallet */}
      {activeTab === 'WALLET' && (
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-blue-900 to-indigo-950 text-white p-5 rounded-3xl shadow-lg border border-blue-800">
            <span className="text-[10px] text-blue-300 font-bold tracking-widest uppercase">CRIS Official Digital Wallet</span>
            <div className="text-2xl font-black mt-2 text-amber-400">₹{walletBalance}.00</div>
            <p className="text-[11px] text-blue-200 mt-1">Get 3% instant discount on unreserved (UTS) & platform tickets.</p>
            
            <div className="flex gap-2 mt-4">
              <button 
                onClick={() => setWalletBalance(prev => prev + 500)}
                className="flex-1 bg-amber-400 hover:bg-amber-500 text-blue-950 font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1 shadow"
              >
                <Plus className="w-3.5 h-3.5" /> Add ₹500
              </button>
              <button 
                onClick={() => setWalletBalance(prev => prev + 1000)}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1 border border-white/20"
              >
                <Plus className="w-3.5 h-3.5" /> Add ₹1000
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

