import React from 'react';

export default function WalletLiquidityPage() {
  return (
    <div className="p-4  space-y-6 w-full">
      <div>
        <h2 className="text-lg font-bold text-slate-900">CRIS R-Wallet Financial Float Control</h2>
        <p className="text-xs text-slate-500">Total RBI-compliant wallet float maintained across all registered passenger accounts</p>
      </div>

      <div className="admin-card p-6 space-y-4">
        <h3 className="text-base font-bold text-slate-900">Reserve & Liquidity Overview</h3>
        <p className="text-xs text-slate-500">Live reconciliation of passenger wallet balances and automated refund settlement pipeline</p>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs mt-3">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <span className="text-slate-500 font-semibold uppercase text-[10px]">Total Float Reserve</span>
            <div className="text-xl font-bold text-slate-900 mt-1">₹184.62 Cr</div>
            <div className="text-[11px] text-emerald-600 mt-1 font-medium">100% Escrow Backed</div>
          </div>
          
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <span className="text-slate-500 font-semibold uppercase text-[10px]">Today's Recharges</span>
            <div className="text-xl font-bold text-emerald-600 mt-1">₹14.28 Cr</div>
            <div className="text-[11px] text-slate-500 mt-1">Via UPI, Net Banking & Cards</div>
          </div>
          
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <span className="text-slate-500 font-semibold uppercase text-[10px]">3% Cashback Rebate Given</span>
            <div className="text-xl font-bold text-blue-600 mt-1">₹42.84 Lakh</div>
            <div className="text-[11px] text-slate-500 mt-1">Incentive on UTS Paperless Tickets</div>
          </div>
        </div>
      </div>
    </div>
  );
}
