import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

type Round = 1 | 2 | 3 | 'complete';

export const MandiMath: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const { t } = useTranslation();
  const [round, setRound] = useState<Round>(1);
  const [answer, setAnswer] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [profitLoss, setProfitLoss] = useState<'profit' | 'loss' | null>(null);

  // Round 1: MSP Gap
  const arhatiyaOffer = 1900;
  const mspPrice = 2275;
  const mspGap = mspPrice - arhatiyaOffer;

  // Round 2: Storage Gain
  const currentPrice = 2100;
  const futurePrice = 2600;
  const storageCostPerQuintalPerMonth = 25;
  const months = 3;
  const grainAmount = 40;
  const storageGain = (futurePrice - currentPrice) * grainAmount - storageCostPerQuintalPerMonth * months * grainAmount;

  // Round 3: Moneylender vs KCC
  const loanAmount = 30000;
  const moneylenderRate = 0.04;
  const months2 = 6;
  const moneylenderTotal = Math.round(loanAmount * Math.pow(1 + moneylenderRate, months2));
  const moneylenderInterest = moneylenderTotal - loanAmount;
  const kccInterest = Math.round(loanAmount * 0.04 * (months2 / 12));
  const interestDifference = moneylenderInterest - kccInterest;

  const checkAnswer = () => {
    const numAnswer = parseInt(answer);
    let correct = false;

    if (round === 1) {
      correct = numAnswer === mspGap;
    } else if (round === 2) {
      correct = numAnswer === storageGain;
    } else if (round === 3) {
      correct = numAnswer === moneylenderTotal;
    }

    setIsCorrect(correct);
    setShowFeedback(true);
  };

  const nextRound = () => {
    setAnswer('');
    setShowFeedback(false);
    if (round === 1) setRound(2);
    else if (round === 2) setRound(3);
    else setRound('complete');
  };

  const handleProfitLoss = (type: 'profit' | 'loss') => {
    setProfitLoss(type);
    if (type === 'profit' && storageGain > 0) {
      setIsCorrect(true);
    } else if (type === 'loss' && storageGain <= 0) {
      setIsCorrect(true);
    } else {
      setIsCorrect(false);
    }
    setShowFeedback(true);
  };

  if (round === 'complete') {
    return (
      <div className="min-h-screen bg-soil-50 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl p-8 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="text-6xl mb-4"
            >
              🎉
            </motion.div>
            <h1 className="font-display text-2xl text-soil-900 mb-4">
              {t('mandiMath.complete', 'Great job — you learned the math!')}
            </h1>
            <p className="font-body text-soil-600 mb-6">
              {t('mandiMath.completeDesc', 'Now use it in the real mandi.')}
            </p>
            <button
              onClick={onComplete}
              className="w-full py-4 bg-field-500 text-white rounded-xl font-body font-semibold"
            >
              {t('mandiMath.goToMarket', 'Back to game')} →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-soil-50 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Progress */}
        <div className="flex gap-2 mb-6">
          {[1, 2, 3].map((r) => (
            <div
              key={r}
              className={`flex-1 h-2 rounded-full ${
                r < round ? 'bg-field-500' : r === round ? 'bg-amber-400' : 'bg-soil-200'
              }`}
            />
          ))}
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm">
          {round === 1 && (
            <>
              <h2 className="font-display text-xl text-soil-900 mb-4">
                {t('mandiMath.round1Title', 'Round 1: MSP gap')}
              </h2>
              <div className="bg-amber-50 rounded-xl p-4 mb-6">
                <p className="font-body text-amber-800">
                  {t('mandiMath.scenario1', 'The trader offers ₹{offer}/quintal. MSP is ₹{msp}.', { offer: arhatiyaOffer, msp: mspPrice })}
                </p>
              </div>
              <p className="font-body text-soil-700 mb-4">
                {t('mandiMath.question1', 'How much lower is the offer? (per quintal)')}
              </p>
            </>
          )}

          {round === 2 && (
            <>
              <h2 className="font-display text-xl text-soil-900 mb-4">
                {t('mandiMath.round2Title', 'Round 2: Storage decision')}
              </h2>
              <div className="bg-field-50 rounded-xl p-4 mb-6">
                <p className="font-body text-field-800">
                  {t('mandiMath.scenario2', 'Price now is ₹{current}/quintal. After 3 months it may be ₹{future}. Storage cost is ₹{cost}/quintal/month. You have {grain} quintals.', { current: currentPrice, future: futurePrice, cost: storageCostPerQuintalPerMonth, grain: grainAmount })}
                </p>
              </div>
              <p className="font-body text-soil-700 mb-4">
                {t('mandiMath.question2', 'Will it be profit or loss? (then calculate)')}
              </p>
              <div className="flex gap-3 mb-4">
                <button
                  onClick={() => handleProfitLoss('profit')}
                  className={`flex-1 py-3 rounded-xl font-body font-semibold ${
                    profitLoss === 'profit' ? 'bg-field-500 text-white' : 'bg-field-100 text-field-700'
                  }`}
                >
                  📈 {t('mandiMath.profit', 'Profit')}
                </button>
                <button
                  onClick={() => handleProfitLoss('loss')}
                  className={`flex-1 py-3 rounded-xl font-body font-semibold ${
                    profitLoss === 'loss' ? 'bg-danger-500 text-white' : 'bg-danger-100 text-danger-700'
                  }`}
                >
                  📉 {t('mandiMath.loss', 'Loss')}
                </button>
              </div>
            </>
          )}

          {round === 3 && (
            <>
              <h2 className="font-display text-xl text-soil-900 mb-4">
                {t('mandiMath.round3Title', 'Round 3: True loan cost')}
              </h2>
              <div className="bg-danger-50 rounded-xl p-4 mb-6">
                <p className="font-body text-danger-800">
                  {t('mandiMath.scenario3', 'You borrow ₹{amount} from a moneylender at 4% per month. How much will you repay after 6 months?', { amount: loanAmount })}
                </p>
              </div>
              <p className="font-body text-soil-700 mb-4">
                {t('mandiMath.question3', 'Total repayment:')}
              </p>
            </>
          )}

          {/* Number Input */}
          <input
            type="number"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder={t('mandiMath.enterAnswer', 'Enter your answer')}
            className="w-full p-4 border-2 border-soil-200 rounded-xl font-display text-xl text-center mb-4 focus:border-field-500 focus:outline-none"
          />

          {!showFeedback ? (
            <button
              onClick={checkAnswer}
              disabled={!answer}
              className="w-full py-4 bg-field-500 text-white rounded-xl font-body font-semibold disabled:bg-soil-300"
            >
              ✅ {t('mandiMath.submit', 'Submit')}
            </button>
          ) : (
            <div className={`p-4 rounded-xl mb-4 ${isCorrect ? 'bg-field-50 border-2 border-field-200' : 'bg-danger-50 border-2 border-danger-200'}`}>
              <p className={`font-body font-semibold mb-2 ${isCorrect ? 'text-field-700' : 'text-danger-700'}`}>
                {isCorrect ? '🎉 ' + t('mandiMath.correct', 'Correct!') : '❌ ' + t('mandiMath.wrong', 'Try again')}
              </p>
              
              {round === 1 && (
                <p className="text-sm text-soil-600">
                  {t('mandiMath.feedback1', '₹{gap}/क्विंटल कम मिला। 50 क्विंटल पर ₹{total} का नुकसान!', { gap: mspGap, total: mspGap * 50 })}
                </p>
              )}
              
              {round === 2 && (
                <div className="text-sm text-soil-600">
                  <p>{t('mandiMath.calculation2', 'गणित: (₹{future} - ₹{current}) × {grain} = ₹{gain}', { future: futurePrice, current: currentPrice, grain: grainAmount, gain: (futurePrice - currentPrice) * grainAmount })}</p>
                  <p>{t('mandiMath.storageCost', 'Storage cost: ₹{cost} × 3 × {grain} = ₹{total}', { cost: storageCostPerQuintalPerMonth, grain: grainAmount, total: storageCostPerQuintalPerMonth * 3 * grainAmount })}</p>
                  <p className="font-semibold text-field-700">{t('mandiMath.netProfit', 'Net: ₹{amount}', { amount: storageGain })}</p>
                </div>
              )}
              
              {round === 3 && (
                <div className="text-sm text-soil-600">
                  <p>{t('mandiMath.moneylenderTotal', 'Moneylender: ₹{total} (₹{interest} interest)', { total: moneylenderTotal, interest: moneylenderInterest })}</p>
                  <p>{t('mandiMath.kccCompare', 'If KCC at 4% per year: ₹{interest} interest (6 months)', { interest: kccInterest })}</p>
                  <p className="font-semibold text-danger-700">{t('mandiMath.difference', 'Difference: save ₹{diff}', { diff: interestDifference })}</p>
                </div>
              )}

              <button
                onClick={nextRound}
                className="mt-4 w-full py-3 bg-field-500 text-white rounded-xl font-body font-semibold"
              >
                {round === 3 ? t('mandiMath.finish', 'Finish') : t('mandiMath.next', 'Next')} →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MandiMath;
