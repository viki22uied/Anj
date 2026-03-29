import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

interface GrainSample {
  id: number;
  moisture: number;
  foreignMatter: number;
  damaged: number;
  image: string;
}

type BinType = 'godown' | 'mandi' | 'reject';

const GRADING_STANDARDS = {
  moisture: { godown: 14, mandi: 18 },
  foreignMatter: { godown: 1, mandi: 3 },
  damaged: { godown: 3, mandi: 8 },
};

export const GradingGame: React.FC<{ onComplete: (grade: string) => void }> = ({ onComplete }) => {
  const { t } = useTranslation();
  const [samples, setSamples] = useState<GrainSample[]>(generateSamples());
  const [assignments, setAssignments] = useState<Record<number, BinType>>({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [currentCard, setCurrentCard] = useState(0);

  function generateSamples(): GrainSample[] {
    return Array.from({ length: 5 }, (_, i) => ({
      id: i,
      moisture: Math.round((10 + Math.random() * 12) * 10) / 10,
      foreignMatter: Math.round(Math.random() * 5 * 10) / 10,
      damaged: Math.round(Math.random() * 12 * 10) / 10,
      image: '🌾',
    }));
  }

  const assignToBin = (sampleId: number, bin: BinType) => {
    setAssignments({ ...assignments, [sampleId]: bin });
    if (currentCard < 4) {
      setCurrentCard(currentCard + 1);
    }
  };

  const getCorrectBin = (sample: GrainSample): BinType => {
    if (sample.moisture <= GRADING_STANDARDS.moisture.godown &&
        sample.foreignMatter <= GRADING_STANDARDS.foreignMatter.godown &&
        sample.damaged <= GRADING_STANDARDS.damaged.godown) {
      return 'godown';
    } else if (sample.moisture <= GRADING_STANDARDS.moisture.mandi &&
               sample.foreignMatter <= GRADING_STANDARDS.foreignMatter.mandi &&
               sample.damaged <= GRADING_STANDARDS.damaged.mandi) {
      return 'mandi';
    }
    return 'reject';
  };

  const submitGrading = () => {
    let correct = 0;
    samples.forEach(sample => {
      if (assignments[sample.id] === getCorrectBin(sample)) {
        correct++;
      }
    });
    setScore(correct);
    setShowResults(true);
  };

  const handleComplete = () => {
    const grade = score >= 4 ? 'FAQ' : score === 3 ? 'Grade-2' : 'Reject';
    onComplete(grade);
  };

  const retry = () => {
    if (attempts < 2) {
      setSamples(generateSamples());
      setAssignments({});
      setShowResults(false);
      setCurrentCard(0);
      setAttempts(attempts + 1);
    } else {
      onComplete('Reject');
    }
  };

  if (showResults) {
    return (
      <div className="min-h-screen bg-soil-50 p-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl text-amber-900 text-center mb-6 font-bold">
            {t('gradingGame.results')}
          </h1>

          <div className="space-y-3 mb-6">
            {samples.map((sample, idx) => {
              const correctBin = getCorrectBin(sample);
              const userBin = assignments[sample.id];
              const isCorrect = correctBin === userBin;

              return (
                <motion.div
                  key={sample.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className={`p-4 rounded-xl ${isCorrect ? 'bg-field-50 border-2 border-field-200' : 'bg-danger-50 border-2 border-danger-200'}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{t('gradingGame.sample')} {idx + 1}</p>
                      <p className="text-sm text-gray-600">
                        {t('gradingGame.moisture')}: {sample.moisture}% • 
                        {t('gradingGame.foreign')}: {sample.foreignMatter}% • 
                        {t('gradingGame.damaged')}: {sample.damaged}%
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                        {isCorrect ? '✅ ' : '❌ '}
                        {t(`gradingGame.${correctBin}Bin`)}
                      </p>
                    </div>
                  </div>
                    {!isCorrect && (
                    <p className="text-sm text-gray-600 mt-2">
                      {correctBin === 'godown' && 'Quality accepted for warehouse storage'}
                      {correctBin === 'mandi' && 'Not for warehouse - sell at mandi'}
                      {correctBin === 'reject' && 'Very poor quality - Rejected'}
                    </p>
                  )}
                </motion.div>
              );
            })}
          </div>

          <div className="bg-white rounded-2xl p-6 text-center">
            <p className="text-3xl text-gray-900 mb-2 font-bold">
              {score}/5
            </p>
            <p className="text-lg mb-4">
              {score >= 4 ? (
                <span className="text-green-600">🎉 {t('gradingGame.correct')}</span>
              ) : score === 3 ? (
                <span className="text-amber-600">⚠️ Grade-2</span>
              ) : (
                <span className="text-red-600">❌ {t('gradingGame.wrong')}</span>
              )}
            </p>

            {score < 4 && attempts < 2 ? (
              <button
                onClick={retry}
                className="w-full py-4 bg-green-500 text-white rounded-xl font-semibold"
              >
                🔄 {t('gradingGame.tryAgain')}
              </button>
            ) : (
              <button
                onClick={handleComplete}
                className="w-full py-4 bg-green-500 text-white rounded-xl font-semibold"
              >
                {score >= 4 ? 'Store in Godown' : 'Go to Mandi'}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-amber-50 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Standards Reference */}
        <div className="bg-amber-100 rounded-xl p-4 mb-4 border-2 border-amber-300">
          <h3 className="font-semibold text-amber-900 mb-2">
            📋 {t('gradingGame.standards')}
          </h3>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div className="text-center">
              <p className="font-semibold text-green-700">{t('gradingGame.godownBin')}</p>
              <p className="text-gray-600">{t('gradingGame.moisture')} ≤ 14%</p>
              <p className="text-gray-600">{t('gradingGame.foreign')} ≤ 1%</p>
              <p className="text-gray-600">{t('gradingGame.damaged')} ≤ 3%</p>
            </div>
            <div className="text-center border-x border-amber-300">
              <p className="font-semibold text-amber-700">{t('gradingGame.mandiBin')}</p>
              <p className="text-gray-600">{t('gradingGame.moisture')} 14-18%</p>
              <p className="text-gray-600">{t('gradingGame.foreign')} ≤ 3%</p>
              <p className="text-gray-600">{t('gradingGame.damaged')} ≤ 8%</p>
            </div>
            <div className="text-center">
              <p className="font-semibold text-red-700">{t('gradingGame.rejectBin')}</p>
              <p className="text-gray-600">{t('gradingGame.moisture')} &gt; 18%</p>
              <p className="text-gray-600">{t('gradingGame.foreign')} &gt; 3%</p>
              <p className="text-gray-600">{t('gradingGame.damaged')} &gt; 8%</p>
            </div>
          </div>
        </div>

        {/* Current Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-4">
          <div className="text-center mb-6">
            <span className="text-6xl">{samples[currentCard].image}</span>
            <p className="text-gray-600 mt-2">
              {t('gradingGame.sample')} {currentCard + 1}/5
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-6 text-center">
            <div className="bg-gray-100 rounded-lg p-2">
              <p className="text-xs text-gray-600">{t('gradingGame.moisture')}</p>
              <p className="text-xl font-bold">{samples[currentCard].moisture}%</p>
            </div>
            <div className="bg-gray-100 rounded-lg p-2">
              <p className="text-xs text-gray-600">{t('gradingGame.foreign')}</p>
              <p className="text-xl font-bold">{samples[currentCard].foreignMatter}%</p>
            </div>
            <div className="bg-gray-100 rounded-lg p-2">
              <p className="text-xs text-gray-600">{t('gradingGame.damaged')}</p>
              <p className="text-xl font-bold">{samples[currentCard].damaged}%</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => assignToBin(samples[currentCard].id, 'godown')}
              className="py-4 bg-green-100 text-green-700 rounded-xl font-semibold hover:bg-green-200"
            >
              {t('gradingGame.godownBin')}
            </button>
            <button
              onClick={() => assignToBin(samples[currentCard].id, 'mandi')}
              className="py-4 bg-amber-100 text-amber-700 rounded-xl font-semibold hover:bg-amber-200"
            >
              {t('gradingGame.mandiBin')}
            </button>
            <button
              onClick={() => assignToBin(samples[currentCard].id, 'reject')}
              className="py-4 bg-red-100 text-red-700 rounded-xl font-semibold hover:bg-red-200"
            >
              {t('gradingGame.rejectBin')}
            </button>
          </div>
        </div>

        {/* Progress */}
        <div className="flex gap-2 mb-4">
          {samples.map((s, i) => (
            <div
              key={s.id}
              className={`flex-1 h-2 rounded-full ${
                assignments[s.id] ? 'bg-green-500' : i === currentCard ? 'bg-amber-400' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>

        {/* Submit */}
        {Object.keys(assignments).length === 5 && (
          <button
            onClick={submitGrading}
            className="w-full py-4 bg-green-500 text-white rounded-xl font-semibold"
          >
            ✅ {t('gradingGame.submit', 'Submit')}
          </button>
        )}
      </div>
    </div>
  );
};

export default GradingGame;
