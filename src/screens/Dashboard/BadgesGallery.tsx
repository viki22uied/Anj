import { useTranslation } from 'react-i18next';
import { useGameStore } from '../../store/gameStore';

const getBadges = (isHi: boolean) => [
  { id: 'msp_fighter', icon: '🏆', title: isHi ? 'MSP योद्धा' : 'MSP Fighter', desc: isHi ? '3 बार MSP से ऊपर भाव पाया।' : 'Negotiated above MSP 3 times.' },
  { id: 'godown_king', icon: '🏛️', title: isHi ? 'गोदाम राजा' : 'Godown King', desc: isHi ? 'लगातार 3 सीज़न eNWR का उपयोग किया।' : 'Used eNWR in 3 consecutive seasons.' },
  { id: 'insurance_wise', icon: '🛡️', title: isHi ? 'बीमा समझदार' : 'Insurance Wise', desc: isHi ? 'हर सीज़न PMFBY में नामांकन किया।' : 'Enrolled PMFBY every season.' },
  { id: 'kcc_champion', icon: '💳', title: isHi ? 'KCC चैंपियन' : 'KCC Champion', desc: isHi ? 'KCC समय पर पूरी तरह चुकाया।' : 'Repaid KCC on time perfectly.' },
  { id: 'stress_free', icon: '😌', title: isHi ? 'तनाव मुक्त' : 'Stress Free', desc: isHi ? 'न्यूनतम तनाव के साथ सीज़न समाप्त किया।' : 'Ended season with minimal stress.' },
  { id: 'debt_free', icon: '💸', title: isHi ? 'कर्ज़ मुक्त' : 'Debt Free', desc: isHi ? 'शून्य कर्ज़ के साथ सीज़न समाप्त किया।' : 'Ended a season with ZERO debt.' },
  { id: 'master_negotiator', icon: '🎯', title: isHi ? 'मास्टर नेगोशिएटर' : 'Master Negotiator', desc: isHi ? 'मंडी में सर्वोत्तम संभव भाव पाया।' : 'Got the best mandi price possible.' },
  { id: 'harvest_king', icon: '🌾', title: isHi ? 'फसल राजा' : 'Harvest King', desc: isHi ? 'अधिकतम फसल पैदावार प्राप्त की।' : 'Achieved maximum crop yield.' },
  { id: 'patient_farmer', icon: '📈', title: isHi ? 'धैर्यवान किसान' : 'Patient Farmer', desc: isHi ? 'गोदाम के माध्यम से अच्छे दामों का इंतज़ार किया।' : 'Waited for peak prices via Godown.' },
  { id: 'samriddhi_champion', icon: '🏅', title: isHi ? 'समृद्धि चैंपियन' : 'Samriddhi Champion', desc: isHi ? 'अधिकतम समृद्धि स्कोर (ग्रैंड मास्टर)।' : 'Maximum Samriddhi score. (Grand Master)' }
];

export default function BadgesGallery({ onBack }: { onBack: () => void }) {
  const { t, i18n } = useTranslation();
  const { gameState } = useGameStore();
  const isHi = i18n.language === 'hi';
  const unlockedIds = gameState?.badges.map(b => b.id) || [];
  const ALL_BADGES = getBadges(isHi);
  
  return (
    <div className="min-h-screen bg-slate-50 pb-8 rounded-t-3xl border-t border-slate-200 mt-2">
      <div className="sticky top-0 bg-white/90 backdrop-blur z-10 px-5 py-4 flex items-center justify-between border-b border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="w-10 h-10 flex items-center justify-center bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 transition-colors">←</button>
          <h2 className="font-display text-2xl text-slate-800">{isHi ? 'उपलब्धियाँ' : 'Achievements'}</h2>
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
