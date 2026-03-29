import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '../../store/gameStore';
import { toRealLifeEquivalent } from '../../utils/converters';

function fmt(n: number) { return '₹' + n.toLocaleString('en-IN'); }

export default function GameFinale({ onRestart, onHome }: { onRestart: () => void; onHome: () => void }) {
  const { t, i18n } = useTranslation();
  const { gameState, farmer } = useGameStore();
  const isHi = i18n.language === 'hi';

  if (!gameState || !farmer) return null;

  const samriddhiScore = gameState.samriddhiScore;
  const currentCash = gameState.cashInHand;
  const currentDebt = gameState.totalDebt;

  return (
    <div className="min-h-screen flex flex-col items-center justify-start p-6 bg-white safe-top safe-bottom overflow-y-auto">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-md space-y-12 py-12">
        
        {/* PHASE 1: SAME FARMER, DIFFERENT LIFE */}
        <section className="text-center space-y-8">
          <h2 className="font-display text-4xl text-slate-900 leading-tight">
            {isHi ? 'पाँच साल बाद' : 'Five Years Later'}
          </h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-4 opacity-50">
              <div className="text-5xl grayscale">👨🏽‍🌾</div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{isHi ? 'शुरुआत में' : 'At Start'}</div>
              <div className="space-y-1 text-xs font-bold text-slate-500">
                <div>{isHi ? 'तनाव' : 'Stress'}: 80/100</div>
                <div>{isHi ? 'समृद्धि' : 'Samriddhi'}: 0</div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="text-5xl">👨🏽‍🌾</div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-500">{isHi ? 'आज' : 'Today'}</div>
              <div className="space-y-1 text-xs font-bold text-slate-800">
                <div>{isHi ? 'तनाव' : 'Stress'}: {gameState.stressLevel}/100</div>
                <div>{isHi ? 'समृद्धि' : 'Samriddhi'}: {samriddhiScore}</div>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 text-left space-y-4 font-bold text-slate-700">
             <div className="flex justify-between items-center border-b border-slate-200 pb-2">
               <span>{isHi ? 'बैंक खाता' : 'Bank Balance'}</span>
               <span className="text-emerald-600">{fmt(currentCash)}</span>
             </div>
             <div className="flex justify-between items-center border-b border-slate-200 pb-2">
               <span>{isHi ? 'कर्ज़' : 'Total Debt'}</span>
               <span className={currentDebt > 0 ? 'text-red-500' : 'text-emerald-600'}>
                 {currentDebt === 0 ? (isHi ? 'कर्ज़ मुक्त!' : 'Debt Free!') : fmt(currentDebt)}
               </span>
             </div>
          </div>
        </section>

        {/* PHASE 2: LEARNING SUMMARY */}
        <section className="space-y-6">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 text-center">{isHi ? 'आपकी प्रगति' : 'Your Progress'}</h3>
          <div className="space-y-4">
            {gameState.hasKCC && (
              <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100 flex gap-4">
                <span className="text-2xl">🏦</span>
                <p className="text-blue-900 text-sm leading-tight font-medium">
                  {isHi ? 'आपने KCC अपनाया। साहूकार के चक्रव्यूह से बाहर निकलकर आपने हज़ारों रुपये ब्याज बचाया।' : 'You adopted KCC. By escaping the moneylender\'s loop, you saved thousands in interest.'}
                </p>
              </div>
            )}
            {gameState.pmfbyEnrolled && (
              <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-100 flex gap-4">
                <span className="text-2xl">🛡️</span>
                <p className="text-emerald-900 text-sm leading-tight font-medium">
                  {isHi ? 'आपने फसल का बीमा (PMFBY) किया। जोखिम को खुद उठाने के बजाय सुरक्षित रास्ता चुना।' : 'You insured your crops (PMFBY). You chose security over unmanaged risk.'}
                </p>
              </div>
            )}
            {gameState.eNWRActive && (
              <div className="bg-amber-50 p-5 rounded-2xl border border-amber-100 flex gap-4">
                <span className="text-2xl">🏛️</span>
                <p className="text-amber-900 text-sm leading-tight font-medium">
                  {isHi ? 'आपने गोदाम (eNWR) का इस्तेमाल किया। कम दाम में बेचने की मजबूरी को खत्म किया।' : 'You used the Warehouse (eNWR). You ended the compulsion to sell at low prices.'}
                </p>
              </div>
            )}
          </div>
        </section>

        {/* PHASE 3: THE REAL PERSON STORY */}
        <section className="bg-slate-900 text-white p-8 rounded-[40px] space-y-6">
          <div className="w-16 h-1 w-16 bg-slate-700 mx-auto rounded-full"></div>
          <div className="text-center font-display text-2xl">{isHi ? 'यह सब असली है' : 'This is Real'}</div>
          <p className="text-slate-400 text-sm text-center leading-relaxed">
            {isHi ? 'महेश कुमार — विदर्भ, महाराष्ट्र\n2019 तक साहूकार से उधार लेता था। 2020 में KCC लिया। 2 साल में पूरा कर्ज़ चुका दिया। अब चैन की नींद आती है।' : 'Mahesh Kumar — Vidarbha, Maharashtra\nBorrowed from moneylenders until 2019. Took KCC in 2020. Repaid everything in 2 years. Now sleeps in peace.'}
          </p>
        </section>

        {/* PHASE 4: CALL TO ACTION */}
        <section className="space-y-8 pt-8 text-center pb-20">
           <div className="space-y-4">
             <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">{isHi ? 'असली मदद के लिए' : 'For Real Support'}</div>
             <div className="text-2xl font-black text-slate-800">📞 1800-180-1551</div>
             <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{isHi ? 'किसान कॉल सेंटर (Toll Free)' : 'Kisan Call Centre (Toll Free)'}</p>
           </div>

           <div className="space-y-3">
             <button onClick={onRestart} className="btn-primary w-full py-4 text-xl">
               {isHi ? 'फिर से खेलें' : 'Play Again'}
             </button>
             <button onClick={onHome} className="btn-secondary w-full py-4 uppercase font-bold text-[10px] tracking-widest">
               {isHi ? 'होम' : 'Home'}
             </button>
           </div>
        </section>

      </motion.div>
    </div>
  );
}
