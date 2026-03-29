import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '../../store/gameStore';

function fmt(n: number) { return '₹' + n.toLocaleString('en-IN'); }

export default function InputPurchase({ onBack }: { onBack: () => void }) {
  const { t } = useTranslation();
  const { gameState, farmer, buyInputs } = useGameStore();

  const [seed, setSeed] = useState<string | null>(null);
  const [fert, setFert] = useState<string | null>(null);
  const [pest, setPest] = useState<string | null>(null);

  if (!gameState || !farmer) return null;

  const ha = farmer.landHoldingHectares;
  
  // Base prices per hectare
  const GOVT_SEED = 2000 * ha;
  const HYV_SEED = 2800 * ha;
  const FERTILIZER = 3500 * ha;
  const PESTICIDE = 2500 * ha;

  const handleConfirm = () => {
    let cost = 0;
    let yieldMod = 1.0;
    let qualityMod = 0;

    if (seed === 'govt') { cost += GOVT_SEED; yieldMod = 1.0; qualityMod += 5; }
    else if (seed === 'hyv') { cost += HYV_SEED; yieldMod = 1.25; qualityMod += 10; }
    else if (seed === 'old') { yieldMod = 0.75; qualityMod -= 10; }

    if (fert === 'urea') { cost += FERTILIZER; yieldMod += 0.15; }
    else if (fert === 'skip') { yieldMod -= 0.20; } // Note: PRD says stress +5, omitted here for simplicity as we apply on purchase

    if (pest === 'buy') { cost += PESTICIDE; yieldMod += 0.05; } // Buffer for pest attack

    if (gameState.cashInHand < cost) return;

    buyInputs(cost, yieldMod, qualityMod);
    if (fert === 'skip') useGameStore.getState().setGameState({ stressLevel: Math.min(100, gameState.stressLevel + 5) });
    
    onBack();
  };

  const totalCost = (seed === 'govt' ? GOVT_SEED : seed === 'hyv' ? HYV_SEED : 0) +
                    (fert === 'urea' ? FERTILIZER : 0) +
                    (pest === 'buy' ? PESTICIDE : 0);

  return (
    <div className="min-h-screen bg-slate-50 pb-8 relative">
      <div className="px-5 pt-6 pb-4 bg-white shadow-sm border-b border-slate-100 z-10 relative">
        <button onClick={onBack} className="text-sm font-bold text-slate-400 mb-2 hover:text-slate-600 flex items-center gap-1">← वापस / Back</button>
        <div className="flex justify-between items-end">
          <div>
            <h1 className="font-display text-3xl text-slate-800">बीज और खाद</h1>
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              For {farmer.landHoldingHectares} Hectares
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Total Cost</div>
            <div className={`font-number text-2xl font-black ${gameState.cashInHand >= totalCost ? 'text-amber-600' : 'text-red-500'}`}>
              {fmt(totalCost)}
            </div>
            {gameState.cashInHand < totalCost && <div className="text-[10px] font-bold text-red-500">Not enough cash</div>}
          </div>
        </div>
      </div>

      <div className="p-4 space-y-5">

        {/* ─── SEEDS ─── */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3 px-1 flex items-center gap-2">
            🌱 बीज / Seeds <span className="text-red-500">*</span>
          </h2>
          <div className="space-y-2">
            <button onClick={() => setSeed('govt')} className={`w-full p-4 rounded-2xl flex justify-between items-center transition-all border shadow-sm ${seed === 'govt' ? 'bg-amber-50 border-amber-300 shadow-md' : 'bg-white border-slate-200 hover:border-amber-200'}`}>
              <div className="text-left">
                <div className={`font-bold ${seed === 'govt' ? 'text-amber-800' : 'text-slate-800'}`}>सरकारी बीज  / Govt Agency</div>
                <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500 mt-1">Lower cost, moderate yield</div>
              </div>
              <div className={`font-number font-black ${seed === 'govt' ? 'text-amber-600' : 'text-slate-600'}`}>{fmt(GOVT_SEED)}</div>
            </button>
            <button onClick={() => setSeed('hyv')} className={`w-full p-4 rounded-2xl flex justify-between items-center transition-all border shadow-sm ${seed === 'hyv' ? 'bg-emerald-50 border-emerald-300 shadow-md' : 'bg-white border-slate-200 hover:border-emerald-200'}`}>
               <div className="text-left">
                <div className={`font-bold ${seed === 'hyv' ? 'text-emerald-800' : 'text-slate-800'}`}>प्राइवेट HYV बीज / High Yield</div>
                <div className="text-[10px] font-bold uppercase tracking-wide text-emerald-600/80 mt-1">High cost, maximum yield</div>
              </div>
              <div className={`font-number font-black ${seed === 'hyv' ? 'text-emerald-600' : 'text-slate-600'}`}>{fmt(HYV_SEED)}</div>
            </button>
            <button onClick={() => setSeed('old')} className={`w-full p-4 rounded-2xl flex justify-between items-center transition-all border shadow-sm ${seed === 'old' ? 'bg-red-50 border-red-300 shadow-md' : 'bg-white border-slate-200 hover:border-red-200'}`}>
               <div className="text-left">
                <div className={`font-bold ${seed === 'old' ? 'text-red-800' : 'text-slate-800'}`}>घर का बीज / Saved Seed</div>
                <div className="text-[10px] font-bold uppercase tracking-wide text-red-500 mt-1">Free, but low yield</div>
              </div>
              <div className={`font-number font-black ${seed === 'old' ? 'text-red-600' : 'text-slate-400'}`}>₹0</div>
            </button>
          </div>
        </div>

        {/* ─── FERTILIZER ─── */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3 px-1 flex items-center gap-2">
            🧪 खाद / Fertilizer
          </h2>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setFert('urea')} className={`p-4 rounded-x flex flex-col items-center justify-center gap-2 transition-all border shadow-sm ${fert === 'urea' ? 'bg-blue-50 border-blue-300 shadow-md text-blue-800' : 'bg-white border-slate-200 hover:border-blue-200 text-slate-700'}`}>
              <div className="font-bold text-center">यूरिया<br/>Standard Urea</div>
              <span className="font-number font-black">{fmt(FERTILIZER)}</span>
            </button>
            <button onClick={() => setFert('skip')} className={`p-4 rounded-x flex flex-col items-center justify-center gap-2 transition-all border shadow-sm ${fert === 'skip' ? 'bg-slate-100 border-slate-400 shadow-md text-slate-800' : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'}`}>
              <div className="font-bold text-center">बिना खाद<br/>Skip</div>
              <span className="text-[10px] uppercase font-bold text-red-500 text-center">Yield Penalty</span>
            </button>
          </div>
        </div>

        {/* ─── PESTICIDE ─── */}
        <div className="pb-8">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3 px-1 flex items-center gap-2">
            🛡️ कीटनाशक / Pesticide
          </h2>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setPest('buy')} className={`p-4 rounded-x flex flex-col items-center justify-center gap-2 transition-all border shadow-sm ${pest === 'buy' ? 'bg-indigo-50 border-indigo-300 shadow-md text-indigo-800' : 'bg-white border-slate-200 hover:border-indigo-200 text-slate-700'}`}>
              <div className="font-bold text-center">कीटनाशक<br/>Buy Setup</div>
              <span className="font-number font-black">{fmt(PESTICIDE)}</span>
            </button>
            <button onClick={() => setPest('skip')} className={`p-4 rounded-x flex flex-col items-center justify-center gap-2 transition-all border shadow-sm ${pest === 'skip' ? 'bg-slate-100 border-slate-400 shadow-md text-slate-800' : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'}`}>
              <div className="font-bold text-center">बिना दावा<br/>Skip</div>
              <span className="text-[10px] uppercase font-bold text-slate-400 text-center">Full Pest Risk</span>
            </button>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-5 bg-white border-t border-slate-100 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
        <button onClick={handleConfirm} disabled={!seed || !fert || !pest || gameState.cashInHand < totalCost}
          className="w-full btn-primary bg-amber-500 hover:bg-amber-600 text-white font-black text-lg py-4 rounded-2xl shadow-lg transition-all disabled:opacity-50 disabled:shadow-none uppercase tracking-wider flex justify-center items-center gap-2">
          ✅ खरीद पूरी करो / Confirm
        </button>
      </div>

    </div>
  );
}
