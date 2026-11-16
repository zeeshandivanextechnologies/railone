import React, { useState, useEffect } from 'react';
import { 
  Wallet, 
  Plus, 
  ArrowUpRight, 
  ArrowDownLeft, 
  ShieldCheck, 
  Sparkles, 
  CreditCard, 
  History, 
  QrCode,
  CheckCircle2,
  Info,
  Clock,
  ChevronRight,
  AlertCircle,
  Loader2
} from 'lucide-react';
import confetti from 'canvas-confetti';

const API_WALLET = 'http://localhost:5000/api/wallet';
const RAZORPAY_KEY = 'rzp_test_TzcLjMRMDrl0cb';

export default function RWalletPanel({ user, walletBalance, setWalletBalance, onOpenAuth, onUpdateUser }) {
  const [addAmount, setAddAmount] = useState('');
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successTxnDetails, setSuccessTxnDetails] = useState(null);
  const [selectedMethod, setSelectedMethod] = useState('UPI');

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingWallet, setFetchingWallet] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // 1. Fetch live balance & transactions from PostgreSQL backend on mount
  useEffect(() => {
    if (user && user.id) {
      loadWalletData();
    }
  }, [user]);

  const loadWalletData = async () => {
    setFetchingWallet(true);
    try {
      const res = await fetch(`${API_WALLET}/${user.id}`);
      if (!res.ok) throw new Error('Failed to load wallet transactions');
      const data = await res.json();
      if (data.balance !== undefined) {
        setWalletBalance(data.balance);
      }
      if (data.transactions) {
        setTransactions(data.transactions);
      }
    } catch (err) {
      console.warn('Could not fetch wallet ledger:', err.message);
    } finally {
      setFetchingWallet(false);
    }
  };

  const handleQuickAdd = (amount) => {
    setSelectedPreset(amount);
    setAddAmount(amount.toString());
  };

  // 2. Dynamic Top-up submission via Razorpay Payment Gateway
  const handleTopUpSubmit = async (e) => {
    e.preventDefault();
    const val = parseFloat(addAmount);
    if (!val || val <= 0) {
      setErrorMessage("Please enter a valid amount to recharge.");
      setTimeout(() => setErrorMessage(''), 2500);
      return;
    }

    if (!user) {
      if (onOpenAuth) onOpenAuth('LOGIN');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      // Step A: Create Order on backend
      const orderRes = await fetch(`${API_WALLET}/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: val,
          userId: user.id
        })
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData.error || 'Failed to create Razorpay Order');

      // Step B: Ensure Razorpay SDK is loaded
      if (typeof window.Razorpay === 'undefined') {
        throw new Error('Razorpay SDK is loading. Please check internet connection.');
      }

      // Step C: Launch Razorpay Payment Modal
      const options = {
        key: orderData.keyId || RAZORPAY_KEY,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'CRIS RailOne R-Wallet',
        description: `Top-up of ₹${val} to R-Wallet`,
        image: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=120&auto=format&fit=crop&q=80',
        order_id: orderData.orderId,
        prefill: {
          name: user.name || 'CRIS Passenger',
          email: user.email || 'passenger@railone.in',
          contact: user.mobile || '9876543210'
        },
        theme: {
          color: '#1d4ed8' // RailOne brand blue
        },
        handler: async function (response) {
          try {
            // Step D: Verify payment signature on backend & credit PostgreSQL balance
            const verifyRes = await fetch(`${API_WALLET}/verify-payment`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: user.id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                amount: val,
                paymentMethod: selectedMethod
              })
            });

            const verifyData = await verifyRes.json();
            if (!verifyRes.ok) throw new Error(verifyData.error || 'Payment verification failed');

            // Update app balance & ledger
            setWalletBalance(verifyData.balance);
            if (onUpdateUser) {
              onUpdateUser({ ...user, wallet: verifyData.balance });
            }

            if (verifyData.transaction) {
              setTransactions(prev => [verifyData.transaction, ...prev]);
              setSuccessTxnDetails(verifyData.transaction);
            }

            setShowSuccessModal(true);
            setAddAmount('');
            setSelectedPreset(null);

            try {
              confetti({
                particleCount: 80,
                spread: 70,
                origin: { y: 0.5 }
              });
            } catch (_) {}
          } catch (verifyErr) {
            setErrorMessage(verifyErr.message || 'Payment verification failed');
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (resp) {
        setErrorMessage(resp.error.description || 'Payment cancelled or failed');
        setLoading(false);
      });
      rzp.open();

    } catch (err) {
      setErrorMessage(err.message || 'Payment initiation failed');
      setLoading(false);
    }
  };

  return (
    <div className="p-4 space-y-4 ">
      {/* Wallet Master Card */}
      <div className="bg-gradient-to-br from-blue-900 via-indigo-950 to-slate-950 text-white p-5 rounded-3xl shadow-xl border border-blue-800/80 relative overflow-hidden">
        {/* Glow */}
        <div className="absolute top-0 right-0 w-44 h-44 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="bg-amber-400 text-blue-950 font-black text-[10px] px-2 py-0.5 rounded shadow">CRIS</span>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-200">Official R-Wallet</span>
          </div>
          <div className="flex items-center space-x-1 text-[10px] text-amber-400 font-bold bg-amber-400/15 px-2.5 py-0.5 rounded-full border border-amber-400/20">
            <Sparkles className="w-3 h-3" />
            <span>3% Cashback Active</span>
          </div>
        </div>

        <div className="mt-4 flex items-baseline justify-between">
          <div>
            <span className="text-[11px] text-blue-300 font-medium">Available Balance</span>
            <div className="text-3xl font-black text-amber-400 tracking-tight mt-0.5">
              ₹{walletBalance.toFixed(2)}
            </div>
          </div>
          {fetchingWallet && (
            <span className="text-[10px] text-blue-300 flex items-center gap-1 animate-pulse">
              <Loader2 className="w-3 h-3 animate-spin" /> Syncing...
            </span>
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
          <span className="text-blue-200 text-[11px]">
            Linked to: +91 {user ? user.mobile : '9876543210'}
          </span>
          <span className="text-emerald-400 font-bold text-[11px] flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> RBI & Razorpay Secured
          </span>
        </div>
      </div>

      {/* Global Error Banner */}
      {errorMessage && (
        <div className="bg-rose-50 border border-rose-200 p-3 rounded-2xl text-xs text-rose-700 flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Add Money Card */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm space-y-3.5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <Plus className="w-4 h-4 text-blue-600" /> Add Money via Razorpay
          </h3>
          <span className="text-[10px] text-emerald-600 font-bold">Zero Gateway Charges</span>
        </div>

        <form onSubmit={handleTopUpSubmit} className="space-y-3">
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg font-black text-slate-400">₹</span>
            <input 
              type="number"
              min="1"
              max="50000"
              placeholder="Enter amount (e.g. 500)"
              value={addAmount}
              onChange={(e) => { setAddAmount(e.target.value); setSelectedPreset(null); }}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-8 pr-4 py-3 text-base font-black text-slate-900 outline-none focus:border-blue-600 focus:bg-white"
            />
          </div>

          {/* Quick preset chips */}
          <div className="grid grid-cols-4 gap-2">
            {[100, 200, 500, 1000].map(val => (
              <button
                type="button"
                key={val}
                onClick={() => handleQuickAdd(val)}
                className={`py-2 rounded-xl text-xs font-bold border transition ${
                  selectedPreset === val 
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm' 
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                +₹{val}
              </button>
            ))}
          </div>

          {/* Payment selection */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase">Payment Channel</label>
            <div className="grid grid-cols-3 gap-2 mt-1">
              {['UPI', 'Net Banking', 'Debit Card'].map(m => (
                <button
                  type="button"
                  key={m}
                  onClick={() => setSelectedMethod(m)}
                  className={`py-2 rounded-xl text-[11px] font-bold border transition ${
                    selectedMethod === m
                      ? 'bg-blue-50 border-blue-600 text-blue-900 ring-1 ring-blue-600'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-700 hover:bg-blue-800 disabled:bg-blue-300 text-white font-bold py-3.5 rounded-2xl text-xs shadow-lg shadow-blue-700/25 flex items-center justify-center gap-1.5 active:scale-95 transition"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Opening Razorpay Secure Gateway...</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>Proceed to Add ₹{addAmount || '0'}</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Perks Banner */}
      <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-2xl flex items-start space-x-2.5">
        <Sparkles className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <div>
          <div className="text-xs font-bold text-amber-950">Why use R-Wallet?</div>
          <p className="text-[11px] text-amber-900 mt-0.5">
            Enjoy instant ticket generation without payment gateway timeouts, 3% instant bonus rebate on all UTS paperless tickets, and 1-click refund credits.
          </p>
        </div>
      </div>

      {/* Transaction Passbook / History */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <History className="w-4 h-4 text-slate-500" /> Passbook & Ledger
          </h3>
          <button 
            type="button"
            onClick={loadWalletData}
            className="text-[11px] text-blue-600 font-semibold hover:underline"
          >
            Refresh
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {transactions && transactions.length > 0 ? (
            transactions.map(txn => (
              <div key={txn.id} className="py-2.5 flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black ${
                    txn.type === 'CREDIT' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {txn.type === 'CREDIT' ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">{txn.title}</div>
                    <div className="text-[10px] text-slate-400">{txn.date} • {txn.id}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-xs font-black ${
                    txn.type === 'CREDIT' ? 'text-emerald-600' : 'text-slate-900'
                  }`}>
                    {txn.type === 'CREDIT' ? '+' : '-'}₹{parseFloat(txn.amount).toFixed(2)}
                  </div>
                  {txn.cashback > 0 && (
                    <span className="text-[9px] text-amber-600 font-bold bg-amber-50 px-1.5 py-0.2 rounded">
                      +₹{txn.cashback} Saved
                    </span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="py-6 text-center text-xs text-slate-400">
              No previous wallet transactions found.
            </div>
          )}
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-xs w-full text-center space-y-3 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-base font-black text-slate-900">R-Wallet Recharged!</h3>
            <p className="text-xs text-slate-500">
              Razorpay payment was successful and credited to your PostgreSQL R-Wallet balance.
            </p>
            {successTxnDetails && (
              <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl text-left text-[11px] space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Transaction ID:</span>
                  <span className="font-mono font-bold text-slate-700">{successTxnDetails.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Amount Added:</span>
                  <span className="font-bold text-emerald-600">+₹{parseFloat(successTxnDetails.amount).toFixed(2)}</span>
                </div>
              </div>
            )}
            <button
              onClick={() => setShowSuccessModal(false)}
              className="w-full bg-blue-700 text-white font-bold py-2.5 rounded-xl text-xs shadow mt-2"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
