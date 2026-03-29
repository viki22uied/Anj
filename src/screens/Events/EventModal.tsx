import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '../../store/gameStore';

function fmt(n: number) { return '₹' + n.toLocaleString('en-IN'); }

export default function EventModal({ eventId, onBack }: { eventId: string; onBack: () => void }) {
  const { t, i18n } = useTranslation();
  const { gameState, resolveCrisisEvent, recordDecision } = useGameStore();
  const isHi = i18n.language === 'hi';

  const ev = gameState?.pendingEvents.find(e => e.id === eventId);
  
  useEffect(() => {
    if (ev && typeof navigator !== 'undefined' && navigator.vibrate) {
      // PRD Section 3.3 Haptic Feedback: Double pulse for crisis
      navigator.vibrate([100, 50, 200]);
    }
  }, [ev]);

  if (!ev) {
    onBack();
    return null;
  }

  const handleResolve = (type: string) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
       // Heavy thud on action
       navigator.vibrate(50);
    }
    resolveCrisisEvent(eventId, type, type === 'pay_cash' ? Math.abs(ev.cashImpact) : 0);
    onBack();
  };

  // 1. NIGHT FEAR SCENARIO
  if (ev.type === 'night_fear') {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center p-5 relative overflow-hidden">
        {/* Dark atmospheric background */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900 to-slate-800 pointer-events-none"></div>
        <div className="absolute top-1/4 left-1/2 w-32 h-32 bg-amber-500/10 blur-[50px] rounded-full pointer-events-none -translate-x-1/2"></div>
        
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1 }}
          className="relative z-10 w-full max-w-sm text-center">
          
          <div className="text-amber-500/50 mb-8 animate-flicker text-4xl select-none">🪔</div>
          
          <motion.div 
            variants={{
              visible: { transition: { staggerChildren: 1.2 } }
            }}
            initial="hidden"
            animate="visible"
            className="space-y-6 text-left mb-12 px-2 text-slate-300 font-medium leading-relaxed"
          >
            <motion.p variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}>
              {isHi ? <>साहूकार का <strong>{fmt(gameState?.totalDebt || 0)}</strong> चाहिए।</> : <>Moneylender needs <strong>{fmt(gameState?.totalDebt || 0)}</strong>.</>}
            </motion.p>
            <motion.p variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}>
              {isHi ? <>फसल आने में अभी {(24 - (gameState?.weekNumber || 0)) * 7} दिन बाकी हैं।<br/>इस महीने घर का खर्चा — बच्चे की फीस, दवाई, राशन।</> : <>Harvest is still {(24 - (gameState?.weekNumber || 0)) * 7} days away.<br/>This month's expenses — school fees, medicines, rations.</>}
            </motion.p>
            <motion.p variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}>
              {isHi ? <>बैंक खाते में <strong>{fmt(gameState?.cashInHand || 0)}</strong> बचे हैं।</> : <>Only <strong>{fmt(gameState?.cashInHand || 0)}</strong> left in the bank.</>}
            </motion.p>
            <motion.p variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }} className="text-amber-500 font-bold mt-4 text-center text-lg italic">
              {isHi ? 'रात को नींद नहीं आती।' : 'Sleep evades you at night.'}
            </motion.p>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 6 }} className="space-y-4">
            <button onClick={() => { recordDecision('night_fear', 'sleep'); handleResolve('ignore'); }} 
              className="w-full bg-slate-900 border border-slate-800 p-4 rounded-xl text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors">
              🌙 {isHi ? 'बस सोने की कोशिश करो' : 'Just try to sleep'}
            </button>
            <button onClick={() => { recordDecision('night_fear', 'bank_mitra'); handleResolve('pay_cash'); }} 
              className="w-full bg-emerald-900/30 border border-emerald-800 text-emerald-400 p-4 rounded-xl font-bold shadow-lg shadow-emerald-900/20">
              📞 {isHi ? 'बैंक मित्र को फोन करो (KCC)' : 'Call Bank Mitra (KCC)'}
            </button>
            <button onClick={() => { recordDecision('night_fear', 'calc'); handleResolve('ignore'); }} 
              className="w-full bg-slate-800 p-4 rounded-xl text-slate-400 text-xs tracking-widest uppercase font-bold">
              📊 {isHi ? 'हिसाब लगाओ (Calculate)' : 'Calculate the numbers'}
            </button>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  // 2. SCHOOL FEES SCENARIO
  if (ev.type === 'school_fees') {
    const feesAmount = 3500; 
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-5">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} 
          className="w-full max-w-sm bg-white rounded-3xl shadow-2xl relative overflow-hidden">
          <div className="bg-sky-50 pt-8 pb-4 text-center relative">
            <div className="text-6xl mb-2 relative z-10">🎒</div>
            <h2 className="font-display text-2xl text-slate-800">{isHi ? 'स्कूल की फीस' : 'School Fees Deadline'}</h2>
          </div>
          <div className="p-6">
            <p className="text-slate-700 font-medium text-center mb-6">
              {isHi ? `"बाबा, कल तक फीस जमा करनी है। ${fmt(feesAmount)}। नहीं दिया तो नाम काट देंगे।"` : `"Father, fees must be paid by tomorrow. ${fmt(feesAmount)}. Or they'll strike my name."`}
            </p>
            <div className="space-y-3">
              <button disabled={(gameState?.cashInHand ?? 0) < feesAmount} onClick={() => { recordDecision('school_fees', 'pay_cash'); handleResolve('pay_cash'); }}
                 className="w-full p-4 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl font-bold">
                 {isHi ? `नकद चुकाएं (${fmt(feesAmount)})` : `Pay Cash (${fmt(feesAmount)})`}
              </button>
              <button onClick={() => { recordDecision('school_fees', 'moneylender'); handleResolve('ignore'); }}
                 className="w-full p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl font-bold">
                 {isHi ? `साहूकार से ${fmt(feesAmount)} उधार लो (@ 48%)` : `Borrow ${fmt(feesAmount)} from Moneylender (@ 48%)`}
              </button>
              {gameState?.hasKCC && (
                <button onClick={() => { recordDecision('school_fees', 'kcc'); handleResolve('ignore'); }}
                   className="w-full p-4 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl font-bold">
                   {isHi ? 'KCC का इस्तेमाल करो (@ 4%)' : 'Use KCC limit (@ 4%)'}
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // 3. ONION PRICE CRASH SCENARIO
  if (ev.type === 'price_crash') {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-5">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} 
          className="w-full max-w-sm bg-white rounded-3xl shadow-2xl relative overflow-hidden">
          <div className="bg-red-50 py-4 px-6 border-b border-red-100 flex items-center gap-3">
             <div className="text-red-600 animate-pulse">{isHi ? '🔴 ब्रेकिंग न्यूज़:' : '🔴 Breaking News:'}</div>
             <div className="text-red-800 font-bold text-sm">{isHi ? 'प्याज के दाम गिरे' : 'Onion Prices Crash'}</div>
          </div>
          <div className="p-6 text-center">
            <h2 className="font-display text-2xl text-slate-800 mb-2">{isHi ? 'मंडी में दाम क्रैश' : 'Market Crash'}</h2>
            <p className="text-slate-600 font-medium leading-relaxed mb-6 text-sm">
              {isHi ? `"${gameState?.harvestYieldQuintals} क्विंटल प्याज़ तैयार है। मंडियों में माल भर गया है। भाव बहुत नीचे हैं। लागत भी नहीं निकलेगी।"` : `"${gameState?.harvestYieldQuintals} quintals ready. Markets are flooded. Prices have hit rock bottom. Won't even cover costs."`}
            </p>
            <div className="space-y-3">
              <button onClick={() => { recordDecision('onion_crash', 'sell_low'); handleResolve('ignore'); }}
                 className="w-full p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl font-bold text-sm">
                 {isHi ? 'कम दाम में बेचो (नुकसान बुक करो)' : 'Sell at loss (Distress Sale)'}
              </button>
              <button disabled={(gameState?.cashInHand ?? 0) < 2000} onClick={() => { recordDecision('onion_crash', 'cold_storage'); handleResolve('pay_cash'); }}
                 className="w-full p-4 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl font-bold text-sm">
                 {isHi ? 'कोल्ड स्टोरेज में रखो (₹2,000 खर्च)' : 'Move to Cold Storage (₹2,000 cost)'}
              </button>
              {(gameState?.reputationScore ?? 0) >= 50 && (
                <button onClick={() => { recordDecision('onion_crash', 'fpo'); handleResolve('ignore'); }}
                   className="w-full p-4 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl font-bold text-sm">
                   {isHi ? 'FPO की मदद लो (बेहतर भाव)' : 'Seek FPO Help (Better Rate)'}
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // 4. KCC APPROVED SCENARIO
  if (ev.type === 'kcc_approved') {
    return (
      <div className="fixed inset-0 z-50 bg-emerald-950/20 backdrop-blur-xl flex items-center justify-center p-5">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} 
          className="w-full max-w-sm bg-white rounded-[40px] shadow-2xl relative overflow-hidden text-center p-8 border-4 border-emerald-100">
          <div className="text-7xl mb-6">🏦</div>
          <h2 className="font-display text-3xl text-emerald-800 mb-2">{isHi ? 'KCC मंज़ूर हो गया!' : 'KCC Approved!'}</h2>
          <p className="text-slate-600 font-medium leading-relaxed mb-6">
            {isHi ? '"बधाई हो! आपका ₹50,000 का कार्ड तैयार है। अब साहूकार के पास जाने की ज़रूरत नहीं।"' : '"Congratulations! Your ₹50,000 card is ready. No more trips to the moneylender."'}
          </p>
          <div className="bg-emerald-50 p-4 rounded-3xl mb-8 flex justify-between items-center">
            <div className="text-left">
              <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">{isHi ? 'ब्याज दर' : 'Interest Rate'}</div>
              <div className="text-xl font-black text-emerald-800">4% <span className="text-[10px] font-bold">p.a.</span></div>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">{isHi ? 'कोलेटरल' : 'Collateral'}</div>
              <div className="text-xs font-bold text-emerald-800">{isHi ? 'कोई नहीं' : 'Nil (up to 1.6L)'}</div>
            </div>
          </div>
          <button onClick={() => { useGameStore.getState().claimKCC(); handleResolve('ignore'); }}
             className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black text-xl shadow-xl shadow-emerald-600/30 uppercase tracking-widest">
             {isHi ? 'कार्ड स्वीकार करें' : 'Accept KCC Card'}
          </button>
        </motion.div>
      </div>
    );
  }

  // 5. PMFBY CLAIM RECEIVED SCENARIO
  if (ev.type === 'pmfby_claim_received') {
    return (
      <div className="fixed inset-0 z-50 bg-amber-950/20 backdrop-blur-xl flex items-center justify-center p-5">
         <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} 
          className="w-full max-w-sm bg-white rounded-[40px] shadow-2xl relative overflow-hidden text-center p-8 border-4 border-amber-100 emotion-relief">
          <div className="text-7xl mb-6">🛡️</div>
          <h2 className="font-display text-3xl text-amber-800 mb-2">{isHi ? 'बीमा मिल गया!' : 'Insurance Payout!'}</h2>
          <p className="text-slate-600 font-medium leading-relaxed mb-6">
            {isHi ? `आपके बैंक खाते में ${fmt(ev.cashImpact)} जमा कर दिए गए हैं। फसल नुकसान की भरपाई हो गई!` : `Payout of ${fmt(ev.cashImpact)} deposited. Your crop loss is now covered!`}
          </p>
          <div className="bg-amber-50 p-6 rounded-3xl mb-8 border border-amber-200">
            <div className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-1">{isHi ? 'कुल राशि' : 'Net Payout'}</div>
            <div className="font-number text-4xl font-black text-amber-900">{fmt(ev.cashImpact)}</div>
          </div>
          <button onClick={() => { useGameStore.getState().collectInsuranceClaim(); handleResolve('ignore'); }}
             className="w-full py-5 bg-amber-500 text-white rounded-2xl font-black text-xl shadow-xl shadow-amber-500/30 uppercase tracking-widest">
             {isHi ? 'बैंक में प्राप्त करें' : 'Collect in Bank'}
          </button>
        </motion.div>
      </div>
    );
  }
  const isCropLossEvent = ev.type === 'flood' || ev.type === 'drought' || ev.type === 'pest_attack';
  
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-5">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden relative">
        <div className="absolute top-0 left-0 right-0 h-32 bg-red-500 overflow-hidden flex items-center justify-center pointer-events-none">
          <div className="text-9xl opacity-20 transform translate-y-4">⚠️</div>
        </div>
        
        <div className="relative z-10 p-6 pt-12 pb-8 text-center mt-6 bg-white rounded-t-3xl">
          <h2 className="font-display text-3xl text-slate-800 mb-2">{t(ev.titleKey)}</h2>
          <p className="text-slate-600 font-medium leading-relaxed">{t(ev.descKey)}</p>

          <div className="grid grid-cols-2 gap-3 mt-6">
            <div className="p-3 bg-red-50 rounded-xl border border-red-100">
               <div className="text-[10px] font-bold uppercase tracking-widest text-red-500">{isHi ? 'नुकसान' : 'Damage'}</div>
               <div className="font-number text-xl font-black text-red-700">{fmt(Math.abs(ev.cashImpact))}</div>
            </div>
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
               <div className="text-[10px] font-bold uppercase tracking-widest text-amber-500">{isHi ? 'पैदावार जोखिम' : 'Yield Risk'}</div>
               <div className="font-number text-xl font-black text-amber-700">{Math.round((1 - ev.yieldImpact)*100)}% {isHi ? 'गिरावट' : 'Drop'}</div>
            </div>
          </div>

          {isCropLossEvent && !gameState?.pmfbyEnrolled && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} transition={{ delay: 0.5 }} className="mt-4 pt-4 border-t border-slate-100 text-left">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="font-bold text-slate-700 mb-1">{isHi ? 'बिना बीमा' : 'No Insurance'}</div>
                  <div className="text-red-500 font-bold">{Math.round((1 - ev.yieldImpact)*100)}% {isHi ? 'नुकसान' : 'Loss'}</div>
                  <div className="text-[9px] text-slate-500 leading-tight mt-1">{isHi ? 'आपको पूरा नुकसान सहना होगा।' : 'You bear the full loss.'}</div>
                </div>
                <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg opacity-60">
                  <div className="font-bold text-blue-700 mb-1">{isHi ? 'बीमा होता तो (PMFBY)' : 'If Insured (PMFBY)'}</div>
                  <div className="text-blue-600 font-bold">100% {isHi ? 'कवरेज' : 'Coverage'}</div>
                  <div className="text-[9px] text-blue-600 leading-tight mt-1">{isHi ? '₹500 देकर सारा जोखिम कवर होता।' : '₹500 premium would cover all risks.'}</div>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100 space-y-3">
          {ev.cashImpact !== 0 && (
             <button onClick={() => handleResolve('pay_cash')} disabled={(gameState?.cashInHand ?? 0) < Math.abs(ev.cashImpact)}
              className="w-full btn-primary py-4 rounded-xl text-lg font-bold flex items-center justify-center gap-2 bg-slate-800 text-white disabled:opacity-50">
              💰 {isHi ? 'भुगतान करें' : 'Pay'} {fmt(Math.abs(ev.cashImpact))}
             </button>
          )}
          
           <button onClick={() => handleResolve('ignore')} 
            className="w-full py-4 rounded-xl text-sm font-bold uppercase tracking-widest text-slate-500 hover:text-slate-800 transition-colors border border-slate-200 bg-white shadow-sm">
            ⚠️ {ev.cashImpact !== 0 ? (isHi ? 'नजरअंदाज करें (असर पड़ेगा)' : 'Ignore (Suffer Impact)') : (isHi ? 'आगे बढ़ें' : 'Continue')}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
