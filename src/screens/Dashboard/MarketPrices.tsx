import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '../../store/gameStore';
import { CROP_BASE_DATA } from '../../data/crops';

export default function MarketPrices({ onBack }: { onBack: () => void }) {
  const { t, i18n } = useTranslation();
  const { gameState, farmer } = useGameStore();
  const isHi = i18n.language === 'hi';
  const [showMSPInfo, setShowMSPInfo] = useState(false);
  const [alertValue, setAlertValue] = useState<string>('');
  const [alertSet, setAlertSet] = useState(false);
  
  if (!gameState || !farmer) return null;
  
  const crop = CROP_BASE_DATA[farmer.primaryCrop];
  const isStressed = gameState.stressLevel >= 75;

  const handleSetAlert = () => {
    if (alertValue && !isNaN(Number(alertValue))) {
      setAlertSet(true);
      setTimeout(() => setAlertSet(false), 3000);
      setAlertValue('');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-8 rounded-t-3xl border-t border-slate-200 mt-2">
      <div className="sticky top-0 bg-white/90 backdrop-blur z-10 px-5 py-4 flex items-center gap-3 border-b border-slate-100 shadow-sm">
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 transition-colors">←</button>
        <h2 className="font-display text-2xl text-slate-800">{isHi ? 'मंडी भाव' : 'Market Prices'}</h2>
      </div>

      <div className="p-5">
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 mb-6 flex flex-col items-center">
           <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1">{isHi ? 'आज का भाव' : "Today's Price"}</span>
           <span className="text-4xl font-black text-emerald-600 font-number mb-2">₹{gameState.currentMarketPrice}<span className="text-lg text-emerald-600/60">/q</span></span>
           <span className="text-xs font-bold px-3 py-1 bg-blue-50 text-blue-600 rounded-full">MSP: ₹{gameState.mspPrice}/q</span>
        </div>

        <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-3 px-1">{isHi ? 'मूल्य अनुमान' : 'Price Projection'}</h3>
        
        {isStressed ? (
          <div className="p-8 bg-red-50 border border-red-100 rounded-3xl text-center shadow-inner relative overflow-hidden">
             <div className="absolute inset-0 backdrop-blur-md bg-white/40"></div>
              <div className="relative z-10">
                <div className="text-5xl mb-3 grayscale opacity-40">📈</div>
                <h4 className="font-bold text-red-800 mb-1">{isHi ? 'साफ सोचने में असमर्थ' : 'Cannot Think Clearly'}</h4>
                <p className="text-xs text-red-600/80 leading-relaxed max-w-[200px] mx-auto">{isHi ? 'आपका तनाव स्तर बाज़ार की भविष्यवाणी का विश्लेषण करने के लिए बहुत अधिक है।' : 'Your stress level is too high to analyze market predictions.'}</p>
              </div>
          </div>
        ) : (
          <div className="p-5 bg-white border border-slate-100 shadow-sm rounded-3xl">
            <div className="flex justify-between items-end mb-4">
              <span className="text-xs font-bold text-slate-500">{isHi ? 'अनुमानित रुझान (12 हफ़्ते)' : 'Predicted trend (12 wks)'}</span>
            </div>
            
            <div className="h-40 flex items-end gap-1 mb-2">
              {gameState.priceProjection.slice(0, 12).map((price, i) => {
                const max = Math.max(...gameState.priceProjection);
                const height = (price / max) * 100;
                const isCurrent = i === 0;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center group relative">
                     <div className="absolute -top-8 bg-slate-800 text-white text-[9px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 z-10 transition-opacity whitespace-nowrap">₹{price}</div>
                     <motion.div 
                       initial={{ height: 0 }}
                       animate={{ height: `${height}%` }}
                       className={`w-full rounded-t-sm ${isCurrent ? 'bg-emerald-400' : 'bg-blue-200 group-hover:bg-blue-300'} transition-colors`} 
                     />
                  </div>
                )
              })}
            </div>
            <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-2">
               <span>{isHi ? 'अभी' : 'Now'}</span>
               <span>{isHi ? '+12 हफ़्ते' : '+12 wks'}</span>
            </div>
          </div>
        )}

        <div className="mt-6 flex flex-col gap-3">
           {/* MSP Info Toggle */}
            <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
              <button onClick={() => setShowMSPInfo(!showMSPInfo)} className="w-full bg-slate-50 hover:bg-slate-100 transition-colors p-4 flex items-center justify-between">
                 <span className="font-bold text-slate-600 text-sm flex items-center gap-2">📍 {isHi ? 'MSP क्या है?' : 'What is MSP?'}</span>
                 <span className="text-slate-400">{showMSPInfo ? '▲' : '▼'}</span>
              </button>
              <AnimatePresence>
                {showMSPInfo && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="p-4 text-xs text-slate-500 leading-relaxed bg-white">
                    <p className="mb-2"><strong>{isHi ? 'न्यूनतम समर्थन मूल्य (MSP)' : 'Minimum Support Price (MSP)'}</strong> {isHi ? 'आपकी फसल के लिए भारत सरकार द्वारा दी जाने वाली गारंटीकृत कीमत है।' : 'is the guaranteed price offered by the Government of India for your crop.'}</p>
                    <p>{isHi ? 'यदि मंडी की कीमतें इस सीमा से नीचे गिरती हैं, तो आपके पास अपनी आय सुरक्षित करने के लिए खरीद केंद्रों पर अपनी फसल बेचने का अधिकार है!' : 'If the Mandi prices fall below this limit, you hold the right to sell your harvest at procurement centers to secure your income!'}</p>
                  </motion.div>
                )}
              </AnimatePresence>
           </div>

           {/* Price Alert */}
            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-4">
              <div className="font-bold text-slate-600 text-sm flex items-center gap-2 mb-3">🔔 {isHi ? 'मूल्य अलर्ट सेट करें' : 'Set Price Alert'}</div>
              {!alertSet ? (
                <div className="flex gap-2">
                  <input type="number" value={alertValue} onChange={(e) => setAlertValue(e.target.value)} placeholder={isHi ? `₹${gameState.currentMarketPrice} से ऊपर का लक्ष्य` : `Target over ₹${gameState.currentMarketPrice}`} className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-brand" />
                  <button onClick={handleSetAlert} className="bg-amber-100 text-amber-800 px-4 rounded-xl font-bold text-sm border border-amber-200">{isHi ? 'सेट करें' : 'Set'}</button>
                </div>
              ) : (
                <div className="text-emerald-600 text-xs font-bold flex items-center gap-1 bg-emerald-50 px-3 py-2 rounded-lg">✅ {isHi ? 'अलर्ट सेट! लक्ष्य पूरा होने पर हम आपको सूचित करेंगे।' : 'Alert Armed! We will notify you when price targets are hit.'}</div>
              )}
            </div>
        </div>
      </div>
    </div>
  );
}
