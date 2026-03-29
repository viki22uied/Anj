import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '../../store/gameStore';
import type { LenderType } from '../../types/game.types';

function fmt(n: number) { return '₹' + n.toLocaleString('en-IN'); }

export default function CreditEngine({ onBack }: { onBack: () => void }) {
  const { t } = useTranslation();
  const { gameState, takeLoan, applyKCC } = useGameStore();
  const [showCompare, setShowCompare] = useState(false);

  if (!gameState) return null;

  const handleLoan = (lender: LenderType, amount: number) => {
    takeLoan(lender, amount);
    onBack();
  };

  const kccAvailable = gameState.kccCreditLimit - gameState.kccUsed;

  return (
    <div className="min-h-screen bg-slate-50 pb-8 relative">
      <div className="px-5 pt-6 pb-4">
        <button onClick={onBack} className="text-sm font-bold text-slate-400 mb-4 hover:text-slate-600 flex items-center gap-1">← वापस / Back</button>
        <h1 className="font-display text-3xl text-slate-800">उधार लो / Take Loan</h1>
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

        {/* ─── MONEYLENDER ─── */}
        <div className="bg-red-50 rounded-3xl p-5 shadow-sm border border-red-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-100 blur-3xl rounded-full opacity-60 mix-blend-multiply translate-x-10 -translate-y-10"></div>
          <h2 className="font-display text-2xl text-red-800 relative z-10 mb-1">साहूकार / Moneylender</h2>
          <div className="flex gap-2 text-[10px] font-bold uppercase tracking-widest text-red-600 mb-4 relative z-10">
            <span className="bg-white px-2 py-0.5 rounded shadow-sm">Rate 48% p.a.</span>
            <span className="bg-white px-2 py-0.5 rounded shadow-sm">Instant</span>
          </div>
          
          <div className="grid grid-cols-2 gap-2 relative z-10">
            <button onClick={() => handleLoan('moneylender', 5000)} className="bg-white text-red-700 py-3 rounded-xl shadow-sm font-bold border border-red-100 hover:border-red-300">₹5,000</button>
            <button onClick={() => handleLoan('moneylender', 10000)} className="bg-white text-red-700 py-3 rounded-xl shadow-sm font-bold border border-red-100 hover:border-red-300">₹10,000</button>
            <button onClick={() => handleLoan('moneylender', 20000)} className="col-span-2 bg-red-600 text-white py-3 rounded-xl shadow-md font-bold hover:bg-red-700 border border-transparent">₹20,000</button>
          </div>
        </div>

        {/* ─── KCC ─── */}
        <div className="bg-indigo-50 rounded-3xl p-5 shadow-sm border border-indigo-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-100 blur-3xl rounded-full opacity-60 mix-blend-multiply translate-x-10 -translate-y-10"></div>
          <h2 className="font-display text-2xl text-indigo-800 relative z-10 mb-1">KCC (Kisan Credit Card)</h2>
          <div className="flex gap-2 text-[10px] font-bold uppercase tracking-widest text-indigo-600 mb-4 relative z-10">
            <span className="bg-white px-2 py-0.5 rounded shadow-sm">Rate 4% p.a.</span>
            <span className="bg-white px-2 py-0.5 rounded shadow-sm">Needs records</span>
          </div>

          <div className="relative z-10">
            {!gameState.hasKCC ? (
              gameState.kccApplicationPending ? (
                <div className="bg-white p-4 rounded-xl shadow-sm border border-indigo-100 text-center">
                  <div className="text-xl mb-1">⏳</div>
                  <div className="font-bold text-indigo-800 text-sm">Application Pending...</div>
                  <div className="text-xs text-indigo-600/80">{gameState.kccApprovalWeeksRemaining} weeks remaining</div>
                </div>
              ) : (
                <button onClick={applyKCC} className="w-full bg-indigo-600 text-white py-4 rounded-xl shadow-md font-bold uppercase tracking-widest text-sm hover:bg-indigo-700">
                  Apply for KCC
                </button>
              )
            ) : kccAvailable > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => handleLoan('kcc', Math.min(5000, kccAvailable))} className="bg-white text-indigo-700 py-3 rounded-xl shadow-sm font-bold border border-indigo-100 hover:border-indigo-300 transform active:scale-95 transition-transform" disabled={kccAvailable < 1000}>₹5,000</button>
                <button onClick={() => handleLoan('kcc', Math.min(10000, kccAvailable))} className="bg-white text-indigo-700 py-3 rounded-xl shadow-sm font-bold border border-indigo-100 hover:border-indigo-300 transform active:scale-95 transition-transform" disabled={kccAvailable < 5000}>₹10,000</button>
                <button onClick={() => handleLoan('kcc', kccAvailable)} className="col-span-2 bg-indigo-600 text-white py-3 rounded-xl shadow-md font-bold hover:bg-indigo-700 text-sm transform active:scale-95 transition-transform">
                  Full Limit (₹{kccAvailable.toLocaleString('en-IN')})
                </button>
              </div>
            ) : (
              <button disabled className="w-full bg-slate-200 text-slate-500 py-4 rounded-xl shadow-sm font-bold uppercase tracking-widest text-sm opacity-80 cursor-not-allowed">
                KCC Limit Full (₹{gameState.kccCreditLimit})
              </button>
            )}
          </div>
        </div>

        {/* ─── COOPERATIVE ─── */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200">
          <h2 className="font-display text-xl text-slate-800 mb-1">Cooperative (सहकारी)</h2>
          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">Rate 9% p.a. · Group guarantee</div>
          <div className="flex gap-2">
             <button onClick={() => handleLoan('cooperative', 10000)} className="flex-1 bg-slate-50 text-slate-700 py-3 rounded-xl shadow-sm font-bold border border-slate-200 hover:border-slate-300">₹10K</button>
             <button onClick={() => handleLoan('cooperative', 20000)} className="flex-1 bg-slate-50 text-slate-700 py-3 rounded-xl shadow-sm font-bold border border-slate-200 hover:border-slate-300">₹20K</button>
             <button onClick={() => handleLoan('cooperative', 50000)} className="flex-1 bg-slate-50 text-slate-700 py-3 rounded-xl shadow-sm font-bold border border-slate-200 hover:border-slate-300">₹50K</button>
          </div>
        </div>

        {/* ─── NBFC ─── */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200">
          <h2 className="font-display text-xl text-slate-800 mb-1">NBFC / Microfinance</h2>
          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">Rate 22% p.a. · No collateral</div>
          <div className="flex gap-2">
             <button onClick={() => handleLoan('nbfc', 10000)} className="flex-1 bg-slate-50 text-slate-700 py-3 rounded-xl shadow-sm font-bold border border-slate-200 hover:border-slate-300">₹10K</button>
             <button onClick={() => handleLoan('nbfc', 25000)} className="flex-1 bg-slate-50 text-slate-700 py-3 rounded-xl shadow-sm font-bold border border-slate-200 hover:border-slate-300">₹25K</button>
          </div>
        </div>

        <button onClick={() => setShowCompare(true)} className="w-full flex items-center justify-center gap-2 py-4 mt-2 text-sm font-bold uppercase tracking-widest text-blue-600 bg-blue-50 border border-blue-100 rounded-2xl hover:bg-blue-100 transition-colors">
          📊 Compare All Loans
        </button>

      </div>

      <AnimatePresence>
        {showCompare && (
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }}
            className="fixed inset-0 z-50 bg-slate-50/95 backdrop-blur overflow-y-auto p-5 pb-20">
            <button onClick={() => setShowCompare(false)} className="text-sm font-bold text-slate-400 mb-8 mt-4 hover:text-slate-600 flex items-center gap-1">← Close</button>
            <h2 className="font-display text-3xl mb-6">Compare Loans</h2>
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead><tr className="bg-slate-50 border-b border-slate-100">
                  <th className="p-4 font-bold text-slate-500">Lender</th>
                  <th className="p-4 font-bold text-slate-500 text-right">Rate</th>
                  <th className="p-4 font-bold text-slate-500 text-right">Repay 10K (6mo)</th>
                </tr></thead>
                <tbody>
                  <tr className="border-b border-slate-100 hover:bg-red-50">
                    <td className="p-4 font-bold text-red-600">Moneylender</td><td className="p-4 text-right">48%</td><td className="p-4 text-right font-number">₹12,400</td>
                  </tr>
                  <tr className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="p-4 font-bold">NBFC</td><td className="p-4 text-right">22%</td><td className="p-4 text-right font-number">₹11,100</td>
                  </tr>
                   <tr className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="p-4 font-bold text-indigo-600">Cooperative</td><td className="p-4 text-right">9%</td><td className="p-4 text-right font-number">₹10,450</td>
                  </tr>
                  <tr className="bg-emerald-50 text-emerald-900 border-emerald-200 border-y-2 relative">
                    <td className="p-4 font-bold text-emerald-800">KCC</td><td className="p-4 text-right font-bold text-emerald-600">4%</td><td className="p-4 text-right font-number font-black text-emerald-700">₹10,200</td>
                  </tr>
                </tbody>
              </table>
              <div className="p-4 text-[10px] text-slate-500">Note: Informal loans drastically increase cognitive stress. Bank limits stress.</div>
            </div>
            <button onClick={() => setShowCompare(false)} className="mt-8 btn-primary w-full bg-slate-800 text-white rounded-2xl py-4 shadow-xl">Go Back</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
