import { useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';

/**
 * SoundManager handles dynamic background music and sound effects (PRD Section 3.1)
 * Respond to: EmotionState, weekNumber, and specific GameEvents.
 */
export default function SoundManager() {
  const { gameState } = useGameStore();
  const currentEmotion = gameState?.currentEmotion;
  const weekNumber = gameState?.weekNumber || 1;
  const prevEmotion = useRef(currentEmotion);

  useEffect(() => {
    if (!gameState) return;

    // 1. DYNAMIC MUSIC LOGIC (PRD 3.1)
    // - SEASON_START: Bansuri + Tabla (Light, rhythmic)
    // - GROWING: Harmonium (Steady buildup)
    // - NEGOTIATION: Upbeat Dhol (High tempo)
    // - DREAD: Deep Sitars + Heartbeat synth
    // - RELIEF: Full flute, bright harmonium burst.
    
    // Placeholder: Log for debug since we don't have audio assets bundled.
    console.log(`[SoundManager] Transition to ${currentEmotion} music...`);
    
    // Handle Haptic double pulse for crisis in EventModal handled separately
    // Pulse for repayment relief handled in gameStore
    
    if (currentEmotion !== prevEmotion.current) {
      if (currentEmotion === 'relief') {
        // Play success burst
      }
      prevEmotion.current = currentEmotion;
    }

  }, [currentEmotion, gameState, weekNumber]);

  return null; // Side-effect component
}
