import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '../../store/gameStore';

function fmt(n: number) { return '₹' + n.toLocaleString('en-IN'); }

export default function SeasonRecap({ onContinue }: { onContinue: () => void }) {
  const { t } = useTranslation();
  const { gameState, farmer, startNextSeason } = useGameStore();

  if (!gameState || !farmer) return null;

  const totalMoves = gameState.decisions.length || 1;
  const goodMoves = gameState.decisions.filter(d => 
    d.type === 'enwr' || d.type === 'insurance' || d.type === 'repay_loan' || d.type === 'repay_all_kcc'
  ).length;
  const score = Math.round((goodMoves / totalMoves) * 100);

  const riskEvents = gameState.resolvedEvents;
  const totalLoss = riskEvents.reduce((sum, e) => sum + (e.cashImpact < 0 ? Math.abs(e.cashImpact) : 0), 0);
  const insurancePayout = gameState.pmfbyClaimAmount > 0 ? gameState.pmfbyClaimAmount : 0;

  const rating = score >= 80 ? { emoji: '🏆', label: 'Excellent', color: 'text-amber-500', fill: '#f59e0b' }
    : score >= 60 ? { emoji: '⭐', label: 'Good', color: 'text-emerald-500', fill: '#10b981' }
    : score >= 40 ? { emoji: '👍', label: 'Average', color: 'text-blue-500', fill: '#3b82f6' }
    : score >= 20 ? { emoji: '⚠️', label: 'Poor', color: 'text-orange-500', fill: '#f97316' }
    : { emoji: '🆘', label: 'Critical', color: 'text-red-500', fill: '#ef4444' };

  const stats = [
    { label: 'Cash in Hand', value: fmt(gameState.cashInHand), color: 'text-emerald-600', icon: '💰', bg: 'bg-emerald-50' },
    { label: 'Total Debt', value: fmt(gameState.totalDebt), color: gameState.totalDebt > 0 ? 'text-red-500' : 'text-slate-400', icon: '📋', bg: 'bg-slate-50' },
    { label: 'Risk Events', value: `${riskEvents.length}`, color: riskEvents.length > 2 ? 'text-red-500' : 'text-amber-500', icon: '⚡', bg: 'bg-slate-50' },
    { label: 'Gross Revenue', value: fmt(gameState.grossRevenue), color: gameState.grossRevenue > 0 ? 'text-emerald-500' : 'text-slate-400', icon: '📈', bg: 'bg-blue-50' },
  ];

  const lessons = useMemo(() => {
    const l: string[] = [];
    if (gameState.debtBreakdown.some(d => d.lender === 'moneylender')) l.push('🦈 Moneylender debt is draining cash. Switch to KCC!');
    if (!gameState.pmfbyEnrolled && totalLoss > 5000) l.push('💡 Consider PMFBY next season — it would have saved your harvest.');
    if (gameState.eNWRActive || gameState.decisions.some(d => d.action === 'enwr')) l.push('🏛️ Great move exploring Godown storage! Avoid distress selling.');
    if (gameState.stressLevel > 60) l.push('🧠 High stress! Diversify income and insure your crops next season.');
    if (l.length === 0) l.push('📈 Keep making smart financial decisions! Samriddhi score increasing.');
    return l;
  }, [gameState, totalLoss]);

  const handleNextSeason = () => {
    startNextSeason();
    onContinue();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-amber-100 blur-3xl rounded-full opacity-60 mix-blend-multiply flex-none translate-x-10 -translate-y-10"></div>
      
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md space-y-5 relative z-10 pt-8 pb-20">

        {/* Header */}
        <div className="text-center mb-6">
          <motion.div className="text-[80px] mb-4 drop-shadow-xl"
            animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }} transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 3 }}>
            {rating.emoji}
          </motion.div>
          <h2 className={`font-display text-4xl mb-1 ${rating.color}`}>{rating.label}</h2>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
            Season {gameState.seasonNumber} Complete
          </p>
        </div>

        {/* Score Ring */}
        <div className="flex justify-center mb-6">
          <div className="relative w-36 h-36">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100" aria-hidden="true">
              <circle cx="50" cy="50" r="42" strokeWidth="8" stroke="#f1f5f9" fill="white" className="drop-shadow-sm" />
              <circle cx="50" cy="50" r="42" strokeWidth="8"
                stroke={rating.fill}
                strokeLinecap="round"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 42}`}
                strokeDashoffset={`${2 * Math.PI * 42 * (1 - score / 100)}`}
                style={{ transition: 'stroke-dashoffset 1.5s ease-out' }} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`font-number text-4xl font-black ${rating.color}`}>{score}</span>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mt-1">SAMRIDDHI</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          {stats.map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }} className={`p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center ${s.bg}`}>
              <span className="text-lg mb-1">{s.icon}</span>
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-0.5">{s.label}</span>
              <span className={`font-number text-xl font-black ${s.color}`}>{s.value}</span>
            </motion.div>
          ))}
        </div>

        {/* Lessons */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 mt-6">
          <h3 className="text-xs font-bold uppercase tracking-widest mb-4 text-slate-800 flex items-center gap-2 justify-center">
            <span>💡</span> Key Learnings
          </h3>
          <ul className="space-y-3">
            {lessons.map((l, i) => (
              <motion.li key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 + i * 0.1 }}
                className="text-xs font-bold text-slate-600 flex items-start gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-amber-500 font-bold mt-0.5">▸</span>
                <span className="flex-1 leading-relaxed">{l}</span>
              </motion.li>
            ))}
          </ul>
        </div>

        <button onClick={handleNextSeason} className="btn-primary flex justify-center items-center gap-2 text-xl w-full bg-slate-800 text-white hover:bg-slate-900 shadow-slate-900/20 py-4 mt-6 rounded-2xl uppercase font-black tracking-widest">
          🚜 Start Season {gameState.seasonNumber + 1}
        </button>
      </motion.div>
    </div>
  );
}
