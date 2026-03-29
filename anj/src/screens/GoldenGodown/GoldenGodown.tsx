import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '../../store/gameStore';
import { CROP_BASE_DATA } from '../../data/crops';

function fmt(n: number) { return '₹' + n.toLocaleString('en-IN'); }

export default function GoldenGodown({ onBack }: { onBack: () => void }) {
  const { t } = useTranslation();
  const { gameState, farmer, decideStoreGodown, pledgeGodown, sellFromGodown } = useGameStore();
  const [qty, setQty] = useState(10);

  if (!gameState || !farmer) return null;

  const crop = CROP_BASE_DATA[farmer.primaryCrop];
  const marketPrice = gameState.currentMarketPrice;
  const storageRegFee = 500; // arbitrary flat registration fee logic from decideStoreGodown

  const eNWRValue = gameState.grainInGodownQuintals * marketPrice;
  const maxPledge = Math.floor(eNWRValue * 0.70);
  const remainingPledge = Math.max(0, maxPledge - gameState.eNWRPledgeLoanTaken);

  return (
    <div className="pb-8 pt-6 min-h-screen relative bg-slate-50">
      
      <div className="px-5 mb-6">
         <button onClick={onBack} className="text-sm font-bold text-slate-400 mb-4 hover:text-slate-600 flex items-center gap-1">← वापस / Back</button>
        <h1 className="font-display text-4xl text-slate-800">Golden Godown</h1>
        <div className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mt-1">WDRA Certified eNWR Storage</div>
      </div>

      <div className="p-4 space-y-4">

        {/* ─── STATUS BAR ─── */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-amber-50 rounded-2xl p-4 shadow-sm border border-amber-100 flex flex-col items-center justify-center">
            <span className="text-[10px] uppercase font-bold tracking-widest text-amber-600/70 mb-1">🌾 Farm Storage</span>
            <span className="font-number text-2xl font-black text-amber-800">{gameState.grainOnFarmQuintals}<span className="text-sm text-amber-600/50 ml-1">q</span></span>
          </div>
          <div className={`rounded-2xl p-4 shadow-sm border flex flex-col items-center justify-center relative overflow-hidden ${gameState.grainInGodownQuintals > 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-100'}`}>
            {gameState.eNWRActive && <div className="absolute top-0 right-0 w-16 h-16 bg-amber-200 blur-2xl opacity-50"></div>}
            <span className={`text-[10px] uppercase font-bold tracking-widest mb-1 ${gameState.grainInGodownQuintals > 0 ? 'text-emerald-600/70' : 'text-slate-400'}`}>🏛️ Godown Storage</span>
            <span className={`font-number text-2xl font-black ${gameState.grainInGodownQuintals > 0 ? 'text-emerald-700' : 'text-slate-700'}`}>
              {gameState.grainInGodownQuintals}<span className={`text-sm ml-1 ${gameState.grainInGodownQuintals > 0 ? 'text-emerald-600/50' : 'text-slate-300'}`}>q</span>
            </span>
          </div>
        </div>

        {/* ─── DEPOSIT ─── */}
        {gameState.grainOnFarmQuintals >= 10 && !gameState.eNWRActive && (
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200">
             <h3 className="text-xs font-bold uppercase tracking-widest mb-4 text-slate-500 text-center flex items-center gap-2 justify-center">
              <span>📦</span> Deposit Grain (Min 10q)
            </h3>
            
            <div className="mb-4 bg-slate-50 p-4 border border-slate-100 rounded-xl">
               <div className="flex justify-between items-center mb-2">
                 <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Qty to Deposit</span>
                 <span className="font-number text-3xl font-black text-amber-600">{qty}q</span>
               </div>
               <input type="range" min={10} max={gameState.grainOnFarmQuintals} step={1} value={qty}
                 onChange={e => setQty(Number(e.target.value))}
                 className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-slate-200 accent-amber-500" />
            </div>

            <button onClick={() => decideStoreGodown(qty, storageRegFee)} disabled={gameState.cashInHand < storageRegFee}
              className="w-full btn-primary bg-amber-500 text-white font-bold py-4 rounded-xl shadow-md transition-all disabled:opacity-50">
               Deposit {qty}q (Fee: ₹{storageRegFee})
            </button>
            {gameState.cashInHand < storageRegFee && <div className="text-[10px] text-red-500 font-bold mt-2 text-center uppercase tracking-widest">Not enough cash</div>}
          </div>
        )}

        {/* ─── ACTIVE eNWR MANAGEMENT ─── */}
        {gameState.eNWRActive && (
          <div className="space-y-4">
            
            {/* Pledge Loan */}
            <div className="bg-indigo-50 rounded-3xl p-5 shadow-sm border border-indigo-200">
               <h3 className="text-xs font-bold uppercase tracking-widest mb-4 text-indigo-700 text-center flex items-center justify-center gap-2">
                 <span>🏦</span> Take Pledge Loan (70% Value)
               </h3>
               
               <div className="flex justify-between text-xs mb-3 font-bold border-b border-indigo-100 pb-3">
                 <span className="text-indigo-600/80 uppercase tracking-widest">Available Credit</span>
                 <span className="font-number font-black text-indigo-700 text-lg">{fmt(remainingPledge)}</span>
               </div>

               <div className="grid grid-cols-2 gap-2 mt-4">
                 <button onClick={() => pledgeGodown(Math.min(10000, remainingPledge))} disabled={remainingPledge < 1000}
                   className="bg-white text-indigo-700 py-3 rounded-xl border border-indigo-100 font-bold shadow-sm shadow-indigo-100 hover:border-indigo-300 disabled:opacity-50 transition-all">
                   ₹10,000
                 </button>
                 <button onClick={() => pledgeGodown(remainingPledge)} disabled={remainingPledge <= 0}
                   className="bg-indigo-600 text-white py-3 rounded-xl border-transparent font-bold shadow-md hover:bg-indigo-700 disabled:opacity-50 transition-all text-xs uppercase tracking-widest">
                   Max Loan (7% int.)
                 </button>
               </div>
            </div>

            {/* Sell Flow */}
            <div className="bg-emerald-50 rounded-3xl p-5 shadow-sm border border-emerald-200">
                <h3 className="text-xs font-bold uppercase tracking-widest mb-4 text-emerald-700 text-center flex items-center justify-center gap-2">
                 <span>💰</span> Sell from Godown (eNAM)
               </h3>

               <div className="bg-white p-4 rounded-xl border border-emerald-100 mb-4 shadow-sm text-center">
                 <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Current eNAM Value</div>
                 <div className="font-number text-4xl font-black text-emerald-600">{fmt(eNWRValue)}</div>
                 <div className="text-[10px] mt-1 font-bold text-slate-400">@ ₹{marketPrice}/q</div>
               </div>

               <button onClick={() => { sellFromGodown(gameState.grainInGodownQuintals); onBack(); }}
                 className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-black text-base uppercase tracking-widest py-4 rounded-xl shadow-lg shadow-emerald-500/30 transition-all active:scale-95">
                 Sell All Storage
               </button>
               <div className="text-center mt-3 text-[10px] font-bold uppercase tracking-wideset text-slate-400">Note: Selling subtracts storage cost & loans automatically</div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
