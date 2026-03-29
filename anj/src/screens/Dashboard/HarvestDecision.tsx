import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '../../store/gameStore';
import { CROP_BASE_DATA } from '../../data/crops';

function fmt(n: number) { return '₹' + n.toLocaleString('en-IN'); }

export default function HarvestDecision({ onNavigate }: { onNavigate: (s: string) => void }) {
  const { t } = useTranslation();
  const { gameState, farmer, decideHarvestOption } = useGameStore();

  if (!gameState || !farmer) return null;

  const crop = CROP_BASE_DATA[farmer.primaryCrop];
  const yieldEst = 30 * farmer.landHoldingHectares * (gameState.harvestYieldQuintals || 1); // rough visual estimate before calc
  const msp = crop?.baseMSP ?? 2000;
  
  const handleSellNow = () => {
    decideHarvestOption('sell');
    onNavigate('negotiation');
  };

  const handleWait = () => {
    decideHarvestOption('wait');
    onNavigate('dashboard');
  };

  const handleGodown = () => {
    decideHarvestOption('store');
    onNavigate('godown');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pt-8 pb-12 relative">
       <div className="px-5 mb-8">
        <h1 className="font-display text-4xl text-emerald-800 mb-2">कटाई का समय!<br/>Harvest Time!</h1>
        <p className="text-slate-600 font-medium">Your crop is ready. What do you want to do with the harvest?</p>
      </div>

      <div className="px-5 mb-8">
        <div className="bg-white rounded-3xl p-6 shadow-sm flex flex-col items-center justify-center border border-emerald-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-100 blur-3xl rounded-full opacity-60 mix-blend-multiply flex-none"></div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-600/80 mb-2 relative z-10">Estimated Yield</div>
          <div className="font-number text-5xl font-black text-emerald-800 relative z-10">~{Math.round(yieldEst)}<span className="text-xl ml-1 text-emerald-600/60">q</span></div>
          <div className="mt-4 px-4 py-1.5 bg-emerald-50 text-emerald-800 font-bold text-xs uppercase tracking-widest border border-emerald-200 rounded-full shadow-sm relative z-10">
            Market Rate: ₹{gameState.currentMarketPrice}/q
          </div>
        </div>
      </div>

      <div className="px-5 space-y-4">
        
        <button onClick={handleSellNow} className="w-full bg-emerald-600 text-white p-5 rounded-2xl shadow-md hover:bg-emerald-700 transition-colors flex items-center justify-between">
          <div className="text-left">
            <div className="font-bold text-xl uppercase tracking-wide flex items-center gap-2">
              <span className="text-2xl">💰</span> तुरंत बेचो / Sell Now
            </div>
            <div className="text-xs font-medium text-emerald-100 mt-1">Instant cash, lower price, no storage risk</div>
          </div>
          <span className="text-2xl font-bold opacity-80">›</span>
        </button>

        <button onClick={handleWait} className="w-full bg-white border border-slate-200 text-slate-800 p-5 rounded-2xl shadow-sm hover:border-slate-300 transition-colors flex items-center justify-between">
          <div className="text-left">
            <div className="font-bold text-lg flex items-center gap-2">
              <span className="text-2xl">⏳</span> रुक जाओ / Wait
            </div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">Store on farm · Lose 3-5% to damage</div>
          </div>
          <span className="text-xl font-bold text-slate-300">›</span>
        </button>

        <button onClick={handleGodown} className="w-full bg-amber-50 border border-amber-200 text-amber-900 p-5 rounded-2xl shadow-sm hover:bg-amber-100 transition-colors flex items-center justify-between">
          <div className="text-left">
            <div className="font-bold text-lg flex items-center gap-2">
              <span className="text-2xl">🏛️</span> गोदाम में रखो / eNWR
            </div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-amber-600 mt-1">Store safe · Get 70% loan · High price later</div>
          </div>
          <span className="text-xl font-bold text-amber-300">›</span>
        </button>

      </div>
    </div>
  );
}
