import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { modelDownloader } from '../voice/ModelDownloader';
import type { Language } from '../types/game.types';

interface VoiceSetupProps {
  onComplete: () => void;
  onSkip: () => void;
  language: Language;
}

export const VoiceSetup: React.FC<VoiceSetupProps> = ({ onComplete, onSkip, language }) => {
  const { t } = useTranslation();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadComplete, setDownloadComplete] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [modelSize, setModelSize] = useState(40);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Get model size for current language
    setModelSize(modelDownloader.getModelSize(language));
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [language]);

  const handleDownload = async () => {
    if (!isOnline) return;
    
    setIsDownloading(true);
    setDownloadProgress(0);
    
    await modelDownloader.downloadModel(
      language,
      (progress: number) => setDownloadProgress(progress),
      () => {
        setDownloadComplete(true);
        setIsDownloading(false);
        setTimeout(() => {
          onComplete();
        }, 1500);
      },
      (error: string) => {
        setIsDownloading(false);
        alert(error);
      }
    );
  };

  const handleSkip = () => {
    onSkip();
  };

  const languageNames: Record<Language, string> = {
    hi: 'हिंदी',
    ta: 'தமிழ்',
    te: 'తెలుగు',
    bn: 'বাংলা',
    mr: 'मराठी',
    gu: 'ગુજરાતી',
    kn: 'ಕನ್ನಡ',
    pa: 'ਪੰਜਾਬੀ',
    or: 'ଓଡ଼ିଆ',
    as: 'অসমীয়া',
    en: 'English',
  };

  return (
    <div className="min-h-screen bg-soil-50 flex flex-col items-center justify-center p-4">
      {/* Main Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center"
      >
        {/* Animated Mic Icon */}
        <div className="relative mb-6">
          <motion.div
            className="w-24 h-24 mx-auto bg-soil-100 rounded-full flex items-center justify-center"
            animate={{ 
              scale: [1, 1.05, 1],
              boxShadow: ['0 0 0 0px rgba(139, 115, 85, 0.2)', '0 0 0 20px rgba(139, 115, 85, 0)', '0 0 0 0px rgba(139, 115, 85, 0.2)']
            }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <span className="text-5xl">🎙️</span>
          </motion.div>
        </div>

        {/* Title */}
        <h1 className="font-display text-2xl text-soil-900 mb-4">
          {t('voiceSetup.title', 'अनाज अर्थ बोलकर भी काम करता है!')}
        </h1>

        {/* Description */}
        <p className="font-body text-soil-600 mb-2">
          {t('voiceSetup.description1', `पहले ${languageNames[language]} बोलने की सुविधा डाउनलोड करनी होगी — ${modelSize}MB।`)}
        </p>
        <p className="font-body text-soil-600 mb-6">
          {t('voiceSetup.description2', 'एक बार होगा, फिर हमेशा बिना इंटरनेट चलेगा।')}
        </p>

        {/* Progress Bar */}
        <AnimatePresence>
          {isDownloading && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6"
            >
              <div className="h-3 bg-soil-100 rounded-full overflow-hidden mb-2">
                <motion.div
                  className="h-full bg-field-500 rounded-full"
                  style={{ width: `${downloadProgress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <p className="font-body text-sm text-soil-600">
                {t('voiceSetup.downloading', 'डाउनलोड हो रहा है...')} {downloadProgress}%
              </p>
            </motion.div>
          )}

          {downloadComplete && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-6 p-4 bg-field-50 rounded-xl border-2 border-field-200"
            >
              <p className="font-body text-field-700 font-semibold">
                ✅ {t('voiceSetup.ready', 'तैयार है! अब बोलकर खेलो।')}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Buttons */}
        <div className="space-y-3">
          {/* Download Button */}
          <button
            onClick={handleDownload}
            disabled={!isOnline || isDownloading || downloadComplete}
            className={`w-full py-4 rounded-2xl font-body font-semibold text-lg transition-all duration-200
              ${!isOnline || isDownloading || downloadComplete
                ? 'bg-soil-200 text-soil-400 cursor-not-allowed'
                : 'bg-field-500 text-white hover:bg-field-600 active:scale-98'
              }`}
          >
            {!isOnline 
              ? t('voiceSetup.offline', 'इंटरनेट नहीं है — बाद में डाउनलोड करो')
              : isDownloading 
                ? t('voiceSetup.downloadingBtn', 'डाउनलोड हो रहा है...')
                : downloadComplete
                  ? t('voiceSetup.complete', 'तैयार!')
                  : `📥 ${languageNames[language]} ${t('voiceSetup.downloadVoice', 'बोलने की सुविधा डाउनलोड करें')} — ${modelSize}MB`
            }
          </button>

          {/* Skip Button */}
          <button
            onClick={handleSkip}
            disabled={isDownloading}
            className="w-full py-3 rounded-2xl font-body font-medium text-soil-600 
              border-2 border-soil-200 hover:border-soil-300 hover:bg-soil-50 
              active:scale-98 transition-all duration-200"
          >
            {t('voiceSetup.downloadLater', '⬇️ बाद में डाउनलोड करें')}
          </button>

          {/* Why Needed Button */}
          <button
            onClick={() => setShowExplanation(true)}
            disabled={isDownloading}
            className="w-full py-2 font-body text-sm text-soil-500 hover:text-soil-700"
          >
            {t('voiceSetup.whyNeeded', '❓ यह क्यों ज़रूरी है?')}
          </button>
        </div>
      </motion.div>

      {/* Explanation Modal */}
      <AnimatePresence>
        {showExplanation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowExplanation(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-display text-xl text-soil-900 mb-4">
                {t('voiceSetup.whyTitle', 'किसान भाई,')}
              </h3>
              <p className="font-body text-soil-600 mb-4">
                {t('voiceSetup.whyText1', 'बोलकर खेलना ज़्यादा आसान है।')}
              </p>
              <p className="font-body text-soil-600 mb-4">
                {t('voiceSetup.whyText2', 'अनाज बेचने का निर्णय, बातचीत — सब बोलकर होगा।')}
              </p>
              <p className="font-body text-soil-600 mb-6">
                {t('voiceSetup.whyText3', 'यह एक बार डाउनलोड होगा। फिर बिना इंटरनेट भी काम करेगा।')}
              </p>
              <button
                onClick={() => setShowExplanation(false)}
                className="w-full py-3 bg-soil-100 rounded-xl font-body font-semibold text-soil-700 hover:bg-soil-200"
              >
                {t('voiceSetup.close', 'बंद करें')}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VoiceSetup;
