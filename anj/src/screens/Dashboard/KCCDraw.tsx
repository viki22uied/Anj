import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '../../store/gameStore';

function fmt(n: number) { return '₹' + n.toLocaleString('en-IN'); }

export default function KCCDraw({ onBack }: { onBack: () => void }) {
  const { t } = useTranslation();
  const { gameState, takeLoan } = useGameStore();
  const [amount, setAmount] = useState(5000);

  if (!gameState || !gameState.hasKCC) return null;

  const kccAvailable = gameState.kccCreditLimit - gameState.kccUsed;

  const handleDraw = () => {
    takeLoan('kcc', amount);
    onBack();
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-8 relative pt-6 p-5">
      <button onClick={onBack} className="text-sm font-bold text-slate-400 mb-4 hover:text-slate-600 flex items-center gap-1">← वापस / Back</button>
      <h1 className="font-display text-3xl text-slate-800 mb-6">KCC से निकासी</h1>
      
      <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-3xl shadow-sm mb-6 flex flex-col items-center">
        <div className="text-[10px] uppercase font-bold tracking-widest text-indigo-500 mb-1">Available Limit</div>
        <div className="font-number text-4xl font-black text-indigo-800">{fmt(Math.max(0, kccAvailable))}</div>
        <div className="mt-3 text-xs bg-white bg-opacity-80 px-3 py-1 rounded shadow-sm text-indigo-700 font-bold border border-indigo-200">
           Rate: 4% p.a. / 3% Subvention
        </div>
      </div>

      <div className="p-5 bg-white rounded-3xl shadow-sm border border-slate-200 space-y-4">
        <div className="flex justify-between items-center mb-2">
            <span className="text-xs uppercase font-bold text-slate-500 tracking-widest">Draw Amount</span>
            <span className="font-number text-2xl font-black text-slate-800">{fmt(amount)}</span>
        </div>
        <input type="range" min="100" max={Math.max(100, kccAvailable)} step="100" value={amount}
          onChange={e => setAmount(Number(e.target.value))}
          className="w-full accent-indigo-600 h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer" />
      </div>

       <button onClick={handleDraw} disabled={amount <= 0 || amount > kccAvailable}
          className="w-full mt-6 btn-primary bg-indigo-600 hover:bg-indigo-700 text-white font-black text-lg py-4 rounded-2xl shadow-indigo-600/30 transition-all disabled:opacity-50">
          💸 Confirm Cash Draw
       </button>
    </div>
  );
}
