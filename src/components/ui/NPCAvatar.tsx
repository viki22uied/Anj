import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

type NPCType = 'arhatiya' | 'moneylender' | 'bank_mitra' | 'sarpanch' | 'family';
type MouthState = 'closed' | 'open_small' | 'open_large';

interface NPCAvatarProps {
  npcType: NPCType;
  isTalking: boolean;
  emotion: 'neutral' | 'friendly' | 'aggressive' | 'worried' | 'happy';
  state?: string; // Indian state — affects avatar appearance
}

export const NPCAvatar: React.FC<NPCAvatarProps> = ({ npcType, isTalking, emotion, state }) => {
  const [mouthState, setMouthState] = useState<MouthState>('closed');

  // Simulate lip sync by cycling mouth states during speech
  useEffect(() => {
    if (!isTalking) { setMouthState('closed'); return; }

    const interval = setInterval(() => {
      setMouthState(prev => {
        if (prev === 'closed') return 'open_small';
        if (prev === 'open_small') return Math.random() > 0.5 ? 'open_large' : 'closed';
        return 'closed';
      });
    }, 120); // 120ms cycles — simulates natural speech rhythm

    return () => clearInterval(interval);
  }, [isTalking]);

  // NPC visual configuration
  const NPC_CONFIG: Record<NPCType, { emoji: string; bg: string; name: string }> = {
    arhatiya:    { emoji: '👨‍💼', bg: 'bg-amber-100', name: 'आढ़तिया' },
    moneylender: { emoji: '👴',   bg: 'bg-red-50',    name: 'साहूकार' },
    bank_mitra:  { emoji: '👨‍💻',  bg: 'bg-blue-50',   name: 'बैंक मित्र' },
    sarpanch:    { emoji: '👨‍⚖️',  bg: 'bg-green-50',  name: 'सरपंच' },
    family:      { emoji: '👨‍👩‍👧',  bg: 'bg-yellow-50', name: 'परिवार' },
  };

  const config = NPC_CONFIG[npcType];

  // Emotion → eye/eyebrow animation
  const eyeAnimations: Record<string, object> = {
    neutral:    { scaleY: 1 },
    friendly:   { scaleY: 0.85, translateY: 1 },  // Squinted (smile)
    aggressive: { scaleY: 1.2, translateY: -1 },   // Wide (angry)
    worried:    { scaleY: 0.9, rotate: 10 },        // Furrowed
    happy:      { scaleY: 0.8, translateY: 2 },     // Happy squint
  };

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Avatar circle */}
      <motion.div
        className={`w-24 h-24 rounded-full ${config.bg} flex items-center justify-center
                  border-4 shadow-lg
                  ${emotion === 'aggressive' ? 'border-danger-400' :
                    emotion === 'friendly' ? 'border-field-400' :
                    'border-soil-300'}`}
        animate={isTalking ? { scale: [1, 1.03, 1], transition: { repeat: Infinity, duration: 0.6 } } : {}}
      >
        <div className="relative">
          <span className="text-5xl">{config.emoji}</span>

          {/* Mouth overlay — lip sync */}
          {isTalking && (
            <motion.div
              className="absolute bottom-1 left-1/2 transform -translate-x-1/2
                         bg-gray-800 rounded-full"
              animate={{
                width: mouthState === 'closed' ? '8px' : mouthState === 'open_small' ? '12px' : '16px',
                height: mouthState === 'closed' ? '2px' : mouthState === 'open_small' ? '8px' : '12px',
              }}
              transition={{ duration: 0.08 }}
            />
          )}
        </div>
      </motion.div>

      {/* NPC name badge */}
      <div className="bg-white px-3 py-1 rounded-full shadow text-xs font-body text-soil-700 font-medium">
        {config.name}
      </div>

      {/* Speaking indicator dots */}
      {isTalking && (
        <div className="flex gap-1">
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              className="w-1.5 h-1.5 bg-soil-400 rounded-full"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 0.6, delay: i * 0.2, repeat: Infinity }}
            />
          ))}
        </div>
      )}
    </div>
  );
};
