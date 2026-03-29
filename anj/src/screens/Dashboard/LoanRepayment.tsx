import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../store/gameStore';

function fmt(n: number) { return '₹' + n.toLocaleString('en-IN'); }

export default function LoanRepayment({ onBack }: { onBack: () => void }) {
  const { gameState, repayLoan, repayAllKCC } = useGameStore();

  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (!gameState) return null;

  return (
    <div className="min-h-screen bg-slate-50 pb-8 relative">
      <div className="px-5 pt-6 pb-4">
        <button onClick={onBack} className="text-sm font-bold text-slate-400 mb-4 hover:text-slate-600 flex items-center gap-1">← वापस / Back</button>
        <h1 className="font-display text-3xl text-slate-800">कर्ज़ चुकाओ / Repay Debt</h1>
        <div className="flex justify-between items-center mt-3 bg-white p-3 rounded-xl shadow-sm border border-slate-100">
          <div>
            <div className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Total Debt</div>
            <div className={`font-number text-xl font-black ${gameState.totalDebt > 0 ? 'text-red-500' : 'text-slate-600'}`}>{fmt(gameState.totalDebt)}</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Cash in Hand</div>
            <div className="font-number text-xl font-black text-emerald-600">{fmt(gameState.cashInHand)}</div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">

        {/* ─── BULK ACTION ─── */}
        {gameState.kccUsed > 0 && (
          <button onClick={repayAllKCC} disabled={gameState.cashInHand < gameState.kccUsed}
            className={`w-full p-4 rounded-3xl shadow-sm flex items-center justify-center gap-2 border font-bold uppercase tracking-widest text-xs transition-colors
              ${gameState.cashInHand >= gameState.kccUsed ? 'bg-indigo-600 text-white hover:bg-indigo-700 border-transparent shadow-indigo-600/20' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
             सब KCC चुकाओ / Pay All KCC
          </button>
        )}

        {/* ─── DEBT ITEMS ─── */}
        {gameState.debtBreakdown.map(debt => {
          const isML = debt.lender === 'moneylender';
          const isKCC = debt.lender === 'kcc';
          const baseColor = isML ? 'red' : isKCC ? 'indigo' : 'amber';
          
          const isExpanded = expandedId === debt.id;

          return (
            <motion.div key={debt.id} layout
              className={`bg-white rounded-3xl shadow-sm border overflow-hidden ${isExpanded ? `border-${baseColor}-200` : 'border-slate-200'}`}>
              
              <button onClick={() => setExpandedId(isExpanded ? null : debt.id)}
                className={`w-full p-5 flex justify-between items-center transition-colors hover:bg-slate-50 ${isExpanded ? `bg-${baseColor}-50/30` : ''}`}>
                <div className="text-left">
                  <div className={`font-bold text-lg text-${baseColor}-800`}>
                    {isML ? 'साहूकार' : isKCC ? 'KCC' : debt.lender === 'cooperative' ? 'सहकारी' : debt.lender === 'enwr_pledge' ? 'eNWR Pledge' : 'NBFC'}
                  </div>
                  <div className="text-xs text-slate-500 font-medium mt-1">
                    Rate: <span className="font-bold">{debt.interestRatePA}%</span> p.a.
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-number text-xl font-black text-${baseColor}-600`}>{fmt(debt.amount)}</div>
                  <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">{isExpanded ? 'Close ×' : 'Pay ▼'}</div>
                </div>
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    className={`bg-${baseColor}-50 border-t border-${baseColor}-100 p-5 space-y-3`}>
                    
                    <div className="grid grid-cols-2 gap-2">
                       <button onClick={() => repayLoan(debt.id, 500)} disabled={gameState.cashInHand < 500} 
                        className={`py-3 rounded-xl font-bold shadow-sm border hover:border-${baseColor}-300 transition-colors
                          ${gameState.cashInHand >= 500 ? `bg-white text-${baseColor}-700 border-${baseColor}-100` : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                        ₹500 Pay
                       </button>

                       <button onClick={() => repayLoan(debt.id, 1000)} disabled={gameState.cashInHand < 1000} 
                        className={`py-3 rounded-xl font-bold shadow-sm border hover:border-${baseColor}-300 transition-colors
                          ${gameState.cashInHand >= 1000 ? `bg-white text-${baseColor}-700 border-${baseColor}-100` : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                        ₹1,000 Pay
                       </button>

                       <button onClick={() => repayLoan(debt.id, 5000)} disabled={gameState.cashInHand < 5000} 
                        className={`py-3 rounded-xl font-bold shadow-sm border hover:border-${baseColor}-300 transition-colors col-span-2
                          ${gameState.cashInHand >= 5000 ? `bg-white text-${baseColor}-700 border-${baseColor}-100` : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                        ₹5,000 Pay
                       </button>
                    </div>

                    <button onClick={() => repayLoan(debt.id, debt.amount)} disabled={gameState.cashInHand < debt.amount}
                      className={`w-full py-4 rounded-xl font-black uppercase tracking-widest text-sm shadow-md transition-all
                        ${gameState.cashInHand >= debt.amount ? `bg-${baseColor}-600 text-white hover:bg-${baseColor}-700` : 'bg-slate-300 text-slate-500 cursor-not-allowed'}`}>
                      पूरा चुकाओ / Pay Full
                    </button>

                    <button onClick={() => setExpandedId(null)} className="w-full py-3 text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-slate-800 transition-colors">
                      अभी नहीं / Not Now
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

            </motion.div>
          );
        })}

        {gameState.debtBreakdown.length === 0 && (
          <div className="bg-emerald-50 rounded-3xl p-8 shadow-sm border border-emerald-100 text-center">
             <div className="text-6xl mb-4">🎉</div>
             <h2 className="font-display text-2xl text-emerald-800">कर्ज़ मुक्त!</h2>
             <p className="text-sm font-medium text-emerald-600/80 mt-2 mt-1">You are completely debt free. Great job!</p>
          </div>
        )}

      </div>
    </div>
  );
}
