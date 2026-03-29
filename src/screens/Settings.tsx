import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useSettingsStore } from '../store/settingsStore';
import { modelDownloader } from '../voice/ModelDownloader';
import type { Language } from '../types/game.types';

type FontSize = 'small' | 'medium' | 'large';
type Section = 'language' | 'voice' | 'display' | 'game' | 'about';

export const Settings: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const { t, i18n } = useTranslation();
  const settings = useSettingsStore();
  const [activeSection, setActiveSection] = useState<Section>('language');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [modelDownloaded, setModelDownloaded] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleBack = () => {
    if (onBack) {
      onBack();
    }
  };

  const languages: { code: Language; name: string; flag: string }[] = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'hi', name: 'हिंदी', flag: '🇮🇳' },
    { code: 'ta', name: 'தமிழ்', flag: '🇮🇳' },
    { code: 'te', name: 'తెలుగు', flag: '🇮🇳' },
    { code: 'bn', name: 'বাংলা', flag: '🇮🇳' },
    { code: 'mr', name: 'मराठी', flag: '🇮🇳' },
    { code: 'gu', name: 'ગુજરાતી', flag: '🇮🇳' },
    { code: 'kn', name: 'ಕನ್ನಡ', flag: '🇮🇳' },
    { code: 'pa', name: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
    { code: 'or', name: 'ଓଡ଼ିଆ', flag: '🇮🇳' },
    { code: 'as', name: 'অসমীয়া', flag: '🇮🇳' },
  ];

  useEffect(() => {
    const checkModel = async () => {
      const cached = await modelDownloader.isModelCached(i18n.language as Language);
      setModelDownloaded(cached);
    };
    checkModel();
  }, [i18n.language]);

  const handleLanguageChange = (lang: Language) => {
    i18n.changeLanguage(lang);
    settings.setLanguage(lang);
    // Trigger model download check for new language
    modelDownloader.isModelCached(lang).then(setModelDownloaded);
  };

  const handleFontSizeChange = (size: FontSize) => {
    settings.setFontSize(size);
    const sizes = { small: '14px', medium: '16px', large: '20px' };
    document.documentElement.style.setProperty('--font-base', sizes[size]);
  };

  const handleSpeedPreview = () => {
    const utterance = new SpeechSynthesisUtterance(t('settings.speedPreview'));
    utterance.lang = (i18n.language || '').startsWith('hi') ? 'hi-IN' : 'en-IN';
    utterance.rate = settings.speechSpeed;
    window.speechSynthesis.speak(utterance);
  };

  const handleMicTest = async () => {
    try {
      setIsRecording(true);
      setRecordingTime(0);
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        if (audioRef.current) {
          audioRef.current.src = url;
          audioRef.current.play();
        }
        stream.getTracks().forEach(t => t.stop());
      };
      
      mediaRecorder.start();
      
      // Record for 3 seconds
      const interval = setInterval(() => {
        setRecordingTime(t => {
          if (t >= 3) {
            clearInterval(interval);
            mediaRecorder.stop();
            setIsRecording(false);
            return 0;
          }
          return t + 0.1;
        });
      }, 100);
      
    } catch {
      alert(t('settings.micPermissionDenied'));
      setIsRecording(false);
    }
  };

  const handleDownloadModel = async () => {
    await modelDownloader.downloadModel(
      i18n.language as Language,
      () => {}, // Progress callback
      () => setModelDownloaded(true),
      (err) => alert(err)
    );
  };

  const handleResetGame = () => {
    settings.resetGame();
    // Reset will be handled by parent component
  };

  const sections: { id: Section; label: string; icon: string }[] = [
    { id: 'language', label: t('settings.language'), icon: '🌐' },
    { id: 'voice', label: t('settings.voice'), icon: '🔊' },
    { id: 'display', label: t('settings.display'), icon: '📱' },
    { id: 'game', label: t('settings.game'), icon: '🎮' },
    { id: 'about', label: t('settings.about'), icon: 'ℹ️' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-amber-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={handleBack}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            ←
          </button>
          <h1 className="text-xl text-gray-900 font-bold">
            {t('settings.title')}
          </h1>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="max-w-2xl mx-auto px-4 py-4">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-all
                ${activeSection === section.id
                  ? 'bg-green-500 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
            >
              {section.icon} {section.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 pb-8">
        <motion.div
          key={activeSection}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-sm"
        >
          {/* LANGUAGE SECTION */}
          {activeSection === 'language' && (
            <div className="p-6 space-y-4">
              <h2 className="text-lg text-gray-900 font-bold mb-4">
                {t('settings.selectLanguage')}
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => handleLanguageChange(lang.code)}
                    className={`p-4 rounded-xl border-2 text-left transition-all
                      ${i18n.language === lang.code
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                      }`}
                  >
                    <span className="text-2xl mr-2">{lang.flag}</span>
                    <span className={i18n.language === lang.code ? 'text-green-700 font-semibold' : 'text-gray-700'}>
                      {lang.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* VOICE SECTION */}
          {activeSection === 'voice' && (
            <div className="p-6 space-y-6">
              {/* Voice Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {t('settings.voiceEnabled')}
                  </h3>
                  <p className="text-sm text-gray-500">{t('settings.voiceEnabledDesc')}</p>
                </div>
                <button
                  onClick={() => settings.setVoiceEnabled(!settings.voiceEnabled)}
                  className={`w-14 h-8 rounded-full transition-colors relative
                    ${settings.voiceEnabled ? 'bg-green-500' : 'bg-gray-300'}`}
                >
                  <motion.div
                    className="w-6 h-6 bg-white rounded-full absolute top-1"
                    animate={{ left: settings.voiceEnabled ? '26px' : '4px' }}
                  />
                </button>
              </div>

              {/* Auto-Read Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {t('settings.autoRead')}
                  </h3>
                  <p className="text-sm text-gray-500">{t('settings.autoReadDesc')}</p>
                </div>
                <button
                  onClick={() => settings.setAutoRead(!settings.autoRead)}
                  className={`w-14 h-8 rounded-full transition-colors relative
                    ${settings.autoRead ? 'bg-green-500' : 'bg-gray-300'}`}
                >
                  <motion.div
                    className="w-6 h-6 bg-white rounded-full absolute top-1"
                    animate={{ left: settings.autoRead ? '26px' : '4px' }}
                  />
                </button>
              </div>

              {/* Speech Speed */}
              <div>
                <h3 className="font-body font-semibold text-gray-900 mb-2">
                  {t('settings.speechSpeed')}
                </h3>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="0.5"
                    max="1.5"
                    step="0.1"
                    value={settings.speechSpeed}
                    onChange={(e) => settings.setSpeechSpeed(parseFloat(e.target.value))}
                    onMouseUp={handleSpeedPreview}
                    onTouchEnd={handleSpeedPreview}
                    className="flex-1 h-2 bg-amber-200 rounded-full appearance-none cursor-pointer"
                  />
                  <span className="font-body text-gray-700 w-16 text-right">
                    {settings.speechSpeed.toFixed(1)}x
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {settings.speechSpeed < 0.8 ? t('settings.slow') : 
                   settings.speechSpeed > 1.2 ? t('settings.fast') : t('settings.normal')}
                </p>
              </div>

              {/* Model Download */}
              {!modelDownloaded && (
                <button
                  onClick={handleDownloadModel}
                  className="w-full py-3 bg-green-100 text-red-700 rounded-xl font-body font-semibold hover:bg-field-200"
                >
                  🎙️ {t('settings.downloadVoiceModel')}
                </button>
              )}

              {/* Mic Test */}
              <div>
                <button
                  onClick={handleMicTest}
                  disabled={isRecording}
                  className={`w-full py-3 rounded-xl font-body font-semibold transition-all
                    ${isRecording 
                      ? 'bg-red-100 text-red-600' 
                      : 'bg-amber-100 text-gray-700 hover:bg-amber-200'}`}
                >
                  {isRecording 
                    ? `🔴 ${t('settings.recording')} ${(3 - recordingTime).toFixed(1)}s`
                    : `🔄 ${t('settings.testMic')}`
                  }
                </button>
                {isRecording && (
                  <div className="mt-2 h-8 flex items-center justify-center gap-1">
                    {[...Array(7)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="w-1 bg-danger-400 rounded-full"
                        animate={{ height: [8, 24, 8] }}
                        transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.1 }}
                      />
                    ))}
                  </div>
                )}
              </div>
              <audio ref={audioRef} className="hidden" />
            </div>
          )}

          {/* DISPLAY SECTION */}
          {activeSection === 'display' && (
            <div className="p-6 space-y-6">
              {/* Font Size */}
              <div>
                <h3 className="font-body font-semibold text-gray-900 mb-3">
                  {t('settings.fontSize')}
                </h3>
                <div className="flex gap-2">
                  {(['small', 'medium', 'large'] as FontSize[]).map((size) => (
                    <button
                      key={size}
                      onClick={() => handleFontSizeChange(size)}
                      className={`flex-1 py-3 rounded-xl font-body font-semibold transition-all
                        ${settings.fontSize === size
                          ? 'bg-green-500 text-white'
                          : 'bg-amber-100 text-gray-700 hover:bg-amber-200'
                        }`}
                    >
                      {size === 'small' && 'Small'}
                      {size === 'medium' && 'Medium'}
                      {size === 'large' && 'Large'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dark Mode */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-body font-semibold text-gray-900">
                    {t('settings.darkMode')}
                  </h3>
                  <p className="text-sm text-gray-500">{t('settings.darkModeDesc')}</p>
                </div>
                <button
                  onClick={() => settings.setDarkMode(!settings.darkMode)}
                  className={`w-14 h-8 rounded-full transition-colors relative
                    ${settings.darkMode ? 'bg-green-500' : 'bg-amber-500'}`}
                >
                  <motion.div
                    className="w-6 h-6 bg-white rounded-full absolute top-1"
                    animate={{ left: settings.darkMode ? '26px' : '4px' }}
                  />
                </button>
              </div>

              {/* Haptic Feedback */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-body font-semibold text-gray-900">
                    {t('settings.haptic')}
                  </h3>
                  <p className="text-sm text-gray-500">{t('settings.hapticDesc')}</p>
                </div>
                <button
                  onClick={() => settings.setHaptic(!settings.haptic)}
                  className={`w-14 h-8 rounded-full transition-colors relative
                    ${settings.haptic ? 'bg-green-500' : 'bg-amber-500'}`}
                >
                  <motion.div
                    className="w-6 h-6 bg-white rounded-full absolute top-1"
                    animate={{ left: settings.haptic ? '26px' : '4px' }}
                  />
                </button>
              </div>
            </div>
          )}

          {/* GAME SECTION */}
          {activeSection === 'game' && (
            <div className="p-6 space-y-6">
              {/* Reduce Animations */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-body font-semibold text-gray-900">
                    {t('settings.reduceAnimations')}
                  </h3>
                  <p className="text-sm text-gray-500">{t('settings.reduceAnimationsDesc')}</p>
                </div>
                <button
                  onClick={() => settings.setReducedMotion(!settings.reducedMotion)}
                  className={`w-14 h-8 rounded-full transition-colors relative
                    ${settings.reducedMotion ? 'bg-green-500' : 'bg-amber-500'}`}
                >
                  <motion.div
                    className="w-6 h-6 bg-white rounded-full absolute top-1"
                    animate={{ left: settings.reducedMotion ? '26px' : '4px' }}
                  />
                </button>
              </div>

              {/* Notifications */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-body font-semibold text-gray-900">
                    {t('settings.notifications')}
                  </h3>
                  <p className="text-sm text-gray-500">{t('settings.notificationsDesc')}</p>
                </div>
                <button
                  onClick={() => settings.setNotifications(!settings.notifications)}
                  className={`w-14 h-8 rounded-full transition-colors relative
                    ${settings.notifications ? 'bg-green-500' : 'bg-amber-500'}`}
                >
                  <motion.div
                    className="w-6 h-6 bg-white rounded-full absolute top-1"
                    animate={{ left: settings.notifications ? '26px' : '4px' }}
                  />
                </button>
              </div>

              {/* View Game Data */}
              <button
                className="w-full py-3 bg-amber-100 text-gray-700 rounded-xl font-semibold hover:bg-amber-200"
              >
                📊 {t('settings.viewData')}
              </button>

              {/* Edit Profile */}
              <button
                className="w-full py-3 bg-amber-100 text-gray-700 rounded-xl font-semibold hover:bg-amber-200"
              >
                🔄 {t('settings.editProfile')}
              </button>

              {/* Reset Game */}
              <button
                onClick={() => setShowResetConfirm(true)}
                className="w-full py-3 bg-red-100 text-red-600 rounded-xl font-body font-semibold hover:bg-danger-200"
              >
                ⚠️ {t('settings.resetGame')}
              </button>
            </div>
          )}

          {/* ABOUT SECTION */}
          {activeSection === 'about' && (
            <div className="p-6 space-y-6">
              <div className="text-center">
                <h2 className="font-display text-2xl text-gray-900">Anaj-Arth</h2>
                <p className="font-body text-gray-500">v1.0.0</p>
                <p className="font-body text-sm text-gray-400 mt-2">NCFE Innovate4FinLit</p>
              </div>

              <a
                href="tel:18001801551"
                className="block w-full py-4 bg-green-100 rounded-xl text-center"
              >
                <p className="font-body font-semibold text-red-700">📞 {t('settings.helpline')}</p>
                <p className="font-display text-xl text-green-600">1800-180-1551</p>
              </a>

              <button
                className="w-full py-3 bg-amber-100 text-gray-700 rounded-xl font-semibold hover:bg-amber-200"
              >
                🌐 {t('settings.schemes')}
              </button>
            </div>
          )}
        </motion.div>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <h3 className="font-display text-xl text-gray-900 mb-4">
              {t('settings.resetConfirm')}
            </h3>
            <p className="font-body text-gray-600 mb-6">
              {t('settings.resetWarning')}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-3 bg-amber-100 text-gray-700 rounded-xl font-body font-semibold"
              >
                {t('common.noBack')}
              </button>
              <button
                onClick={handleResetGame}
                className="flex-1 py-3 bg-red-500 text-white rounded-xl font-body font-semibold"
              >
                {t('common.yesDelete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
