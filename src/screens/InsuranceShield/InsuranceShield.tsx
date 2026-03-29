import { useTranslation } from 'react-i18next';
import { useGameStore } from '../../store/gameStore';

function fmt(n: number) { return '₹' + n.toLocaleString('en-IN'); }

export default function InsuranceShield({ onBack }: { onBack: () => void }) {
  const { t, i18n } = useTranslation();
  const { gameState, farmer, enrollPMFBY, fileInsuranceClaim, collectInsuranceClaim } = useGameStore();
  const isHi = i18n.language === 'hi';

  if (!gameState || !farmer) return null;

  const claimAmtStr = fmt(gameState.pmfbyClaimAmount);

  const pending = gameState.pmfbyClaimStatus === 'pending';
  const claimable = gameState.pmfbyClaimStatus === 'received';
  const enrolled = gameState.pmfbyEnrolled;
  const cutoffPassed = gameState.pmfbyCutoffPassed;

  const ha = farmer.landHoldingHectares;
  const maxCover = Math.round(ha * 40000);
  const premium = Math.round(maxCover * 0.02);

  const handleEnroll = () => {
    enrollPMFBY(premium);
    onBack();
  };

  return (
    <div className="pb-8 pt-6 min-h-screen relative bg-slate-50">
      
      <div className="px-5 mb-6">
         <button onClick={onBack} className="text-sm font-bold text-slate-400 mb-4 hover:text-slate-600 flex items-center gap-1">← {isHi ? 'वापस / Back' : 'Back'}</button>
        <h1 className="font-display text-4xl text-slate-800">PMFBY Insurance</h1>
        <div className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mt-1">Pradhan Mantri Fasal Bima Yojana</div>
      </div>

      <div className="p-4 space-y-4">
        
        {/* ─── STATUS CARD ─── */}
        <div className={`rounded-3xl p-6 border shadow-sm flex flex-col items-center text-center justify-center relative overflow-hidden ${enrolled ? 'bg-blue-600 border-blue-700' : 'bg-white border-slate-200'}`}>
          {!enrolled && cutoffPassed && <div className="absolute inset-0 bg-slate-100 opacity-80 z-10"></div>}
          
          {enrolled ? (
            <>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white blur-3xl rounded-full opacity-20 relative z-0"></div>
              <div className="text-6xl mb-3 relative z-10">🛡️</div>
              <h2 className="font-display text-2xl text-white mb-1 relative z-10">{isHi ? 'सुरक्षित' : 'Protected'}</h2>
              <p className="text-blue-100 text-xs font-bold uppercase tracking-widest relative z-10">{isHi ? `${fmt(maxCover)} तक का कवर सक्रिय` : `Up to ${fmt(maxCover)} coverage active`}</p>
            </>
          ) : (
            <>
               <div className="text-6xl mb-3 relative z-10 grayscale opacity-60">🛡️</div>
              <h2 className="font-display text-2xl text-slate-800 mb-1 relative z-10">{isHi ? 'सुरक्षित नहीं' : 'Not Protected'}</h2>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest relative z-10">{isHi ? 'आपकी फसल जोखिम में है' : 'Crops are vulnerable to disasters'}</p>
            </>
          )}

          {cutoffPassed && !enrolled && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center pointer-events-none">
               <span className="bg-red-500 text-white font-black text-xl px-4 py-2 rotate-12 rounded shadow-lg opacity-80 border-2 border-red-600 uppercase tracking-widest">
                {isHi ? 'समय सीमा समाप्त' : 'Cutoff Passed'}
              </span>
            </div>
          )}
        </div>

        {/* ─── ACTION SECTION ─── */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200">
           
           {!enrolled && !cutoffPassed && (
             <>
                <h3 className="text-xs font-bold uppercase tracking-widest mb-4 text-slate-500 text-center flex items-center gap-2 justify-center">
                  <span>📝</span> {isHi ? 'PMFBY में नामांकन' : 'Enroll in PMFBY'}
                </h3>
               <div className="bg-blue-50 p-4 border border-blue-100 rounded-xl mb-4">
                 <div className="flex justify-between items-center mb-2">
                   <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Premium (2%)</span>
                   <span className="font-number text-2xl font-black text-blue-600">{fmt(premium)}</span>
                 </div>
                 <div className="flex justify-between items-center">
                   <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Max Cover</span>
                   <span className="font-number text-lg font-black text-slate-800">{fmt(maxCover)}</span>
                 </div>
               </div>
                <button onClick={handleEnroll} disabled={gameState.cashInHand < premium}
                  className="w-full btn-primary bg-blue-600 text-white font-bold py-4 rounded-xl shadow-md transition-all disabled:opacity-50">
                   {isHi ? `भुगतान करें और जुड़ें ${fmt(premium)}` : `Pay ${fmt(premium)} and Enroll`}
                </button>
               {gameState.cashInHand < premium && <div className="text-[10px] text-red-500 font-bold mt-2 text-center uppercase tracking-widest">Not enough cash</div>}
             </>
           )}

           {enrolled && gameState.pmfbyClaimStatus === 'none' && (
              <>
                 <h3 className="text-xs font-bold uppercase tracking-widest mb-4 text-slate-500 text-center flex items-center gap-2 justify-center">
                  <span>📱</span> {isHi ? 'दावा पेश करें' : 'File a Claim'}
                </h3>
                <p className="text-sm font-medium text-slate-600 text-center mb-4">{isHi ? 'क्या आपकी फसल को भारी मौसम से नुकसान हुआ? 72 घंटे के भीतर दावा करें।' : 'Did your crop suffer extreme weather damage? File a claim within 72 hours via crop cutting experiment (CCE).'}</p>
                <button onClick={fileInsuranceClaim}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-4 rounded-xl shadow-sm transition-all border border-slate-200 uppercase tracking-widest text-xs">
                   {isHi ? 'दावा करें' : 'File Claim'}
                </button>
             </>
           )}

           {pending && (
             <div className="text-center bg-amber-50 border border-amber-200 p-4 rounded-xl">
                <div className="text-4xl mb-2 animate-bounce">⏳</div>
                <h3 className="font-bold text-amber-800 text-sm">{isHi ? 'दावा प्रक्रिया में है' : 'Claim Processing'}</h3>
                <p className="text-amber-600/80 text-xs mt-1">{isHi ? `CCE सर्वेक्षण की जांच की जा रही है। इसमें ${gameState.claimProcessingWeeksRemaining} हफ्ते और लगेंगे।` : `CCE survey is being processed. It will take ${gameState.claimProcessingWeeksRemaining} more weeks.`}</p>
              </div>
           )}

           {claimable && (
             <div className="text-center bg-emerald-50 border border-emerald-200 p-4 rounded-xl">
                <div className="text-4xl mb-2">💰</div>
                <h3 className="font-bold text-emerald-800 text-sm mb-1">{isHi ? 'दावा स्वीकृत!' : 'Claim Approved!'}</h3>
                <div className="font-number font-black text-3xl text-emerald-600 mb-3">{claimAmtStr}</div>
                <button onClick={collectInsuranceClaim}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl shadow-sm transition-all uppercase tracking-widest text-xs">
                   {isHi ? 'नकद प्राप्त करें' : 'Collect Cash'}
                </button>
             </div>
           )}

        </div>

        {/* ─── INFO SECTION ─── */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
           <div className="font-bold text-sm mb-3 flex items-center gap-2 uppercase tracking-wide text-slate-700">
             ℹ️ {isHi ? 'PMFBY में क्या शामिल है?' : 'What does PMFBY cover?'}
           </div>
           <ul className="space-y-2.5 text-xs text-slate-600 font-medium">
             <li className="flex items-start gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
               <span className="text-blue-500 mt-0.5">▸</span><span>{isHi ? 'सूखा और बारिश की कमी' : 'Droughts, dry spells, and insufficient rain'}</span>
             </li>
             <li className="flex items-start gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
               <span className="text-blue-500 mt-0.5">▸</span><span>{isHi ? 'बाढ़ और भूस्खलन' : 'Floods, inundation, and landslides'}</span>
             </li>
             <li className="flex items-start gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
               <span className="text-blue-500 mt-0.5">▸</span><span>{isHi ? 'कीटों का हमला और फसल रोग' : 'Mass pest attacks and severe crop diseases'}</span>
             </li>
           </ul>
        </div>

      </div>
    </div>
  );
}
