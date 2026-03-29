import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '../../store/gameStore';
import type { GameEvent } from '../../types/game.types';

function fmt(n: number) { return '₹' + n.toLocaleString('en-IN'); }

export default function EventModal({ eventId, onBack }: { eventId: string; onBack: () => void }) {
  const { t } = useTranslation();
  const { gameState, resolveCrisisEvent } = useGameStore();

  const ev = gameState?.pendingEvents.find(e => e.id === eventId);
  if (!ev) {
    onBack();
    return null;
  }

  const handleResolve = (type: string) => {
    resolveCrisisEvent(eventId, type, type === 'pay_cash' ? Math.abs(ev.cashImpact) : 0);
    onBack();
  };

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
               <div className="text-[10px] font-bold uppercase tracking-widest text-red-500">Damage</div>
               <div className="font-number text-xl font-black text-red-700">{fmt(Math.abs(ev.cashImpact))}</div>
            </div>
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
               <div className="text-[10px] font-bold uppercase tracking-widest text-amber-500">Yield Risk</div>
               <div className="font-number text-xl font-black text-amber-700">{Math.round((1 - ev.yieldImpact)*100)}% Drop</div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100 space-y-3">
          <button onClick={() => handleResolve('pay_cash')} disabled={(gameState?.cashInHand ?? 0) < Math.abs(ev.cashImpact)}
            className="w-full btn-primary py-4 rounded-xl text-lg font-bold flex items-center justify-center gap-2 bg-slate-800 text-white disabled:opacity-50">
            💰 Pay {fmt(Math.abs(ev.cashImpact))}
          </button>
          
          <button onClick={() => handleResolve('ignore')} 
            className="w-full py-4 rounded-xl text-sm font-bold uppercase tracking-widest text-slate-500 hover:text-slate-800 transition-colors border border-slate-200 bg-white shadow-sm">
            ⚠️ Ignore (Suffer Impact)
          </button>
        </div>
      </motion.div>
    </div>
  );
}
