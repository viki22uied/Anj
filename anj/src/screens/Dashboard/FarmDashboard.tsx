import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '../../store/gameStore';
import { MSP_RATES } from '../../data/mspRates';

const CROP_EMOJI: Record<string, string> = {
  wheat: '🌾', paddy: '🌿', cotton: '☁️', mustard: '🌻', gram: '🫛',
  maize: '🌽', soybean: '🫘', onion: '🧅', tomato: '🍅', sugarcane: '🎋',
};

function fmt(n: number): string {
  if (n >= 100000) return '₹' + (n / 100000).toFixed(1) + 'L';
  if (n >= 1000) return '₹' + (n / 1000).toFixed(1) + 'K';
  return '₹' + n.toLocaleString('en-IN');
}

export default function FarmDashboard({ onNavigate }: { onNavigate: (screen: string) => void }) {
  const { t } = useTranslation();
  const { gameState, farmer, tick } = useGameStore();

  if (!gameState || !farmer) return null;

  const msp = gameState.mspPrice;
  const stressColor = gameState.stressLevel < 30 ? '#10b981' : gameState.stressLevel < 55 ? '#f59e0b' : gameState.stressLevel < 75 ? '#ef4444' : '#be123c';
  const stressLabel = gameState.stressLevel < 30 ? 'शांत (Calm)' : gameState.stressLevel < 55 ? 'सामान्य तनाव (Moderate)' : gameState.stressLevel < 75 ? 'परेशान (Stressed)' : 'बहुत घबराहट (Critical)';

  const unresolvedEvents = gameState.pendingEvents.filter(e => !e.resolved).slice(-3);
  
  const minInputCost = farmer.landHoldingHectares * 8000; // rough minimum

  // Phase logic
  const isGrowing = gameState.weekNumber >= 5 && gameState.weekNumber <= 18;
  const isSeasonStart = gameState.weekNumber < 5;

  return (
    <div className="pb-8 bg-slate-50 min-h-screen">
      {/* ─── TIME & SEASON HEADER ─── */}
      <div className="px-5 pt-6 pb-4 flex items-end justify-between">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-amber-600 bg-amber-100 px-2 py-0.5 rounded shadow-sm inline-block mb-2">
            Season {gameState.seasonNumber} · Week {gameState.weekNumber}
          </div>
          <h2 className="font-display text-4xl text-slate-800 tracking-tight">
            Month {gameState.currentMonth} <span className="text-xl text-slate-400 font-number">{gameState.currentYear}</span>
          </h2>
        </div>
        <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center text-4xl border border-slate-100">
          {CROP_EMOJI[farmer.primaryCrop] ?? '🌱'}
        </div>
      </div>

      {/* ─── MAIN STATS ─── */}
      <div className="grid grid-cols-2 gap-3 px-5 mb-5">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-1">💰 Cash in Hand</span>
          <span className="font-number text-2xl font-black text-emerald-600">{fmt(gameState.cashInHand)}</span>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-1">📋 Total Debt</span>
          <span className={`font-number text-2xl font-black ${gameState.totalDebt > 0 ? 'text-red-500' : 'text-slate-400'}`}>
            {gameState.totalDebt > 0 ? fmt(gameState.totalDebt) : '₹0'}
          </span>
        </div>
      </div>

      {/* ─── GRAIN STATUS ─── */}
      <div className="grid grid-cols-2 gap-3 px-5 mb-5">
        <div className="bg-amber-50 p-4 rounded-2xl shadow-sm border border-amber-100 flex flex-col items-center">
          <span className="text-[10px] uppercase font-bold tracking-widest text-amber-700/80 mb-1">🌾 Farm Storage</span>
          <span className="font-number text-2xl font-black text-amber-900">
            {gameState.grainOnFarmQuintals}<span className="text-sm ml-0.5 text-amber-700/60">q</span>
          </span>
        </div>
        <div className={`p-4 rounded-2xl shadow-sm border flex flex-col items-center relative overflow-hidden ${gameState.grainInGodownQuintals > 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-100 border-slate-200'}`}>
          <span className={`text-[10px] uppercase font-bold tracking-widest mb-1 ${gameState.grainInGodownQuintals > 0 ? 'text-emerald-700/80' : 'text-slate-500'}`}>🏛️ Godown</span>
          <span className={`font-number text-2xl font-black ${gameState.grainInGodownQuintals > 0 ? 'text-emerald-700' : 'text-slate-400'}`}>
            {gameState.grainInGodownQuintals}<span className="text-sm ml-0.5 opacity-60">q</span>
          </span>
          {gameState.eNWRActive && <div className="absolute top-2 right-2 flex"><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /></div>}
        </div>
      </div>

      {/* ─── STRESS METER ─── */}
      <div className="px-5 mb-6">
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-3">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              🧠 Mental Stress (तनाव)
            </span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded border shadow-sm" style={{ color: stressColor, borderColor: stressColor + '40', backgroundColor: stressColor + '10' }}>
              {stressLabel}
            </span>
          </div>
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden shadow-inner flex">
            <motion.div className="h-full rounded-r-md"
              animate={{ width: `${gameState.stressLevel}%`, backgroundColor: stressColor }}
              transition={{ duration: 0.8, ease: "easeOut" }} />
          </div>
        </div>
      </div>

      {/* ─── PENDING EVENTS ─── */}
      <AnimatePresence>
        {unresolvedEvents.length > 0 && (
          <div className="px-5 mb-6 space-y-3">
            {unresolvedEvents.map((ev, i) => (
              <motion.button key={ev.id} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                onClick={() => onNavigate('event_' + ev.id)} // Specific modal trigger
                className="w-full text-left bg-red-50 p-4 rounded-2xl border border-red-200 shadow-sm relative overflow-hidden flex flex-col">
                <div className="absolute -right-4 -bottom-4 text-6xl opacity-10 grayscale">⚠️</div>
                <span className="font-bold text-sm text-red-800 relative z-10">{t(ev.titleKey)}</span>
                <span className="text-xs mt-1 text-red-600/80 line-clamp-2 relative z-10">{t(ev.descKey)}</span>
                <div className="mt-3 flex justify-between items-center relative z-10">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-red-500 bg-white px-2 py-1 rounded shadow-sm">Review Required</span>
                  <span className="text-red-500 font-bold">→</span>
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* ─── PRIMARY ACTIONS (Buttons 2.2) ─── */}
      <div className="px-5 mb-6">
        <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-3 px-1">Farm Actions</h3>
        <div className="space-y-3">
          
          {/* Sell Grain */}
          {(gameState.grainOnFarmQuintals > 0 || gameState.grainInGodownQuintals > 0) ? (
            <button onClick={() => onNavigate('negotiation')} disabled={isGrowing}
              className={`w-full p-4 rounded-2xl flex items-center gap-3 transition-all ${isGrowing ? 'bg-slate-100 opacity-60' : 'bg-emerald-50 border border-emerald-200 shadow-sm hover:shadow-md'}`}>
              <div className="text-3xl">💰</div>
              <div className="flex-1 text-left">
                <div className="font-bold text-emerald-800">अनाज बेचो / Sell Grain</div>
                <div className="text-xs text-emerald-600/80 font-medium">Market: ₹{gameState.currentMarketPrice}/q</div>
              </div>
            </button>
          ) : null}

          {/* Store in Godown */}
          <button onClick={() => onNavigate('godown')} disabled={gameState.grainOnFarmQuintals < 10 || gameState.eNWRActive}
            className={`w-full p-4 rounded-2xl flex items-center gap-3 transition-all ${(gameState.grainOnFarmQuintals < 10 || gameState.eNWRActive) ? 'bg-slate-100 opacity-60 grayscale' : 'bg-amber-50 border border-amber-200 shadow-sm hover:shadow-md'}`}>
            <div className="text-3xl">🏛️</div>
            <div className="flex-1 text-left">
              <div className="font-bold text-amber-800">गोदाम में रखो / eNWR</div>
              <div className="text-[10px] font-medium text-amber-600/80">
                {gameState.eNWRActive ? 'पहले से गोदाम में है' : gameState.grainOnFarmQuintals < 10 ? 'न्यूनतम 10 क्विंटल चाहिए' : 'Store for better prices'}
              </div>
            </div>
          </button>

          {/* Crop Insurance */}
          {(!gameState.pmfbyEnrolled && !gameState.pmfbyCutoffPassed) ? (
            <button onClick={() => onNavigate('insurance')}
              className="w-full p-4 rounded-2xl flex items-center gap-3 bg-blue-50 border border-blue-200 shadow-sm hover:shadow-md">
              <div className="text-3xl">🛡️</div>
              <div className="flex-1 text-left">
                <div className="font-bold text-blue-800">फसल बीमा / Crop Insurance</div>
                <div className="text-xs text-blue-600/80 font-medium">{gameState.weekNumber === 4 ? '⚠️ Cutoff this week!' : 'Secure your harvest'}</div>
              </div>
            </button>
          ) : (
             <button disabled className="w-full p-4 rounded-2xl flex items-center gap-3 bg-slate-100 border border-slate-200 opacity-60">
              <div className="text-3xl">🛡️</div>
              <div className="flex-1 text-left">
                <div className="font-bold text-slate-500">फसल बीमा / Crop Insurance</div>
                <div className="text-xs text-slate-400 font-medium">{gameState.pmfbyEnrolled ? '✅ बीमा लिया है' : '❌ कट-ऑफ तारीख निकल गई'}</div>
              </div>
            </button>
          )}

          {/* Buy Inputs */}
          {isSeasonStart && !gameState.inputsBought ? (
            <button onClick={() => onNavigate('inputs')} disabled={gameState.cashInHand < minInputCost}
              className={`w-full p-4 rounded-2xl flex items-center gap-3 ${gameState.cashInHand < minInputCost ? 'bg-slate-100 opacity-60' : 'bg-green-50 border border-green-200 shadow-sm'}`}>
              <div className="text-3xl">🌱</div>
              <div className="flex-1 text-left">
                <div className="font-bold text-green-800">बीज-खाद खरीदो / Buy Inputs</div>
                <div className="text-[10px] font-medium text-green-600/80">{gameState.cashInHand < minInputCost ? 'पैसे नहीं हैं' : 'Required for season'}</div>
              </div>
            </button>
          ) : null}

          {/* KCC Quick Loan (If has KCC) */}
          {gameState.hasKCC && (
            <button onClick={() => onNavigate('kcc_draw')} disabled={(gameState.kccCreditLimit - gameState.kccUsed) <= 0}
              className={`w-full p-4 rounded-2xl flex items-center gap-3 ${(gameState.kccCreditLimit - gameState.kccUsed) <= 0 ? 'bg-slate-100 opacity-60' : 'bg-indigo-50 border border-indigo-200 shadow-sm'}`}>
              <div className="text-3xl">💳</div>
              <div className="flex-1 text-left">
                <div className="font-bold text-indigo-800">KCC से उधार / KCC Draw</div>
                <div className="text-xs text-indigo-600/80 font-medium">Available: {fmt(Math.max(0, gameState.kccCreditLimit - gameState.kccUsed))}</div>
              </div>
            </button>
          )}

          {/* Take a Loan */}
          <button onClick={() => onNavigate('credit')} className="w-full p-4 rounded-2xl flex items-center gap-3 bg-white border border-slate-200 shadow-sm hover:border-slate-300 transition-all">
            <div className="text-3xl">🏦</div>
            <div className="flex-1 text-left">
              <div className="font-bold text-slate-700">उधार लो / Take Loan</div>
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Explore Options</div>
            </div>
            <span className="text-slate-400 font-bold">›</span>
          </button>

          {/* Repay Loan */}
          {gameState.totalDebt > 0 && (
            <button onClick={() => onNavigate('repay')} disabled={gameState.cashInHand < 100}
              className={`w-full p-4 rounded-2xl flex items-center gap-3 ${gameState.cashInHand < 100 ? 'bg-slate-100 opacity-60' : 'bg-red-50 border border-red-200 shadow-sm'}`}>
              <div className="text-3xl">💸</div>
              <div className="flex-1 text-left">
                <div className="font-bold text-red-800">कर्ज़ चुकाओ / Repay Loan</div>
                <div className="text-[10px] text-red-600/80 font-bold">Saves interest & stress</div>
              </div>
              <span className="text-red-400 font-bold">›</span>
            </button>
          )}
        </div>
      </div>

      {/* ─── SECONDARY ACTIONS ─── */}
      <div className="grid grid-cols-2 gap-3 px-5 mb-8">
        <button onClick={() => onNavigate('market')} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center gap-2 hover:bg-slate-50 transition-colors">
          <div className="text-2xl">📊</div>
          <span className="text-[11px] font-bold text-slate-600">मंडी भाव<br/>Prices</span>
        </button>
        <button onClick={() => onNavigate('achievements')} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center gap-2 hover:bg-slate-50 transition-colors">
          <div className="text-2xl">🏆</div>
          <span className="text-[11px] font-bold text-slate-600">उपलब्धियाँ<br/>Badges</span>
        </button>
        {gameState.seasonEndReached && (
          <button onClick={() => onNavigate('recap')} className="col-span-2 bg-slate-800 p-4 rounded-2xl shadow-md border-transparent text-white flex gap-3 items-center justify-center">
            <div className="text-2xl">📋</div>
            <span className="font-bold">सीज़न रिपोर्ट / Season Report</span>
          </button>
        )}
      </div>

      {/* ─── WEEK ADVANCE ─── */}
      <div className="px-5 pb-8">
        <button onClick={tick} className="btn-primary w-full bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95">
          ▶ अगला हफ्ता / Next Week
        </button>
        <div className="text-center mt-3">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">1 Week = 4 Turns per Month</span>
        </div>
      </div>

    </div>
  );
}
