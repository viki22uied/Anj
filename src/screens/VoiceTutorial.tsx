import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { TTSManager } from '../voice/TTSManager';

const TUTORIAL_STEPS = [
  { id: 1, key: 'welcome', requiresAction: false },
  { id: 2, key: 'finances', requiresAction: false },
  { id: 3, key: 'buyInputs', requiresAction: true },
  { id: 4, key: 'kccLesson', requiresAction: false },
  { id: 5, key: 'insurance', requiresAction: false },
  { id: 6, key: 'godownSecret', requiresAction: false },
  { id: 7, key: 'negotiation', requiresAction: true },
];

// Voice scripts in multiple languages
const VOICE_SCRIPTS: Record<number, Partial<Record<string, string>>> = {
  1: {
    hi: 'नमस्ते! मैं अनाज अर्थ हूँ। यह आपका खेत है। आप एक किसान हैं। आज से 5 सीज़न — हम देखेंगे कि आप कैसे फैसले करते हैं।',
    ta: 'வணக்கம்! நான் அனஜ்-அர்த். இது உங்கள் வயல். நீங்கள் ஒரு விவசாயி. இன்று முதல் 5 பருவங்கள் — நாம் பார்ப்போம்.',
    bn: 'নমস্কার! আমি অনাজ-অর্থ। এটি আপনার খেত। আপনি একজন কৃষক। আজ থেকে 5 মৌসুম — দেখব কেমন সিদ্ধান্ত নেন।',
  },
  2: {
    hi: 'यह हरा नंबर — आपके हाथ का पैसा है। यह लाल नंबर — कर्ज़ है। यह बार — आपका तनाव है। तनाव ज़्यादा होगा, तो सोचना मुश्किल होगा।',
    ta: 'பச்சை எண் — உங்கள் பணம். சிவப்பு எண் — கடன். பார் — மன அழுத்தம். அதிகமாக இருந்தால் சிந்திக்க கடினம்.',
    bn: 'সবুজ সংখ্যা — আপনার টাকা। লাল সংখ্যা — ঋণ। বার — চাপ। বেশি হলে চিন্তা কঠিন।',
  },
  3: {
    hi: 'सबसे पहले — बीज और खाद खरीदो। नीचे बड़ा बटन दिखाई दे रहा है — उसे दबाओ।',
    ta: 'முதலில் — விதைகள் மற்றும் உரம் வாங்குங்கள். பெரிய பொத்தானை அழுத்துங்கள்.',
    bn: 'প্রথমে — বীজ এবং সার কিনুন। বড় বোতাম টিপুন।',
  },
  4: {
    hi: 'उधार लेना हो, तो दो रास्ते हैं। साहूकार तुरंत देता है लेकिन 36 से 60 प्रतिशत ब्याज। KCC सिर्फ 4 प्रतिशत। ₹30,000 पर 6 महीने में — साहूकार: ₹7,951 ब्याज। KCC: ₹600 ब्याज। फर्क = ₹7,351।',
    ta: 'கடன் இரு வழிகள். தனவணிகம் 36-60% வட்டி. KCC 4% மட்டுமே. ₹30,000க்கு வித்தியாசம் ₹7,351!',
    bn: 'ঋণের দুই পথ। সাহুকার 36-60% সুদ। KCC 4%। ₹30,000-এ পার্থক্য ₹7,351!',
  },
  5: {
    hi: 'फसल बीमा — PMFBY। बाढ़, सूखा, कीड़ा लगे तो सरकार भरेगी। प्रीमियम सिर्फ 2 प्रतिशत। ₹50,000 की फसल पर — ₹1,000 प्रीमियम। बाढ़ में ₹25,000 बचाएगा!',
    ta: 'பயிர் காப்பீடு — PMFBY. வெள்ளம், வறட்சி வந்தால் அரசு கொடுக்கும். ₹50,000க்கு ₹1,000 மட்டுமே!',
    bn: 'ফসল বীমা — PMFBY। বন্যা, খরায় সরকার দেবে। ₹50,000-এর জন্য ₹1,000!',
  },
  6: {
    hi: 'गोदाम का राज़! अप्रैल में ₹2,100, जुलाई में ₹2,600। फर्क ₹500/क्विंटल। 50 क्विंटल पर ₹25,000! गोदाम खर्चा ₹3,750। Net फायदा ₹21,250!',
    ta: 'கிடங்கின் ரகசியம்! ஏப்ரல் ₹2,100, ஜூலை ₹2,600. வித்தியாசம் ₹500/குவிண்டால். நிகர லாபம் ₹21,250!',
    bn: 'গোদামের রহস্য! এপ্রিল ₹2,100, জুলাই ₹2,600। পার্থক্য ₹500/কুইন্টাল। নিট লাভ ₹21,250!',
  },
  7: {
    hi: 'मंडी में आढ़तिया कम भाव देगा। MSP माँगना है। MSP ₹2,275 है — वह दो। बोलो या बटन दबाओ — आज़माओ।',
    ta: 'மண்டியில் குறைந்த விலை. MSP கேளுங்கள். MSP ₹2,275 — அதை கேளுங்கள்.',
    bn: 'মণ্ডিতে কম দাম। MSP চান। MSP ₹2,275 — তাই চান।',
  },
};

