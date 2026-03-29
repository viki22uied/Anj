import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Language } from '../types/game.types';

interface PriceAlert {
  id: string;
  type: 'above' | 'below';
  target: number;
  crop: string;
}

interface SettingsState {
  // Language
  language: Language;
  setLanguage: (lang: Language) => void;
  
  // Voice settings
  voiceEnabled: boolean;
  setVoiceEnabled: (enabled: boolean) => void;
  autoRead: boolean;
  setAutoRead: (enabled: boolean) => void;
  speechSpeed: number;
  setSpeechSpeed: (speed: number) => void;
  speechVolume: number;
  setSpeechVolume: (volume: number) => void;
  
  // Display settings
  fontSize: 'small' | 'medium' | 'large';
  setFontSize: (size: 'small' | 'medium' | 'large') => void;
  darkMode: boolean;
  setDarkMode: (enabled: boolean) => void;
  haptic: boolean;
  setHaptic: (enabled: boolean) => void;
  
  // Game settings
  reducedMotion: boolean;
  setReducedMotion: (enabled: boolean) => void;
  notifications: boolean;
  setNotifications: (enabled: boolean) => void;
  
  // Price alerts
  priceAlerts: PriceAlert[];
  addPriceAlert: (alert: Omit<PriceAlert, 'id'>) => void;
  removePriceAlert: (id: string) => void;

  // Actions
  resetGame: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      // Initial state
      language: 'hi',
      voiceEnabled: true,
      autoRead: true,
      speechSpeed: 0.85,
      speechVolume: 1.0,
      fontSize: 'medium',
      darkMode: false,
      haptic: true,
      reducedMotion: false,
      notifications: true,
      
      // Price alerts
      priceAlerts: [],
      addPriceAlert: (alert) => set((state) => ({
        priceAlerts: [...state.priceAlerts, { ...alert, id: Date.now().toString() }]
      })),
      removePriceAlert: (id) => set((state) => ({
        priceAlerts: state.priceAlerts.filter(a => a.id !== id)
      })),
      
      // Setters
      setLanguage: (lang) => set({ language: lang }),
      setVoiceEnabled: (enabled) => set({ voiceEnabled: enabled }),
      setAutoRead: (enabled) => set({ autoRead: enabled }),
      setSpeechSpeed: (speed) => set({ speechSpeed: speed }),
      setSpeechVolume: (volume) => set({ speechVolume: volume }),
      setFontSize: (size) => set({ fontSize: size }),
      setDarkMode: (enabled) => set({ darkMode: enabled }),
      setHaptic: (enabled) => set({ haptic: enabled }),
      setReducedMotion: (enabled) => set({ reducedMotion: enabled }),
      setNotifications: (enabled) => set({ notifications: enabled }),
      
      // Reset game - clears all stored data
      resetGame: () => {
        localStorage.clear();
        sessionStorage.clear();
        // Reload page to restart fresh
        window.location.href = '/';
      },
    }),
    {
      name: 'anaj-arth-settings',
      partialize: (state) => ({
        language: state.language,
        voiceEnabled: state.voiceEnabled,
        autoRead: state.autoRead,
        speechSpeed: state.speechSpeed,
        speechVolume: state.speechVolume,
        fontSize: state.fontSize,
        darkMode: state.darkMode,
        haptic: state.haptic,
        reducedMotion: state.reducedMotion,
        notifications: state.notifications,
      }),
    }
  )
);
