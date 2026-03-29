import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';

interface SeasonCard {
  id: number;
  type: 'good' | 'average' | 'bad';
  revealed: boolean;
}

type RiskScenario = {
  id: string;
  years: number;
  badYears: number;
  averageYears: number;
  goodYears: number;
  premiumPerSeason: number;
  payoutPerBadSeason: number;
  lossPerBadSeason: number;
};

export const WeatherRisk: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<'intro' | 'guess' | 'reveal' | 'calculate' | 'insurance' | 'complete'>('intro');
  const [guess, setGuess] = useState('');
  const [actualBad, setActualBad] = useState(0);
  const [scenario, setScenario] = useState<RiskScenario>(() => pickScenario());
  const [cards, setCards] = useState<SeasonCard[]>(() => generateCards(pickScenario()));
  const [insuranceAnswer, setInsuranceAnswer] = useState<boolean | null>(null);

  function pickScenario(): RiskScenario {
    const scenarios: RiskScenario[] = [
      { id: 'normal', years: 12, badYears: 3, averageYears: 5, goodYears: 4, premiumPerSeason: 1000, payoutPerBadSeason: 25000, lossPerBadSeason: 50000 },
      { id: 'risky', years: 12, badYears: 4, averageYears: 4, goodYears: 4, premiumPerSeason: 1000, payoutPerBadSeason: 25000, lossPerBadSeason: 50000 },
      { id: 'safer', years: 12, badYears: 2, averageYears: 6, goodYears: 4, premiumPerSeason: 1000, payoutPerBadSeason: 25000, lossPerBadSeason: 50000 },
    ];
    return scenarios[Math.floor(Math.random() * scenarios.length)];
  }

  function generateCards(s: RiskScenario): SeasonCard[] {
    const types: Array<'good' | 'average' | 'bad'> = [
      ...Array.from({ length: s.goodYears }, () => 'good' as const),
      ...Array.from({ length: s.averageYears }, () => 'average' as const),
      ...Array.from({ length: s.badYears }, () => 'bad' as const),
    ];
    // Shuffle
    for (let i = types.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [types[i], types[j]] = [types[j], types[i]];
    }
    return types.map((type, i) => ({ id: i, type, revealed: false }));
  }

  const revealCards = () => {
    let badCount = 0;
    const revealed = cards.map((card, i) => {
      setTimeout(() => {
        setCards(prev => prev.map((c, idx) => idx === i ? { ...c, revealed: true } : c));
      }, i * 300);
      if (card.type === 'bad') badCount++;
      return card;
    });
    setActualBad(badCount);
    setTimeout(() => setPhase('calculate'), cards.length * 300 + 500);
  };

  const checkGuess = () => {
    revealCards();
    setPhase('reveal');
  };

  const totalPremium = scenario.premiumPerSeason * scenario.years;
  const totalPayout = actualBad * scenario.payoutPerBadSeason;
  const totalLossWithoutInsurance = actualBad * scenario.lossPerBadSeason;
  const netInsurance = totalPayout - totalPremium;

  return (
    <div className="min-h-screen bg-amber-50 p-4">
      <div className="max-w-2xl mx-auto">
        {phase === 'intro' && (
          <div className="bg-white rounded-2xl p-8 text-center">
            <h1 className="text-2xl text-gray-900 mb-4 font-bold">
              {t('weatherRisk.title')}
            </h1>
            <p className="text-gray-600 mb-6">
              {t('weatherRisk.subtitle')}
            </p>
            <div className="mb-6 p-4 bg-amber-50 rounded-xl border border-amber-200 text-left">
              <p className="text-sm text-amber-900 font-semibold mb-1">{t('weatherRisk.scenarioTitle')}</p>
              <p className="text-sm text-amber-800">
                {t('weatherRisk.scenarioDesc', {
                  years: scenario.years,
                  premium: scenario.premiumPerSeason,
                  payout: scenario.payoutPerBadSeason,
                  loss: scenario.lossPerBadSeason
                })}
              </p>
            </div>
            <button
              onClick={() => setPhase('guess')}
              className="w-full py-4 bg-green-500 text-white rounded-xl font-semibold"
            >
              {t('common.start')} →
            </button>
          </div>
        )}

        {phase === 'guess' && (
          <div className="bg-white rounded-2xl p-6">
            <h2 className="text-xl text-gray-900 mb-4 text-center font-bold">
              {t('weatherRisk.guessTitle')}
            </h2>
            <p className="text-gray-600 mb-6 text-center">
              {t('weatherRisk.guessQuestion', { years: scenario.years })}
            </p>
            <input
              type="number"
              min="0"
              max={scenario.years}
              value={guess}
              onChange={(e) => setGuess(e.target.value)}
              className="w-full p-4 border-2 border-gray-200 rounded-xl text-2xl text-center mb-4"
              placeholder={t('weatherRisk.guessPlaceholder', { years: scenario.years })}
            />
            <button
              onClick={checkGuess}
              disabled={!guess}
              className="w-full py-4 bg-green-500 text-white rounded-xl font-semibold disabled:bg-gray-300"
            >
              {t('weatherRisk.myGuess')}
            </button>
          </div>
        )}

        {(phase === 'reveal' || phase === 'calculate') && (
          <>
            <div className="grid grid-cols-3 gap-3 mb-6">
              {cards.map((card, i) => (
                <motion.div
                  key={card.id}
                  initial={{ rotateY: 0 }}
                  animate={{ rotateY: card.revealed ? 180 : 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={`aspect-square rounded-xl flex items-center justify-center text-3xl
                    ${!card.revealed ? 'bg-gray-200' :
                      card.type === 'good' ? 'bg-green-100' :
                      card.type === 'average' ? 'bg-amber-100' : 'bg-red-100'}`}
                >
                  <span style={{ transform: card.revealed ? 'rotateY(180deg)' : 'none' }}>
                    {!card.revealed ? '⬜' :
                      card.type === 'good' ? '🌾' :
                      card.type === 'average' ? '🌤️' : '⛈️'}
                  </span>
                </motion.div>
              ))}
            </div>

            {phase === 'calculate' && (
              <div className="bg-white rounded-2xl p-6 space-y-4">
                <p className="text-gray-700 text-center">
                  {t('weatherRisk.actualBad', { count: actualBad, years: scenario.years })}
                </p>
                
                <div className="bg-amber-50 rounded-xl p-4">
                  <p className="text-amber-800 mb-2">
                    {t('weatherRisk.withoutInsurance')}: ₹{totalLossWithoutInsurance.toLocaleString()}
                  </p>
                </div>

                <button
                  onClick={() => setPhase('insurance')}
                  className="w-full py-4 bg-green-500 text-white rounded-xl font-semibold"
                >
                  {t('weatherRisk.seeInsurance')} →
                </button>
              </div>
            )}
          </>
        )}

        {phase === 'insurance' && (
          <div className="bg-white rounded-2xl p-6">
            <h3 className="text-lg text-gray-900 mb-4 font-bold">
              {t('weatherRisk.insuranceMath')}
            </h3>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-medium text-gray-700">{t('weatherRisk.premium')}</span>
                <span className="font-bold text-red-700">-₹{totalPremium.toLocaleString()}</span>
              </div>
              <div className="flex justify-between p-3 bg-green-50 rounded-lg">
                <span className="font-medium text-gray-700">{t('weatherRisk.payout')}</span>
                <span className="font-bold text-green-700">+₹{totalPayout.toLocaleString()}</span>
              </div>
              <div className="flex justify-between p-3 bg-amber-50 rounded-lg border-t-2 border-amber-200">
                <span className="font-semibold text-amber-900">{t('weatherRisk.net')}</span>
                <span className={`font-bold text-xl ${netInsurance >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                  {netInsurance >= 0 ? '+' : ''}₹{netInsurance.toLocaleString()}
                </span>
              </div>
            </div>

            <p className="text-gray-600 mb-4 text-center">
              {t('weatherRisk.insuranceQuestion')}
            </p>

            <div className="flex gap-3 mb-4">
              <button
                onClick={() => setInsuranceAnswer(true)}
                className={`flex-1 py-3 rounded-xl font-semibold ${
                  insuranceAnswer === true ? 'bg-green-500 text-white' : 'bg-green-100 text-green-700'
                }`}
              >
                ✅ {t('common.yes')}
              </button>
              <button
                onClick={() => setInsuranceAnswer(false)}
                className={`flex-1 py-3 rounded-xl font-semibold ${
                  insuranceAnswer === false ? 'bg-red-500 text-white' : 'bg-red-100 text-red-700'
                }`}
              >
                ❌ {t('common.no')}
              </button>
            </div>

            {insuranceAnswer !== null && (
              <div className={`p-4 rounded-xl ${actualBad >= 2 ? 'bg-green-50' : 'bg-amber-50'}`}>
                <p className="text-center">
                  {actualBad >= 2 
                    ? t('weatherRisk.insuranceGood', { savings: totalLossWithoutInsurance - totalPremium })
                    : t('weatherRisk.insuranceOk')
                  }
                </p>
                <button
                  onClick={() => setPhase('complete')}
                  className="mt-4 w-full py-3 bg-green-500 text-white rounded-xl font-semibold"
                >
                  {t('common.finish')} →
                </button>
              </div>
            )}
          </div>
        )}

        {phase === 'complete' && (
          <div className="bg-white rounded-2xl p-8 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="text-6xl mb-4"
            >
              🛡️
            </motion.div>
            <h2 className="text-2xl text-gray-900 mb-4 font-bold">
              {t('weatherRisk.complete')}
            </h2>
            <p className="text-gray-600 mb-6">
              {t('weatherRisk.completeDesc')}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  const next = pickScenario();
                  setScenario(next);
                  setCards(generateCards(next));
                  setPhase('intro');
                  setGuess('');
                  setInsuranceAnswer(null);
                }}
                className="flex-1 py-4 bg-gray-100 text-gray-700 rounded-xl font-semibold"
              >
                🔄 {t('common.playAgain')}
              </button>
              <button
                onClick={onComplete}
                className="flex-1 py-4 bg-green-500 text-white rounded-xl font-semibold"
              >
                🛡️ {t('weatherRisk.enroll')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WeatherRisk;
