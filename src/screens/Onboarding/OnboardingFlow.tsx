import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../store/gameStore';
import { getCropForState } from '../../data/crops';
import type { IndianState, Language, CropType, LenderType } from '../../types/game.types';
import type { FarmerProfile } from '../../types/game.types';

const STATES: { code: IndianState; emoji: string; name: string }[] = [
  { code: 'UP', emoji: '🏛️', name: 'Uttar Pradesh' }, { code: 'MH', emoji: '⛰️', name: 'Maharashtra' },
  { code: 'PB', emoji: '🌾', name: 'Punjab' }, { code: 'MP', emoji: '🌿', name: 'Madhya Pradesh' },
  { code: 'RJ', emoji: '🏜️', name: 'Rajasthan' }, { code: 'HR', emoji: '🌻', name: 'Haryana' },
  { code: 'KA', emoji: '🗿', name: 'Karnataka' }, { code: 'TN', emoji: '🌴', name: 'Tamil Nadu' },
  { code: 'GJ', emoji: '🦁', name: 'Gujarat' }, { code: 'WB', emoji: '🐯', name: 'West Bengal' },
  { code: 'BR', emoji: '🏔️', name: 'Bihar' }, { code: 'AP', emoji: '🌊', name: 'Andhra Pradesh' },
  { code: 'TS', emoji: '💎', name: 'Telangana' }, { code: 'OD', emoji: '🛕', name: 'Odisha' },
  { code: 'AS', emoji: '🦏', name: 'Assam' }, { code: 'KL', emoji: '🌴', name: 'Kerala' },
  { code: 'JH', emoji: '🌳', name: 'Jharkhand' }, { code: 'CG', emoji: '🌲', name: 'Chhattisgarh' },
  { code: 'HP', emoji: '🏔️', name: 'Himachal Pradesh' }, { code: 'UK', emoji: '🗻', name: 'Uttarakhand' },
  { code: 'JK', emoji: '❄️', name: 'Jammu & Kashmir' },
];

const LANGUAGES: { code: Language; native: string }[] = [
  { code: 'en', native: 'English' },
  { code: 'hi', native: 'हिन्दी' },
];

const CROP_EMOJI: Record<string, string> = {
  wheat: '🌾', paddy: '🌿', cotton: '☁️', mustard: '🌻', gram: '🫛',
  maize: '🌽', soybean: '🫘', onion: '🧅', tomato: '🍅', sugarcane: '🎋',
};

type Step = 'language' | 'state' | 'crop' | 'land' | 'name';

