import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

interface Scenario {
  id: number;
  arhatiyaDialogue: string;
  options: {
    id: string;
    text: string;
    outcome: 'bad' | 'ok' | 'good' | 'best';
    feedback: string;
    priceChange: number;
  }[];
}

const SCENARIOS: Scenario[] = [
  {
    id: 1,
    arhatiyaDialogue: '₹1,800/क्विंटल दूँगा।',
    options: [
      { id: 'a', text: 'ठीक है, मान लेता हूँ', outcome: 'bad', feedback: 'MSP से ₹475 कम मिला। यह आपका हक था।', priceChange: 0 },
      { id: 'b', text: 'MSP ₹2,275 है — वह दो', outcome: 'ok', feedback: 'अच्छा! MSP माँगने से भाव बढ़ा।', priceChange: 300 },
      { id: 'c', text: 'मेरे पास गोदाम का option है', outcome: 'best', feedback: 'बहुत अच्छा! गोदाम दिखाने से सबसे ज़्यादा फायदा।', priceChange: 400 },
      { id: 'd', text: 'दूसरी मंडी जाऊँगा', outcome: 'ok', feedback: 'जोखिम है — कभी काम करता है, कभी नहीं।', priceChange: 100 },
    ],
  },
  {
    id: 2,
    arhatiyaDialogue: 'आपका ₹15,000 उधार है मेरे पास। उसे काटकर बाकी दूँगा।',
    options: [
      { id: 'a', text: 'ठीक है, काट लो', outcome: 'bad', feedback: 'उधार और अनाज की कीमत मिल गई — बहुत नुकसान!', priceChange: -200 },
      { id: 'b', text: 'पहले भाव तय होगा, फिर उधार की बात', outcome: 'ok', feedback: 'सही! दोनों मुद्दे अलग हैं।', priceChange: 0 },
      { id: 'c', text: 'KCC से उधार चुकाऊँगा, अनाज का पूरा पैसा चाहिए', outcome: 'best', feedback: 'शानदार! KCC से चुकाना सबसे बेहतर है।', priceChange: 150 },
      { id: 'd', text: 'MSP से कम नहीं लूँगा', outcome: 'ok', feedback: 'अच्छा स्टैंड लिया।', priceChange: 100 },
    ],
  },
  {
    id: 3,
    arhatiyaDialogue: 'नमी ज़्यादा है — ₹100 काटूँगा।',
    options: [
      { id: 'a', text: 'ठीक है', outcome: 'bad', feedback: 'बिना जाँच के मान लिया — गलत!', priceChange: -100 },
      { id: 'b', text: 'जाँच करवाओ — मेरा अनाज सही है', outcome: 'ok', feedback: 'सही! Objective testing माँगो।', priceChange: 0 },
      { id: 'c', text: 'Soil Health Lab certificate दिखाऊँगा', outcome: 'good', feedback: 'बहुत अच्छा! Documentation ताकत है।', priceChange: 50 },
      { id: 'd', text: 'तो मैं WDRA जाऊँगा — वो जाँच करेंगे', outcome: 'best', feedback: 'शानदार! eNWR leverage बहुत काम आता है।', priceChange: 100 },
    ],
  },
];

export const NegotiationTrainer: React.FC<{ onComplete: () => void; gameState?: any }> = ({ onComplete }) => {
  const { t } = useTranslation();
  const [currentScenario, setCurrentScenario] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [scores, setScores] = useState<Array<'bad' | 'ok' | 'good' | 'best'>>([]);
  
  const scenario = SCENARIOS[currentScenario];
  const option = scenario.options.find((o: any) => o.id === selectedOption);

  const selectOption = (id: string) => {
    setSelectedOption(id);
    setShowFeedback(true);
    if (option) {
      setScores([...scores, option.outcome]);
    }
  };

  const nextScenario = () => {
    if (currentScenario < SCENARIOS.length - 1) {
      setCurrentScenario(currentScenario + 1);
      setSelectedOption(null);
      setShowFeedback(false);
    } else {
      onComplete();
    }
  };

  const scoreCount = scores.reduce((acc, s) => {
    if (s === 'best' || s === 'good') acc.good++;
    else if (s === 'ok') acc.ok++;
    else acc.bad++;
    return acc;
  }, { good: 0, ok: 0, bad: 0 });

  return (
    <div className="min-h-screen bg-amber-50 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Progress */}
        <div className="flex gap-2 mb-6">
          {SCENARIOS.map((_, i) => (
            <div
              key={i}
              className={`flex-1 h-2 rounded-full ${
                i < currentScenario ? 'bg-field-500' : i === currentScenario ? 'bg-amber-400' : 'bg-soil-200'
              }`}
            />
          ))}
        </div>

        {/* Score */}
        <div className="bg-white rounded-xl p-3 mb-4 flex justify-between text-sm shadow-sm">
          <span className="text-green-600">🌟 {scoreCount.good}</span>
          <span className="text-amber-600">⭐ {scoreCount.ok}</span>
          <span className="text-red-600">⚠️ {scoreCount.bad}</span>
        </div>

        {/* Arhatiya Dialogue */}
        <div className="bg-amber-100 rounded-2xl p-6 mb-6 border-2 border-amber-300">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-amber-200 rounded-full flex items-center justify-center text-3xl">
              👨‍💼
            </div>
            <div>
              <p className="text-sm text-amber-800 mb-1">{t('negotiationTrainer.arhatiya', 'आढ़तिया कहता है')}</p>
              <p className="text-xl text-amber-900 font-bold">"{scenario.arhatiyaDialogue}"</p>
            </div>
          </div>
        </div>

        {/* Options */}
        {!showFeedback ? (
          <div className="space-y-3">
            {scenario.options.map((opt) => (
              <button
                key={opt.id}
                onClick={() => selectOption(opt.id)}
                className="w-full p-4 bg-white rounded-xl border-2 border-gray-200 text-left hover:border-green-400 hover:bg-green-50 transition-all shadow-sm"
              >
                {opt.text}
              </button>
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-6 rounded-2xl mb-4 ${
              option?.outcome === 'best' ? 'bg-green-100 border-2 border-green-400' :
              option?.outcome === 'good' ? 'bg-green-50 border-2 border-green-300' :
              option?.outcome === 'ok' ? 'bg-amber-100 border-2 border-amber-300' :
              'bg-red-100 border-2 border-red-300'
            }`}
          >
            <p className={`font-semibold mb-2 ${
              option?.outcome === 'best' || option?.outcome === 'good' ? 'text-green-700' :
              option?.outcome === 'ok' ? 'text-amber-700' : 'text-red-700'
            }`}>
              {option?.outcome === 'best' && '🎉 '}
              {option?.outcome === 'good' && '✅ '}
              {option?.outcome === 'ok' && '⭐ '}
              {option?.outcome === 'bad' && '❌ '}
              {option?.feedback}
            </p>
            {option && (
              <p className="text-sm text-gray-600">
                {t('negotiationTrainer.priceChange', 'भाव बदलाव')}: 
                <span className={option.priceChange > 0 ? 'text-green-600' : 'text-red-600'}>
                  {option.priceChange > 0 ? '+' : ''}{option.priceChange}/क्विंटल
                </span>
              </p>
            )}
            <button
              onClick={nextScenario}
              className="mt-4 w-full py-3 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600"
            >
              {currentScenario < SCENARIOS.length - 1 ? t('common.next', 'आगे') : t('common.finish', 'खत्म')} →
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default NegotiationTrainer;
