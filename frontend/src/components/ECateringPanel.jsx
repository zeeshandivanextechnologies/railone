import React, { useState } from 'react';
import { 
  UtensilsCrossed, 
  ShoppingBag, 
  MapPin, 
  Train, 
  Clock, 
  CheckCircle, 
  Search, 
  Plus, 
  Minus, 
  Trash2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CreditCard
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function ECateringPanel({ bookings, onNavigateToWallet }) {
  const [selectedStation, setSelectedStation] = useState('Kota Jn');
  const [searchFoodQuery, setSearchFoodQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL'); // ALL | THALI | FAST_FOOD | BEVERAGES | DESSERTS
  const [pnrInput, setPnrInput] = useState(bookings[0]?.pnr || '2847193021');
  const [cart, setCart] = useState({});
  const [orderConfirmed, setOrderConfirmed] = useState(null);

  const restaurants = [
    {
      id: 'res-1',
      name: "Haldiram's Sweets & Meals",
      station: 'Kota Jn',
      rating: '4.5',
      deliveryTime: 'At Platform arrival (18:40)',
      fssai: '10014011002341',
      menu: [
        { id: 'f1', name: 'Special Executive Thali', category: 'THALI', price: 240, desc: 'Paneer Butter Masala, Dal Makhani, 2 Parathas, Jeera Rice, Gulab Jamun & Raita', isVeg: true },
        { id: 'f2', name: 'Rajbhog Masala Chole Bhature', category: 'THALI', price: 160, desc: '2 Fluffy Bhature with spicy Amritsari chole & pickle', isVeg: true },
        { id: 'f3', name: 'Kaju Katli Box (250g)', category: 'DESSERTS', price: 290, desc: 'Fresh silver-foil cashew sweets in sealed box', isVeg: true }
      ]
    },
    {
      id: 'res-2',
      name: "Domino's Pizza On Track",
      station: 'Kota Jn',
      rating: '4.4',
      deliveryTime: 'Hot & Fresh in 25 mins',
      fssai: '10012011000120',
      menu: [
        { id: 'f4', name: 'Peppy Paneer Large Pizza', category: 'FAST_FOOD', price: 420, desc: 'Chunky paneer with crisp capsicum and spicy red pepper', isVeg: true },
        { id: 'f5', name: 'Garlic Breadsticks with Dip', category: 'FAST_FOOD', price: 139, desc: 'Baked to perfection with cheesy jalapeno dip', isVeg: true }
      ]
    },
    {
      id: 'res-3',
      name: "Chai Point & Snacks",
      station: 'New Delhi',
      rating: '4.6',
      deliveryTime: 'Immediate upon boarding',
      fssai: '10016042000281',
      menu: [
        { id: 'f6', name: 'Ginger Masala Chai (500ml Flask)', category: 'BEVERAGES', price: 150, desc: 'Hot herbal immunity kadha & authentic Indian chai', isVeg: true },
        { id: 'f7', name: 'Crispy Samosa Pair with Chutney', category: 'FAST_FOOD', price: 70, desc: 'Crispy potato filling served hot with mint dip', isVeg: true }
      ]
    }
  ];

  const addToCart = (item, res) => {
    setCart(prev => ({
      ...prev,
      [item.id]: {
        ...item,
        restaurantName: res.name,
        restaurantStation: res.station,
        qty: (prev[item.id]?.qty || 0) + 1
      }
    }));
  };

  const removeFromCart = (itemId) => {
    setCart(prev => {
      const current = { ...prev };
      if (!current[itemId]) return prev;
      if (current[itemId].qty <= 1) {
        delete current[itemId];
      } else {
        current[itemId].qty -= 1;
      }
      return current;
    });
  };

  const totalItemsCount = Object.values(cart).reduce((sum, item) => sum + item.qty, 0);
  const subtotal = Object.values(cart).reduce((sum, item) => sum + item.price * item.qty, 0);
  const deliveryFee = totalItemsCount > 0 ? 25 : 0;
  const grandTotal = subtotal + deliveryFee;

  const handlePlaceOrder = (e) => {
    e.preventDefault();
    if (totalItemsCount === 0) return;

    const newOrder = {
      orderId: `FO-${Math.floor(100000 + Math.random() * 900000)}`,
      pnr: pnrInput,
      items: Object.values(cart),
      total: grandTotal,
      station: selectedStation,
      deliveryCoach: bookings[0] ? `${bookings[0].coach}-${bookings[0].seat}` : 'B2-23',
      deliveryStatus: 'CONFIRMED TO BERTH'
    };

    setOrderConfirmed(newOrder);
    setCart({});

    try {
      confetti({
        particleCount: 75,
        spread: 60,
        origin: { y: 0.6 }
      });
    } catch (e) {}
  };

  return (
    <div className="p-4 space-y-4 pb-28">
      {/* Banner */}
      <div className="bg-gradient-to-r from-orange-600 via-amber-600 to-amber-700 text-white p-4 rounded-3xl shadow-lg relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="bg-white text-orange-700 font-black text-[10px] px-2 py-0.5 rounded shadow">IRCTC</span>
            <span className="text-xs font-bold uppercase tracking-wider text-orange-100">Food on Track</span>
          </div>
          <div className="flex items-center space-x-1 text-[10px] bg-white/15 px-2.5 py-1 rounded-full text-white font-bold border border-white/20">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
            <span>FSSAI Certified</span>
          </div>
        </div>
        <h2 className="text-base font-black mt-2 text-white">Deliver Fresh Meals to Your Seat</h2>
        <p className="text-[11px] text-orange-100 mt-0.5">
          Order from top branded restaurants at upcoming railway stations.
        </p>
      </div>

      {/* PNR & Delivery Station Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <label className="text-[9px] font-bold text-slate-400 uppercase">PNR / Ticket</label>
            <input 
              type="text"
              value={pnrInput}
              onChange={(e) => setPnrInput(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-bold text-slate-800 outline-none text-xs"
            />
          </div>
          <div>
            <label className="text-[9px] font-bold text-slate-400 uppercase">Delivery Station</label>
            <select 
              value={selectedStation}
              onChange={(e) => setSelectedStation(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-bold text-slate-800 outline-none text-xs"
            >
              <option value="Kota Jn">Kota Jn (ETA 18:40)</option>
              <option value="New Delhi">New Delhi (NDLS)</option>
              <option value="Kanpur Central">Kanpur Central (CNB)</option>
              <option value="Ratlam Jn">Ratlam Jn (RTM)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Category Filter Chips */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs font-bold">
        {[
          { id: 'ALL', label: 'All Items' },
          { id: 'THALI', label: 'Thalis & Meals' },
          { id: 'FAST_FOOD', label: 'Pizzas & Snacks' },
          { id: 'BEVERAGES', label: 'Chai & Drinks' },
          { id: 'DESSERTS', label: 'Sweets' }
        ].map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition ${
              selectedCategory === cat.id 
                ? 'bg-orange-600 text-white shadow-sm' 
                : 'bg-white text-slate-600 border border-slate-200'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Restaurant List & Food Items */}
      <div className="space-y-4">
        {restaurants.map(res => {
          const filteredItems = res.menu.filter(m => 
            selectedCategory === 'ALL' || m.category === selectedCategory
          );
          if (filteredItems.length === 0) return null;

          return (
            <div key={res.id} className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div>
                  <h3 className="text-xs font-black text-slate-900">{res.name}</h3>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {res.station} • ⭐ {res.rating} • {res.deliveryTime}
                  </div>
                </div>
                <span className="text-[9px] text-emerald-700 bg-emerald-50 border border-emerald-200 font-bold px-2 py-0.5 rounded-full">
                  FSSAI Verified
                </span>
              </div>

              <div className="space-y-2.5">
                {filteredItems.map(item => {
                  const inCartQty = cart[item.id]?.qty || 0;
                  return (
                    <div key={item.id} className="flex items-start justify-between py-1">
                      <div className="pr-3 flex-1">
                        <div className="flex items-center space-x-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block ring-1 ring-emerald-700" />
                          <h4 className="text-xs font-bold text-slate-800">{item.name}</h4>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">{item.desc}</p>
                        <div className="text-xs font-black text-slate-900 mt-1">₹{item.price}</div>
                      </div>

                      <div className="shrink-0">
                        {inCartQty === 0 ? (
                          <button
                            onClick={() => addToCart(item, res)}
                            className="bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-700 text-xs font-bold px-3 py-1.5 rounded-xl shadow-xs transition active:scale-95 flex items-center gap-1"
                          >
                            <Plus className="w-3.5 h-3.5" /> Add
                          </button>
                        ) : (
                          <div className="flex items-center space-x-1 bg-orange-600 text-white rounded-xl px-2 py-1 shadow-sm">
                            <button onClick={() => removeFromCart(item.id)} className="p-0.5">
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-xs font-black px-1.5">{inCartQty}</span>
                            <button onClick={() => addToCart(item, res)} className="p-0.5">
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Persistent Floating Cart Drawer when items present */}
      {totalItemsCount > 0 && (
        <div className="fixed bottom-20 left-0 right-0 max-w-md mx-auto px-4 z-40 animate-in slide-in-from-bottom duration-200">
          <div className="bg-slate-900 text-white p-3.5 rounded-2xl shadow-2xl border border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-[10px] text-amber-400 font-bold uppercase">{totalItemsCount} Item(s) in Cart</div>
              <div className="text-sm font-black text-white">₹{grandTotal} <span className="text-[10px] text-slate-400 font-normal">(Incl. ₹25 Delivery)</span></div>
            </div>
            <button
              onClick={handlePlaceOrder}
              className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-orange-500/30 active:scale-95 transition"
            >
              <span>Order to Seat</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {orderConfirmed && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-xs w-full text-center space-y-3.5 shadow-2xl animate-in zoom-in-95">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8" />
            </div>
            <div>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-black px-2.5 py-0.5 rounded-full uppercase">
                Order Dispatched
              </span>
              <h3 className="text-base font-black text-slate-900 mt-1">Food on Track Confirmed</h3>
              <p className="text-xs text-slate-500 font-mono mt-0.5">Order #{orderConfirmed.orderId}</p>
            </div>

            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-left text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Delivery At:</span>
                <span className="font-bold text-slate-800">{orderConfirmed.station}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Target Berth:</span>
                <span className="font-bold text-slate-800">{orderConfirmed.deliveryCoach}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Amount Paid:</span>
                <span className="font-bold text-emerald-600">₹{orderConfirmed.total} (Cash on Delivery / UPI)</span>
              </div>
            </div>

            <button
              onClick={() => setOrderConfirmed(null)}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-2.5 rounded-xl text-xs shadow"
            >
              Back to Services
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