export const VoiceTutorial: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const { i18n } = useTranslation();
  const { gameState, profile } = useGameStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [tts] = useState(() => new TTSManager((profile?.language as any) || 'hi'));
  const [actionCompleted, setActionCompleted] = useState(false);

  const step = TUTORIAL_STEPS[currentStep];
  const script = VOICE_SCRIPTS[step.id]?.[i18n.language] || VOICE_SCRIPTS[step.id]?.['hi'] || '';

  useEffect(() => {
    speakCurrentStep();
    return () => {
      tts.stop();
    };
  }, [currentStep]);

  const speakCurrentStep = async () => {
    setIsSpeaking(true);
    await tts.speak(script, {
      onStart: () => setIsSpeaking(true),
      onEnd: () => setIsSpeaking(false),
    });
  };

  const nextStep = () => {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
      setActionCompleted(false);
    } else {
      onComplete();
    }
  };

  const handleAction = () => {
    setActionCompleted(true);
    setTimeout(nextStep, 500);
  };

  const replay = () => {
    speakCurrentStep();
  };

  return (
    <div className="min-h-screen bg-soil-50 relative overflow-hidden">
      {/* Progress */}
      <div className="absolute top-0 left-0 right-0 p-4 z-20">
        <div className="flex gap-1">
          {TUTORIAL_STEPS.map((_, i) => (
            <div
              key={i}
              className={`flex-1 h-2 rounded-full ${
                i < currentStep ? 'bg-field-500' : i === currentStep ? 'bg-amber-400' : 'bg-soil-200'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="max-w-md w-full"
          >
            {/* Visual Scene */}
            <div className="bg-white rounded-3xl shadow-xl p-8 mb-6 text-center">
              {/* Step Icon */}
              <div className="w-32 h-32 mx-auto bg-soil-100 rounded-full flex items-center justify-center mb-6">
                <span className="text-6xl">
                  {step.id === 1 && '🌾'}
                  {step.id === 2 && '💰'}
                  {step.id === 3 && '🌱'}
                  {step.id === 4 && '💳'}
                  {step.id === 5 && '🛡️'}
                  {step.id === 6 && '🏛️'}
                  {step.id === 7 && '🤝'}
                </span>
              </div>

              {/* Speaking Indicator */}
              {isSpeaking && (
                <div className="flex justify-center gap-1 mb-4">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-3 h-3 bg-field-500 rounded-full"
                      animate={{ scale: [1, 1.3, 1] }}
                      transition={{ repeat: Infinity, delay: i * 0.2, duration: 0.6 }}
                    />
                  ))}
                </div>
              )}

              {/* Script Text */}
              <p className="font-body text-lg text-soil-800 leading-relaxed mb-6">
                {script}
              </p>

              {/* Action Button */}
              {step.requiresAction ? (
                <button
                  onClick={handleAction}
                  className="w-full py-4 bg-field-500 text-white rounded-xl font-body font-semibold
                    hover:bg-field-600 active:scale-98 transition-all"
                >
                  {step.id === 3 && '💰 बीज-खाद खरीदो'}
                  {step.id === 7 && '🎮 खेल शुरू करें'}
                </button>
              ) : (
                <div className="flex gap-3">
                  <button
                    onClick={replay}
                    disabled={isSpeaking}
                    className="flex-1 py-3 bg-soil-100 text-soil-700 rounded-xl font-body
                      hover:bg-soil-200 disabled:opacity-50"
                  >
                    🔊 फिर सुनो
                  </button>
                  <button
                    onClick={nextStep}
                    disabled={isSpeaking}
                    className="flex-1 py-3 bg-field-500 text-white rounded-xl font-body font-semibold
                      hover:bg-field-600 disabled:opacity-50"
                  >
                    ▶ आगे
                  </button>
                </div>
              )}

              {/* Skip option after step 2 */}
              {currentStep >= 2 && !step.requiresAction && (
                <button
                  onClick={onComplete}
                  className="mt-4 text-sm text-soil-500 hover:text-soil-700"
                >
                  ट्यूटोरियल स्किप करें →
                </button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Background decoration */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-soil-200/50 to-transparent pointer-events-none" />
    </div>
  );
};

export default VoiceTutorial;
