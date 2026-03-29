import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '../../store/gameStore';
import { MSP_RATES } from '../../data/mspRates';
import NumberTick from '../../components/common/NumberTick';

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
  const { t, i18n } = useTranslation();
  const { gameState, farmer, tick, resetGame } = useGameStore();

  if (!gameState || !farmer) return null;

  const msp = gameState.mspPrice;
  const stressColor = gameState.stressLevel < 30 ? '#10b981' : gameState.stressLevel < 55 ? '#f59e0b' : gameState.stressLevel < 75 ? '#ef4444' : '#be123c';
  const stressLabel = gameState.stressLevel < 30 ? t('stress.calm') : gameState.stressLevel < 55 ? t('stress.moderate') : gameState.stressLevel < 75 ? t('stress.stressed') : t('stress.critical');

  const unresolvedEvents = gameState.pendingEvents.filter(e => !e.resolved).slice(-3);
  
  const minInputCost = farmer.landHoldingHectares * 8000; // rough minimum

  // Phase logic
  const isGrowing = gameState.weekNumber >= 5 && gameState.weekNumber <= 18;
  const isSeasonStart = gameState.weekNumber < 5;
  const isStressed = gameState.stressLevel >= 80;

  return (
    <div className={`min-h-screen bg-slate-50 flex flex-col relative pb-32 ${isStressed ? 'overflow-hidden' : ''}`}>
      {/* High Stress Vignette */}
      {isStressed && (
         <div className="absolute inset-0 pointer-events-none z-0 animate-pulse bg-red-500/10 mix-blend-multiply border-[8px] border-red-500/20 transition-all duration-1000"></div>
      )}
      {/* ─── HEADER WITH SIGN OUT ─── */}
      <div className="px-5 pt-6 pb-4 flex items-end justify-between">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-amber-600 bg-amber-100 px-2 py-0.5 rounded shadow-sm inline-block mb-2">
            Season {gameState.seasonNumber} · Week {gameState.weekNumber}
            {gameState.seasonNumber >= 4 && <span className="ml-1 text-red-600">(Last)</span>}
          </div>
          <h2 className="font-display text-4xl text-slate-800 tracking-tight">
            Month {gameState.currentMonth} <span className="text-xl text-slate-400 font-number">{gameState.currentYear}</span>
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => {
              if (confirm(t('common.resetConfirm') || 'Are you sure?')) {
                resetGame();
                window.location.href = '/';
              }
            }}
            className="px-3 py-2 text-xs font-bold text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
            title={t('common.reset')}
          >
            🚪 {t('common.reset')}
          </button>
          <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center text-4xl border border-slate-100">
            {CROP_EMOJI[farmer.primaryCrop] ?? '🌱'}
          </div>
        </div>
      </div>

      {/* ─── MAIN STATS ─── */}
      <div className="grid grid-cols-2 gap-3 px-5 mb-5">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-1">💰 {t('dashboard.cash')}</span>
          <span className="text-2xl font-black text-emerald-600">
            <NumberTick value={gameState.cashInHand} />
          </span>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-1">📋 {t('dashboard.debt')}</span>
          <span className={`text-2xl font-black ${gameState.totalDebt > 0 ? 'text-red-500' : 'text-slate-400'}`}>
            <NumberTick value={gameState.totalDebt} />
          </span>
        </div>
      </div>

      {/* ─── GRAIN STATUS ─── */}
      <div className="grid grid-cols-2 gap-3 px-5 mb-5">
        <div className="bg-amber-50 p-4 rounded-2xl shadow-sm border border-amber-100 flex flex-col items-center">
          <span className="text-[10px] uppercase font-bold tracking-widest text-amber-700/80 mb-1">🌾 {t('dashboard.farm')}</span>
          <span className="text-2xl font-black text-amber-900">
            {gameState.grainOnFarmQuintals}<span className="text-sm ml-0.5 text-amber-700/60">q</span>
          </span>
        </div>
        <div className={`p-4 rounded-2xl shadow-sm border flex flex-col items-center relative overflow-hidden ${gameState.grainInGodownQuintals > 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-100 border-slate-200'}`}>
          <span className={`text-[10px] uppercase font-bold tracking-widest mb-1 ${gameState.grainInGodownQuintals > 0 ? 'text-emerald-700/80' : 'text-slate-500'}`}>🏛️ {t('dashboard.godown')}</span>
          <span className={`text-2xl font-black ${gameState.grainInGodownQuintals > 0 ? 'text-emerald-700' : 'text-slate-400'}`}>
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
              🧠 {t('stress.title')}
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
                  <span className="text-[10px] font-bold uppercase tracking-wider text-red-500 bg-white px-2 py-1 rounded shadow-sm">{t('common.review')}</span>
                  <span className="text-red-500 font-bold">→</span>
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* ─── PRIMARY ACTIONS (Buttons 2.2) ─── */}
      <div className="px-5 mb-6">
        <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-3 px-1">{t('dashboard.actions')}</h3>
        <div className="space-y-3">
          
          {/* Sell Grain */}
          {(gameState.grainOnFarmQuintals > 0 || gameState.grainInGodownQuintals > 0) ? (
            <button onClick={() => onNavigate('negotiation')} disabled={isGrowing}
              className={`w-full p-4 rounded-2xl flex items-center gap-3 transition-all ${isGrowing ? 'bg-slate-100 opacity-60' : 'bg-emerald-50 border border-emerald-200 shadow-sm hover:shadow-md'}`}>
              <div className="text-3xl">💰</div>
              <div className="flex-1 text-left">
                <div className="font-bold text-emerald-800">{t('action.sell')}</div>
                <div className="text-xs text-emerald-600/80 font-medium">{t('common.market')}: ₹{gameState.currentMarketPrice}/q</div>
              </div>
            </button>
          ) : null}

          {/* Store in Godown */}
          <button onClick={() => onNavigate('godown')} disabled={gameState.grainOnFarmQuintals < 10 || gameState.eNWRActive}
            className={`w-full p-4 rounded-2xl flex items-center gap-3 transition-all ${(gameState.grainOnFarmQuintals < 10 || gameState.eNWRActive) ? 'bg-slate-100 opacity-60 grayscale' : 'bg-amber-50 border border-amber-200 shadow-sm hover:shadow-md'}`}>
            <div className="text-3xl">🏛️</div>
              <div className="flex-1 text-left">
              <div className="font-bold text-amber-800">{t('dashboard.storeInGodown')}</div>
              <div className="text-[10px] font-medium text-amber-600/80">
                {gameState.eNWRActive ? t('dashboard.alreadyInGodown') : gameState.grainOnFarmQuintals < 10 ? t('dashboard.min10Quintals') : t('dashboard.storeForBetterPrices')}
              </div>
            </div>
          </button>

          {/* Crop Insurance */}
          {(!gameState.pmfbyEnrolled && !gameState.pmfbyCutoffPassed) ? (
            <button onClick={() => onNavigate('insurance')}
              className="w-full p-4 rounded-2xl flex items-center gap-3 bg-blue-50 border border-blue-200 shadow-sm hover:shadow-md">
              <div className="text-3xl">🛡️</div>
              <div className="flex-1 text-left">
                <div className="font-bold text-blue-800">{t('dashboard.cropInsurance')}</div>
                <div className="text-xs text-blue-600/80 font-medium">{gameState.weekNumber === 4 ? t('dashboard.cutoffThisWeek') : t('dashboard.secureHarvest')}</div>
              </div>
            </button>
          ) : (
             <button disabled className="w-full p-4 rounded-2xl flex items-center gap-3 bg-slate-100 border border-slate-200 opacity-60">
              <div className="text-3xl">🛡️</div>
              <div className="flex-1 text-left">
                <div className="font-bold text-slate-500">{t('dashboard.cropInsurance')}</div>
                <div className="text-xs text-slate-400 font-medium">{gameState.pmfbyEnrolled ? t('dashboard.insured') : t('dashboard.cutoffPassed')}</div>
              </div>
            </button>
          )}

          {/* Buy Inputs */}
          {isSeasonStart && !gameState.inputsBought ? (
            <button onClick={() => onNavigate('inputs')} disabled={gameState.cashInHand < minInputCost}
              className={`w-full p-4 rounded-2xl flex items-center gap-3 ${gameState.cashInHand < minInputCost ? 'bg-slate-100 opacity-60' : 'bg-green-50 border border-green-200 shadow-sm'}`}>
              <div className="text-3xl">🌱</div>
              <div className="flex-1 text-left">
                <div className="font-bold text-green-800">{t('dashboard.buyInputs')}</div>
                <div className="text-[10px] font-medium text-green-600/80">{gameState.cashInHand < minInputCost ? t('dashboard.notEnoughCash') : t('dashboard.requiredForSeason')}</div>
              </div>
            </button>
          ) : null}

          {/* KCC Quick Loan (If has KCC) */}
          {gameState.hasKCC && (
            <button onClick={() => onNavigate('kcc_draw')} disabled={(gameState.kccCreditLimit - gameState.kccUsed) <= 0}
              className={`w-full p-4 rounded-2xl flex items-center gap-3 ${(gameState.kccCreditLimit - gameState.kccUsed) <= 0 ? 'bg-slate-100 opacity-60' : 'bg-indigo-50 border border-indigo-200 shadow-sm'}`}>
              <div className="text-3xl">💳</div>
              <div className="flex-1 text-left">
                <div className="font-bold text-indigo-800">{t('dashboard.kccDraw')}</div>
                <div className="text-xs text-indigo-600/80 font-medium">{t('dashboard.available')}: {fmt(Math.max(0, gameState.kccCreditLimit - gameState.kccUsed))}</div>
              </div>
            </button>
          )}

          {/* Take a Loan */}
          <button onClick={() => onNavigate('credit')} className="w-full p-4 rounded-2xl flex items-center gap-3 bg-white border border-slate-200 shadow-sm hover:border-slate-300 transition-all">
            <div className="text-3xl">🏦</div>
            <div className="flex-1 text-left">
              <div className="font-bold text-slate-700">{t('dashboard.takeLoan')}</div>
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">{t('dashboard.exploreOptions')}</div>
            </div>
            <span className="text-slate-400 font-bold">›</span>
          </button>

          {/* Repay Loan */}
          {gameState.totalDebt > 0 && (
            <button onClick={() => onNavigate('repay')} disabled={gameState.cashInHand < 100}
              className={`w-full p-4 rounded-2xl flex items-center gap-3 ${gameState.cashInHand < 100 ? 'bg-slate-100 opacity-60' : 'bg-red-50 border border-red-200 shadow-sm'}`}>
              <div className="text-3xl">💸</div>
              <div className="flex-1 text-left">
                <div className="font-bold text-red-800">{t('dashboard.repayLoan')}</div>
                <div className="text-[10px] text-red-600/80 font-bold">{t('dashboard.savesInterest')}</div>
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
          <span className="text-[11px] font-bold text-slate-600">{t('dashboard.prices')}</span>
        </button>
        <button onClick={() => onNavigate('achievements')} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center gap-2 hover:bg-slate-50 transition-colors">
          <div className="text-2xl">🏆</div>
          <span className="text-[11px] font-bold text-slate-600">{t('dashboard.badges')}</span>
        </button>
        {gameState.seasonEndReached && (
          <button onClick={() => onNavigate(gameState.seasonNumber >= 4 ? 'final-report' : 'recap')} 
            className={`col-span-2 p-4 rounded-2xl shadow-md border-transparent text-white flex gap-3 items-center justify-center ${gameState.seasonNumber >= 4 ? 'bg-red-600' : 'bg-slate-800'}`}>
            <div className="text-2xl">{gameState.seasonNumber >= 4 ? '🏁' : '📋'}</div>
            <span className="font-bold">
              {gameState.seasonNumber >= 4 
                ? 'Final Report'
                : 'Season Report'
              }
            </span>
          </button>
        )}
      </div>

      {/* ─── NEW FEATURES MENU ─── */}
      <div className="px-5 mb-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">{t('dashboard.newFeatures')}</h3>
          <div className="grid grid-cols-3 gap-2">
            <button onClick={() => onNavigate('settings')} className="p-3 bg-slate-50 rounded-xl flex flex-col items-center gap-1 hover:bg-slate-100 transition-colors">
              <span className="text-xl">⚙️</span>
              <span className="text-[10px] font-bold text-slate-600">{t('dashboard.settings')}</span>
            </button>
            <button onClick={() => onNavigate('profile-edit')} className="p-3 bg-slate-50 rounded-xl flex flex-col items-center gap-1 hover:bg-slate-100 transition-colors">
              <span className="text-xl">👤</span>
              <span className="text-[10px] font-bold text-slate-600">{t('dashboard.profile')}</span>
            </button>
            <button onClick={() => onNavigate('price-alerts')} className="p-3 bg-slate-50 rounded-xl flex flex-col items-center gap-1 hover:bg-slate-100 transition-colors">
              <span className="text-xl">🔔</span>
              <span className="text-[10px] font-bold text-slate-600">{t('dashboard.alerts')}</span>
            </button>
            <button onClick={() => onNavigate('schemes')} className="p-3 bg-slate-50 rounded-xl flex flex-col items-center gap-1 hover:bg-slate-100 transition-colors">
              <span className="text-xl">📜</span>
              <span className="text-[10px] font-bold text-slate-600">{t('dashboard.schemes')}</span>
            </button>
            <button onClick={() => onNavigate('season-compare')} className="p-3 bg-slate-50 rounded-xl flex flex-col items-center gap-1 hover:bg-slate-100 transition-colors">
              <span className="text-xl">📈</span>
              <span className="text-[10px] font-bold text-slate-600">{t('dashboard.seasonCompare')}</span>
            </button>
            <button onClick={() => onNavigate('export')} className="p-3 bg-slate-50 rounded-xl flex flex-col items-center gap-1 hover:bg-slate-100 transition-colors">
              <span className="text-xl">📤</span>
              <span className="text-[10px] font-bold text-slate-600">{t('dashboard.export')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─── MINI GAMES ─── */}
      <div className="px-5 mb-6">
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl shadow-sm border border-amber-100 p-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-amber-600 mb-3">{t('dashboard.miniGames')}</h3>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => onNavigate('grading-game')} className="p-3 bg-white rounded-xl flex flex-col items-center gap-1 hover:bg-amber-50 transition-colors border border-amber-100">
              <span className="text-xl">🌾</span>
              <span className="text-[10px] font-bold text-amber-700">{t('dashboard.grading')}</span>
            </button>
            <button onClick={() => onNavigate('mandi-math')} className="p-3 bg-white rounded-xl flex flex-col items-center gap-1 hover:bg-amber-50 transition-colors border border-amber-100">
              <span className="text-xl">🧮</span>
              <span className="text-[10px] font-bold text-amber-700">{t('dashboard.mandiMath')}</span>
            </button>
            <button onClick={() => onNavigate('weather-risk')} className="p-3 bg-white rounded-xl flex flex-col items-center gap-1 hover:bg-amber-50 transition-colors border border-amber-100">
              <span className="text-xl">⛈️</span>
              <span className="text-[10px] font-bold text-amber-700">{t('dashboard.weatherRisk')}</span>
            </button>
            <button onClick={() => onNavigate('negotiation')} className="p-3 bg-white rounded-xl flex flex-col items-center gap-1 hover:bg-amber-50 transition-colors border border-amber-100">
              <span className="text-xl">🤝</span>
              <span className="text-[10px] font-bold text-amber-700">{t('dashboard.negotiation')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─── GROUP PLAY ─── */}
      <div className="px-5 pb-40">
        <button onClick={() => onNavigate('group-play')} className="w-full p-4 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-center gap-3 hover:bg-indigo-100 transition-colors">
          <span className="text-2xl">👥</span>
          <div className="flex-1 text-left">
            <div className="font-bold text-indigo-800">{t('dashboard.groupPlay')}</div>
            <div className="text-[10px] text-indigo-600">{t('dashboard.playWithVillage')}</div>
          </div>
          <span className="text-indigo-400 font-bold">›</span>
        </button>
      </div>

      {/* ─── WEEK ADVANCE - FIXED AT BOTTOM ─── */}
      <div className="fixed bottom-[72px] left-0 right-0 bg-white border-t-2 border-slate-300 p-4 z-[60] shadow-2xl pb-safe">
        <div className="max-w-2xl mx-auto">
          <button 
            onClick={tick} 
            className={`w-full ${isStressed ? 'bg-red-600 hover:bg-red-700' : 'bg-amber-500 hover:bg-amber-600'} text-white shadow-xl py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 text-lg`}
          >
            ▶ {t('dashboard.nextWeek')}
          </button>
          <div className="text-center mt-2 flex justify-center gap-4">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{t('dashboard.oneWeek')}</span>
            {gameState.seasonNumber >= 4 && (
              <span className="text-[10px] font-bold text-red-500">⚠️ {t('dashboard.finalSeason')}</span>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
