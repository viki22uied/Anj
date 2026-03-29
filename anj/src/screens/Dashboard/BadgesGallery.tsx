import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';

const ALL_BADGES = [
  { id: 'msp_fighter', icon: '🏆', title: 'MSP Fighter', desc: 'Negotiated above MSP 3 times.' },
  { id: 'godown_king', icon: '🏛️', title: 'Godown King', desc: 'Used eNWR in 3 consecutive seasons.' },
  { id: 'insurance_wise', icon: '🛡️', title: 'Insurance Wise', desc: 'Enrolled PMFBY every season.' },
  { id: 'kcc_champion', icon: '💳', title: 'KCC Champion', desc: 'Repaid KCC on time perfectly.' },
  { id: 'stress_free', icon: '😌', title: 'Stress Free', desc: 'Ended season with minimal stress.' },
  { id: 'debt_free', icon: '💸', title: 'Debt Free', desc: 'Ended a season with ZERO debt.' },
  { id: 'master_negotiator', icon: '🎯', title: 'Master Negotiator', desc: 'Got the best mandi price possible.' },
  { id: 'harvest_king', icon: '🌾', title: 'Harvest King', desc: 'Achieved maximum crop yield.' },
  { id: 'patient_farmer', icon: '📈', title: 'Patient Farmer', desc: 'Waited for peak prices via Godown.' },
  { id: 'samriddhi_champion', icon: '🏅', title: 'Samriddhi Champion', desc: 'Maximum Samriddhi score. (Grand Master)' }
];

export default function BadgesGallery({ onBack }: { onBack: () => void }) {
  const { gameState } = useGameStore();
  const unlockedIds = gameState?.badges.map(b => b.id) || [];
  
  return (
    <div className="min-h-screen bg-slate-50 pb-8 rounded-t-3xl border-t border-slate-200 mt-2">
      <div className="sticky top-0 bg-white/90 backdrop-blur z-10 px-5 py-4 flex items-center justify-between border-b border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="w-10 h-10 flex items-center justify-center bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 transition-colors">←</button>
          <h2 className="font-display text-2xl text-slate-800">Achievements</h2>
        </div>
        <div className="text-sm font-bold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-100">
           {unlockedIds.length} / {ALL_BADGES.length}
        </div>
      </div>

      <div className="p-5">
         <div className="grid grid-cols-2 gap-4">
           {ALL_BADGES.map(badge => {
             const isUnlocked = unlockedIds.includes(badge.id);
             return (
               <div key={badge.id} className={`p-4 rounded-3xl border ${isUnlocked ? 'bg-white border-amber-200 shadow-sm' : 'bg-slate-100 border-slate-200 opacity-60 grayscale'} flex flex-col items-center text-center relative overflow-hidden transition-all duration-300`}>
                  {isUnlocked && <div className="absolute top-0 right-0 w-12 h-12 bg-amber-400 opacity-10 blur-xl rounded-full"></div>}
                  <div className="text-5xl mb-3 drop-shadow-sm">{badge.icon}</div>
                  <h3 className={`font-bold text-sm mb-1 ${isUnlocked ? 'text-amber-900' : 'text-slate-500'}`}>{badge.title}</h3>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 leading-tight">{badge.desc}</p>
               </div>
             )
           })}
         </div>
      </div>
    </div>
  );
}