export default function OnboardingFlow({ onComplete }: { onComplete: () => void }) {
  const { t, i18n } = useTranslation();
  const { initGame } = useGameStore();
  const isHi = (i18n.language || '').startsWith('hi');
  
  const [step, setStep] = useState<Step>('language');
  const [lang, setLang] = useState<Language | null>(null);
  const [state, setState] = useState<IndianState | null>(null);
  const [crop, setCrop] = useState<CropType | null>(null);
  
  // Land Holding specifics matching PRD
  const [land, setLand] = useState<{ amount: number; type: 'marginal' | 'small' | 'medium'; cash: number; debt: number } | null>(null);
  const [name, setName] = useState('');

  const handleLanguageSelect = (l: Language) => {
    setLang(l);
    i18n.changeLanguage(l);
    setStep('state');
  };

  const handleStart = () => {
    if (!crop || !state || !lang || !land || name.trim().length < 2) return;
    
    const farmer: FarmerProfile = {
      id: Math.random().toString(36).slice(2), 
      name: name.trim(), 
      state, 
      district: '', 
      language: lang,
      landHoldingHectares: land.amount, 
      holdingType: land.type,
      primaryCrop: crop, 
      hasSmartphone: true
    };
    
    initGame(farmer, land.cash, land.debt, 'moneylender');
    onComplete();
  };

  const availableCrops = state ? getCropForState(state) : [];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-amber-50 relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-amber-200 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"></div>
      
      <AnimatePresence mode="wait">

        {step === 'language' && (
          <motion.div key="lang" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }} className="w-full max-w-md relative z-10">
            <h1 className="font-display text-5xl mb-3 text-center text-amber-600">{isHi ? 'अनाज अर्थ' : 'Anaj-Arth'}</h1>
            <p className="text-lg text-center text-slate-500 font-medium mb-10">Farmer's Financial Simulator</p>
            <div className="grid grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto pb-4" style={{ scrollbarWidth: 'none' }}>
              {LANGUAGES.map(l => (
                <button key={l.code} onClick={() => handleLanguageSelect(l.code)}
                  className="bg-white text-center py-5 cursor-pointer rounded-2xl shadow-sm border border-slate-100 hover:border-amber-400 hover:shadow-md transition-all">
                  <span className="font-display text-xl block text-slate-800">{l.native}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {step === 'state' && (
          <motion.div key="state" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="w-full max-w-md relative z-10">
            <button onClick={() => setStep('language')} className="text-sm font-bold text-slate-400 mb-6 hover:text-amber-500 flex items-center gap-1">← {isHi ? 'वापस / Back' : 'Back'}</button>
            <h2 className="font-display text-3xl mb-6 text-slate-800">{isHi ? 'राज्य चुनें / Select State' : 'Select State'}</h2>
            <div className="grid grid-cols-2 gap-2.5 max-h-[60vh] overflow-y-auto pb-4" style={{ scrollbarWidth: 'thin' }}>
              {STATES.map(s => (
                <button key={s.code} onClick={() => { setState(s.code); setStep('crop'); }}
                  className="p-4 rounded-xl text-left text-sm font-bold bg-white text-slate-600 border border-slate-100 hover:border-amber-400 hover:shadow-sm transition-all flex items-center gap-2">
                  <span className="text-xl">{s.emoji}</span> {t('states.' + s.code, { defaultValue: s.name })}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {step === 'crop' && (
          <motion.div key="crop" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="w-full max-w-md relative z-10">
            <button onClick={() => setStep('state')} className="text-sm font-bold text-slate-400 mb-6 hover:text-amber-500 flex items-center gap-1">← {isHi ? 'वापस / Back' : 'Back'}</button>
            <h2 className="font-display text-3xl mb-6 text-slate-800">{isHi ? 'मुख्य फसल / Primary Crop' : 'Primary Crop'}</h2>
            <div className="grid grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto pb-4">
              {availableCrops.map(c => (
                <button key={c.id} onClick={() => { setCrop(c.id as CropType); setStep('land'); }}
                  className="bg-white p-5 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all border border-slate-100 hover:border-amber-400 hover:shadow-md">
                  <span className="text-4xl">{CROP_EMOJI[c.id] ?? '🌱'}</span>
                  <span className="font-bold text-slate-600">{t('crops.' + c.id)}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {step === 'land' && (
          <motion.div key="land" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="w-full max-w-md relative z-10">
            <button onClick={() => setStep('crop')} className="text-sm font-bold text-slate-400 mb-6 hover:text-amber-500 flex items-center gap-1">← {isHi ? 'वापस / Back' : 'Back'}</button>
            <h2 className="font-display text-3xl mb-6 text-slate-800">{isHi ? 'ज़मीन / Land Holding' : 'Land Holding'}</h2>
            <div className="space-y-4">
              <button onClick={() => { setLand({ amount: 0.75, type: 'marginal', cash: 8000, debt: 35000 }); setStep('name'); }}
                className="w-full p-5 rounded-2xl border bg-white border-slate-100 hover:border-amber-400 hover:shadow-md text-left transition-all">
                <div className="font-display text-xl text-slate-800">{isHi ? '< 1 हेक्टेयर — सीमांत किसान' : '< 1 hectare — Marginal Farmer'}</div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Marginal Farmer (&lt; 2.5 Acres)</div>
              </button>
              
              <button onClick={() => { setLand({ amount: 1.5, type: 'small', cash: 15000, debt: 55000 }); setStep('name'); }}
                className="w-full p-5 rounded-2xl border bg-white border-slate-100 hover:border-emerald-400 hover:shadow-md text-left transition-all">
                <div className="font-display text-xl text-slate-800">{isHi ? '1–2 हेक्टेयर — लघु किसान' : '1-2 hectares — Small Farmer'}</div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Small Farmer (2.5 - 5 Acres)</div>
              </button>
              
              <button onClick={() => { setLand({ amount: 3.0, type: 'medium', cash: 30000, debt: 80000 }); setStep('name'); }}
                className="w-full p-5 rounded-2xl border bg-white border-slate-100 hover:border-blue-400 hover:shadow-md text-left transition-all">
                <div className="font-display text-xl text-slate-800">{isHi ? '2–5 हेक्टेयर — मध्यम किसान' : '2-5 hectares — Medium Farmer'}</div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Medium Farmer (5 - 12 Acres)</div>
              </button>
            </div>
          </motion.div>
        )}

        {step === 'name' && (
          <motion.div key="name" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="w-full max-w-md relative z-10">
            <button onClick={() => setStep('land')} className="text-sm font-bold text-slate-400 mb-6 hover:text-amber-500 flex items-center gap-1">← {isHi ? 'वापस / Back' : 'Back'}</button>
            <h2 className="font-display text-3xl mb-6 text-slate-800">{isHi ? 'आपका नाम / Your Name' : 'Your Name'}</h2>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Farmer Name"
              className="w-full p-5 rounded-2xl font-bold text-xl bg-white border shadow-sm border-slate-100 focus:border-amber-400 outline-none text-slate-700 transition-all mb-8" />
            
            <button onClick={handleStart} disabled={name.trim().length < 2} 
              className="btn-primary flex items-center justify-center gap-2 text-xl w-full bg-slate-800 text-white hover:bg-slate-900 shadow-slate-900/20 py-4 disabled:opacity-50">
              {isHi ? 'खेल शुरू करें / Start Game' : 'Start Game'}
            </button>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
