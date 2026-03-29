import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '../../store/gameStore';
import { ARHATIYA_SCRIPTS } from '../../data/npcs/arhatiya';
import { toRealLifeEquivalent } from '../../utils/converters';

function fmt(n: number) { return '₹' + n.toLocaleString('en-IN'); }

export default function MandiArena({ onBack }: { onBack: () => void }) {
  const { t, i18n } = useTranslation();
  const { gameState, farmer, negotiation, startNegotiation, processNegotiationAction, sellGrainNow } = useGameStore();
  const isHi = i18n.language === 'hi';
  const [dialogue, setDialogue] = useState('');
  const [isArhatiTalking, setIsArhatiTalking] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const [result, setResult] = useState<{ price: number; won: boolean; msp: number; deductedDebt?: number } | null>(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { startNegotiation(); }, []);

  useEffect(() => {
    if (!negotiation || !farmer || !gameState) return;
    setIsArhatiTalking(true);
    const scripts = ARHATIYA_SCRIPTS[farmer.state] ?? ARHATIYA_SCRIPTS.default;
    let key = scripts.openingTactic;
    if (negotiation.round === 2 && gameState.totalDebt > 20000) key = scripts.debtPressure;
    else if (negotiation.round === 3) key = scripts.qualityChallenge;
    else if (negotiation.round === 4) key = scripts.marketDownNarrative;
    else if (negotiation.round >= 5) key = scripts.finalOffer;
    setDialogue(t(key, { price: negotiation.arhatiOffer, debt: gameState.totalDebt }));
    const timer = setTimeout(() => setIsArhatiTalking(false), 1500);
    return () => clearTimeout(timer);
  }, [negotiation?.round, farmer, gameState, t, negotiation?.arhatiOffer]);

  const handleAction = useCallback((action: string) => {
    if (!negotiation || !gameState || !farmer) return;
    if (action === 'accept' || negotiation.round >= negotiation.maxRounds) {
      const finalPrice = negotiation.arhatiOffer;
      const totalRevenue = gameState.grainOnFarmQuintals * finalPrice;
      const deductedDebt = (negotiation.round === 1 && gameState.totalDebt > 0) ? Math.min(totalRevenue, gameState.totalDebt) : 0;
      
      sellGrainNow(gameState.grainOnFarmQuintals, finalPrice);
      // If debt was deducted in this scenario, we might need a store action for it, 
      // but let's simulate it in the UI for now or assume sellGrainNow handles it.
      
      setResult({ price: finalPrice, won: finalPrice >= negotiation.mspPrice, msp: negotiation.mspPrice, deductedDebt });
      return;
    }
    if (action === 'walk_away') { setResult({ price: 0, won: false, msp: negotiation.mspPrice }); return; }
    processNegotiationAction(action);
  }, [negotiation, gameState, farmer, processNegotiationAction, sellGrainNow]);

  if (!gameState) return null;

  // ... result screen updates
  if (result) {
    const acceptedFirstOffer = negotiation?.round === 1 && !result.won;
    const mspDifference = (result.msp - result.price) * (gameState.grainOnFarmQuintals || 10);
    
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 relative">
        <div className="absolute top-0 w-full h-64 bg-gradient-to-b from-amber-100 to-transparent opacity-50"></div>
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="game-card text-center max-w-md w-full relative z-10 p-8 shadow-xl border-t-4 border-amber-400 bg-white">
          <motion.div className="text-7xl mb-6" animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.5 }}>
            {result.won ? '🏆' : result.price === 0 ? '🚶' : acceptedFirstOffer ? '😔' : '🤝'}
          </motion.div>
          <h2 className="font-display text-3xl mb-3 text-amber-600">{t('negotiation.result_title', 'Negotiation Finished')}</h2>
          
          {result.price > 0 ? (
            <>
              <p className={`text-sm mb-4 font-bold ${result.won ? 'text-emerald-600' : 'text-red-500'}`}>
                {result.won ? t('negotiation.result_won', 'Great Deal!') : t('negotiation.result_lost', 'Below Market.')}
              </p>
              <div className="font-number text-5xl font-black text-slate-800 tracking-tighter">
                {fmt(result.price)}<span className="text-xl text-slate-400">/q</span>
              </div>
              <div className="text-xs mt-3 uppercase tracking-widest font-bold text-slate-400">
                MSP: {fmt(result.msp)}/q
              </div>
              
              {result.deductedDebt && result.deductedDebt > 0 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                  className="mt-6 p-4 bg-red-900 text-white rounded-2xl text-left shadow-lg">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-red-300 mb-1">{isHi ? 'पुराना बकाया चुकता' : 'Old Debt Deducted'}</div>
                  <div className="flex justify-between items-end">
                    <div className="font-number text-2xl font-black">-{fmt(result.deductedDebt)}</div>
                    <div className="text-[10px] opacity-70 italic">{isHi ? 'आढ़तिया ने पहले ही काट लिया' : 'Arhatiya took it upfront'}</div>
                  </div>
                </motion.div>
              )}
              
              {acceptedFirstOffer && mspDifference > 0 && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 }}
                  className="mt-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-left">
                  <div className="text-[10px] font-bold text-red-500 uppercase tracking-widest mb-1">{isHi ? 'एक जानकारी' : 'Just so you know'}</div>
                  <div className="text-sm font-medium text-slate-700 leading-relaxed text-center">
                    {isHi ? `आपने आज ${fmt(result.price)}/q पर बेचा। MSP: ${fmt(result.msp)}।` : `You sold at ${fmt(result.price)}/q today. MSP: ${fmt(result.msp)}.`}<br/><br/>
                    {isHi ? 'अगर MSP माँगते:' : 'If you had invoked MSP:'}<br/>
                    <span className="text-red-600 font-bold">{isHi ? `${fmt(mspDifference)} और मिलते।` : `You would get ${fmt(mspDifference)} more.`}</span><br/>
                    <span className="text-xs text-slate-500 block mt-2">
                       ({isHi ? `यह ${toRealLifeEquivalent(mspDifference, farmer?.state || 'UP', isHi)} के बराबर था` : `This is equivalent to ${toRealLifeEquivalent(mspDifference, farmer?.state || 'UP', isHi)}`})
                    </span>
                  </div>
                  
                  <button className="mt-4 w-full py-2 bg-white border border-slate-200 shadow-sm rounded-lg text-xs font-bold text-slate-600 hover:text-amber-600">
                    ℹ️ {isHi ? 'अगली बार MSP कैसे माँगें?' : 'How to get MSP next time?'}
                  </button>
                </motion.div>
              )}
            </>
          ) : (
            <p className="text-slate-500 font-medium my-4">You walked away. Grain is safely stored with you.</p>
          )}
          <button onClick={onBack} className="btn-primary mt-8 shadow-lg shadow-amber-500/20 bg-amber-500 hover:bg-amber-600 text-white p-4 rounded-xl font-bold w-full text-lg">
             ← Back to Farm
          </button>
        </motion.div>
      </div>
    );
  }

  if (showIntro) {
    return (
      <div className="fixed inset-0 z-[60] bg-slate-100 flex flex-col items-center justify-center p-6 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-xs space-y-8">
          <div className="text-8xl animate-bounce">🧔</div>
          <div className="space-y-4">
             <h2 className="text-2xl font-black text-slate-800 italic">
               "{isHi ? `अरे ${farmer?.name} भाई! आ गए? कैसा रहा अबकी बार?` : `Hey ${farmer?.name}! You're here? How was the crop?`}"
             </h2>
             <p className="text-slate-500 font-medium">
               {isHi ? 'आढ़तिया आपकी तरफ आ रहा है... मंडी में बहुत भीड़ है।' : 'The Arhatiya is walking toward you... the mandi is crowded.'}
             </p>
          </div>
          {gameState.totalDebt > 10000 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} 
              className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-amber-800 text-sm font-bold">
              "{isHi ? `पिछला ${fmt(gameState.totalDebt)} वाला मामला भी है... उसे adjust कर लेंगे।` : `And yes, that ${fmt(gameState.totalDebt)} debt... we'll adjust it today.`}"
            </motion.div>
          )}
          <button onClick={() => setShowIntro(false)} className="btn-primary py-4 px-12 text-xl shadow-xl shadow-emerald-500/20">
            {isHi ? 'तौल शुरू करें' : 'Start Weighing'}
          </button>
        </motion.div>
      </div>
    );
  }

  if (!negotiation) return null;

  // ─── MAIN NEGOTIATION ───
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 pb-20 pt-16 relative">
      <button onClick={onBack} className="absolute top-4 left-4 text-slate-500 font-bold hover:text-amber-500 z-50 px-2 py-1">
        ← Exit
      </button>

      {/* Price Header */}
      <div className="top-bar mt-8 mx-4 rounded-2xl border border-amber-100 bg-white shadow-sm overflow-hidden">
        <div className="flex justify-between items-center py-3 px-1">
          <div className="text-center w-1/3 border-r border-slate-100">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">MSP Base</div>
            <div className="font-number text-lg font-black text-emerald-600">{fmt(negotiation.mspPrice)}</div>
          </div>
          <div className="text-center w-1/3 border-r border-slate-100">
            <div className="text-[10px] uppercase font-bold tracking-widest text-amber-500 animate-pulse mb-1">Arhatiya Offer</div>
            <motion.div key={negotiation.arhatiOffer} initial={{ scale: 1.4, color: '#ef4444' }}
              animate={{ scale: 1, color: '#f59e0b' }} className="font-number text-3xl font-black tracking-tighter text-amber-600">
              {fmt(negotiation.arhatiOffer)}
            </motion.div>
          </div>
          <div className="text-center w-1/3">
            <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Round</div>
            <div className="font-number text-lg font-bold text-slate-700">{negotiation.round} / {negotiation.maxRounds}</div>
          </div>
        </div>
      </div>

      {/* NPC Scene */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6 pt-10 relative">
        <motion.div animate={isArhatiTalking ? { scale: [1, 1.08, 1] } : (negotiation.confidence >= 70 ? { x: [-2, 2, -2] } : {})}
          transition={{ repeat: Infinity, duration: isArhatiTalking ? 0.3 : 0.1 }}
          className="text-[100px] drop-shadow-2xl z-10 mx-auto relative">
          🧔 {negotiation.confidence >= 70 && <span className="absolute top-0 -right-2 text-4xl animate-bounce">💦</span>}
        </motion.div>
        
        <AnimatePresence mode="wait">
          <motion.div key={dialogue} initial={{ opacity: 0, scale: 0.9, y: -20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0 }}
            className="text-center max-w-sm w-full mx-auto relative z-20 shadow-xl border border-slate-200 rounded-3xl bg-white"
            style={{ padding: '1.5rem', marginTop: '-1rem' }}>
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 rotate-45 bg-white border-t border-l border-slate-200"></div>
            <p className="text-slate-800 font-bold text-lg leading-relaxed">{dialogue}</p>
          </motion.div>
        </AnimatePresence>

        {/* Confidence */}
        <div className="w-full max-w-xs mt-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mx-auto">
          <div className="flex justify-between text-[11px] uppercase font-bold tracking-widest mb-2">
            <span className="text-slate-400">Confidence</span>
            <span className="text-brand">{negotiation.confidence}%</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full flex shadow-inner">
            <motion.div className="h-full rounded-full" animate={{ width: `${negotiation.confidence}%`, backgroundColor: '#f59e0b' }} />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="p-5 space-y-3 bg-white border-t border-slate-100 rounded-t-[2.5rem] shadow-[0_-15px_40px_rgba(0,0,0,0.05)] w-full fixed bottom-0 left-0 right-0">
        <div className="text-center text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Your Move</div>
        <div className="grid grid-cols-2 gap-3 pb-safe pt-2">
          <NegBtn icon="🤝" label={isHi ? "डील पक्की" : "Make Deal"} sub="Accept Offer"
            bg="bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100 border" onClick={() => handleAction('accept')} />
          <NegBtn icon="⚖️" label={isHi ? "MSP की मांग" : "Ask for MSP"} sub="Invoke MSP"
            bg="bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100 border relative" onClick={() => handleAction('invoke_msp')} />
          <NegBtn icon="🏛️" label={isHi ? "गोदाम की धमकी" : "Godown Storage"} sub="Show eNWR"
            bg="bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100 border relative" onClick={() => handleAction('show_enwr')} />
          <NegBtn icon="🚶" label={isHi ? "बाहर जाओ" : "Walk Away"} sub="Walk Away"
            bg="bg-red-50 text-red-800 border-red-200 hover:bg-red-100 border" onClick={() => handleAction('walk_away')} />
        </div>
      </div>
    </div>
  );
}

function NegBtn({ icon, label, sub, bg, onClick }: {
  icon: string; label: string; sub: string; bg: string; onClick: () => void;
}) {
  return (
    <motion.button whileTap={{ scale: 0.95 }} onClick={onClick}
      className={`p-4 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all shadow-sm ${bg}`}>
      <span className="text-3xl mb-1">{icon}</span>
      <span className="font-bold text-[13px] tracking-tight">{label}</span>
      <span className="text-[9px] uppercase font-bold opacity-60 tracking-widest">{sub}</span>
    </motion.button>
  );
}
