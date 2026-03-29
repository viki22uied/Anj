import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

interface VoiceButtonProps {
  onPress: () => void;
  onHold?: () => void;      // Push-to-talk
  onRelease?: () => void;
  isListening: boolean;
  label?: string;
  compact?: boolean;        // Small version for floating button
  disabled?: boolean;
  amplitudeData?: number[]; // Real-time waveform data (0–1 per bar)
}

export const VoiceButton: React.FC<VoiceButtonProps> = ({
  onPress, onHold, onRelease, isListening, label, compact = false, disabled = false, amplitudeData = []
}) => {
  const { t } = useTranslation();
  const [holdTimer, setHoldTimer] = useState<number | null>(null);
  const [isHolding, setIsHolding] = useState(false);

  // Waveform bars — 7 bars, animated based on amplitude
  const BAR_COUNT = 7;
  const bars = Array.from({ length: BAR_COUNT }, (_, i) => amplitudeData[i] ?? Math.random() * 0.3);

  const handlePressStart = () => {
    if (disabled) return;
    const timer = setTimeout(() => {
      setIsHolding(true);
      onHold?.();
    }, 300); // 300ms = push-to-talk threshold
    setHoldTimer(timer);
  };

  const handlePressEnd = () => {
    if (holdTimer) clearTimeout(holdTimer);
    if (isHolding) {
      setIsHolding(false);
      onRelease?.();
    } else {
      onPress(); // Tap = toggle
    }
    setHoldTimer(null);
  };

  if (compact) {
    return (
      <motion.button
        onPointerDown={handlePressStart}
        onPointerUp={handlePressEnd}
        onPointerLeave={handlePressEnd}
        disabled={disabled}
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg
          ${isListening ? 'bg-danger-500' : 'bg-soil-700'}
          ${disabled ? 'opacity-40' : 'active:scale-95'}
          transition-all duration-150`}
        animate={isListening ? { scale: [1, 1.08, 1], transition: { repeat: Infinity, duration: 1 } } : {}}
      >
        <span className="text-white text-2xl">{isListening ? '⏹' : '🎙️'}</span>
      </motion.button>
    );
  }

  return (
    <div className="w-full">
      <motion.button
        onPointerDown={handlePressStart}
        onPointerUp={handlePressEnd}
        onPointerLeave={handlePressEnd}
        disabled={disabled}
        className={`w-full py-4 rounded-2xl flex items-center justify-center gap-3
          ${isListening ? 'bg-danger-500 border-2 border-danger-300' : 'bg-soil-100 border-2 border-soil-300'}
          ${disabled ? 'opacity-40' : 'active:scale-98'}
          transition-all duration-200`}
        animate={isListening ? {
          boxShadow: ['0 0 0 0px rgba(239,68,68,0.4)', '0 0 0 12px rgba(239,68,68,0)', '0 0 0 0px rgba(239,68,68,0)'],
          transition: { repeat: Infinity, duration: 1.5 }
        } : {}}
      >
        {/* Waveform bars — only during listening */}
        <AnimatePresence>
          {isListening && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              className="flex items-center gap-0.5 h-8"
            >
              {bars.map((amp, i) => (
                <motion.div
                  key={i}
                  className="w-1.5 bg-white rounded-full"
                  animate={{
                    height: isListening ? `${Math.max(8, amp * 32)}px` : '8px',
                  }}
                  transition={{ duration: 0.1, delay: i * 0.02 }}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mic icon */}
        <span className={`text-2xl ${isListening ? 'text-white' : 'text-soil-700'}`}>
          {isListening ? '🔴' : '🎙️'}
        </span>

        {/* Label */}
        <span className={`font-body text-base font-medium ${isListening ? 'text-white' : 'text-soil-700'}`}>
          {isListening ? t('voice.listening') : (label ?? t('voice.tap_to_speak'))}
        </span>
      </motion.button>

      {/* Push-to-talk hint — shows after 2 uses */}
      {!disabled && !isListening && (
        <p className="text-center text-xs text-soil-400 mt-1">
          {t('voice.hold_for_ptt')}
        </p>
      )}
    </div>
  );
};
