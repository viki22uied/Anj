import type { Language } from '../types/game.types';

export class TTSManager {
  private language: Language;
  private speechSynthesis: SpeechSynthesis;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private audioFallback: Map<string, HTMLAudioElement> = new Map();
  private _isSpeaking: boolean = false;
  private speed: number = 0.85;
  private volume: number = 1.0;
  private enabled: boolean = true;

  private readonly LANG_MAP: Partial<Record<Language, string>> = {
    hi: 'hi-IN',
    ta: 'ta-IN',
    te: 'te-IN',
    bn: 'bn-IN',
    mr: 'mr-IN',
    gu: 'gu-IN',
    kn: 'kn-IN',
    pa: 'pa-IN',
    or: 'or-IN',
    as: 'as-IN',
  };

  constructor(language: Language) {
    this.language = language;
    this.speechSynthesis = window.speechSynthesis;
    this.preloadCriticalAudio();
  }

  /**
   * PRIMARY SPEAK METHOD
   * 1. Try Web Speech API first
   * 2. Fall back to pre-recorded MP3 if Web Speech unavailable
   * 3. Fall back to silent (text still shows) if both unavailable
   */
  async speak(
    text: string,
    options?: { onStart?: () => void; onEnd?: () => void; priority?: 'high' | 'normal' }
  ): Promise<void> {
    if (!this.enabled) return;

    // Stop any current speech
    if (this._isSpeaking) {
      this.stop();
    }

    // Try Web Speech API
    if (this.speechSynthesis && this.hasVoiceForLanguage()) {
      return this.speakWithWebSpeech(text, options);
    }

    // Fallback: pre-recorded MP3
    const audioKey = this.textToAudioKey(text);
    if (this.audioFallback.has(audioKey)) {
      return this.speakWithAudio(audioKey, options);
    }

    // Silent fallback — text is shown, no audio
    // This is acceptable — never block UI for missing audio
    options?.onStart?.();
    options?.onEnd?.();
  }

  private speakWithWebSpeech(
    text: string,
    options?: { onStart?: () => void; onEnd?: () => void }
  ): Promise<void> {
    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text);
      const langCode = this.LANG_MAP[this.language];
      utterance.lang = langCode || 'hi-IN';
      utterance.rate = this.speed;
      utterance.volume = this.volume;
      utterance.pitch = 1.0;

      // Select best available voice for language
      const voices = this.speechSynthesis.getVoices();
      const preferred = voices.find(v => v.lang === this.LANG_MAP[this.language]);
      if (preferred) utterance.voice = preferred;

      utterance.onstart = () => {
        this._isSpeaking = true;
        options?.onStart?.();
      };
      utterance.onend = () => {
        this._isSpeaking = false;
        options?.onEnd?.();
        resolve();
      };
      utterance.onerror = () => {
        this._isSpeaking = false;
        resolve(); // Never reject — silent fallback
      };

      this.currentUtterance = utterance;
      this.speechSynthesis.speak(utterance);
    });
  }

  private speakWithAudio(key: string, options?: { onStart?: () => void; onEnd?: () => void }): Promise<void> {
    return new Promise((resolve) => {
      const audio = this.audioFallback.get(key);
      if (!audio) { resolve(); return; }

      audio.onplay = () => { this._isSpeaking = true; options?.onStart?.(); };
      audio.onended = () => { this._isSpeaking = false; options?.onEnd?.(); resolve(); };
      audio.onerror = () => { resolve(); };
      audio.play().catch(() => resolve());
    });
  }

  stop(): void {
    this.speechSynthesis?.cancel();
    this.audioFallback.forEach(a => { a.pause(); a.currentTime = 0; });
    this._isSpeaking = false;
    this.currentUtterance = null;
  }

  private hasVoiceForLanguage(): boolean {
    const voices = this.speechSynthesis.getVoices();
    const langCode = this.LANG_MAP[this.language];
    if (!langCode) return false;
    return voices.some(v => v.lang.startsWith(langCode.split('-')[0]));
  }

  private preloadCriticalAudio(): void {
    // Pre-load the 20 most common prompts as audio files
    // These cover: all decision screen prompts, crisis event narrations,
    // NPC opening lines, tutorial steps
    const criticalKeys = [
      'harvest_decision_prompt',
      'stress_high_warning',
      'arhatiya_opening_hi',
      'pmfby_cutoff_warning',
      'kcc_approved',
      'debt_overdue_warning',
      'farm_dashboard_prompt',
      'negotiation_start',
      'credit_screen_prompt',
      'pmfby_screen_prompt',
      'godown_entry_prompt',
      'loan_repayment_prompt',
      'crisis_event_prompt',
      'season_summary_prompt',
      'tutorial_step_1',
      'tutorial_step_2',
      'tutorial_step_3',
      'tutorial_step_4',
      'tutorial_step_5',
      'tutorial_step_6',
    ];

    criticalKeys.forEach(key => {
      const audio = new Audio(`/audio/${this.language}/${key}.mp3`);
      audio.preload = 'auto';
      this.audioFallback.set(key, audio);
    });
  }

  private textToAudioKey(text: string): string {
    // Convert text to audio file key
    // Only exact matches used — no fuzzy matching
    return text.slice(0, 30).replace(/[^a-zA-Z0-9\u0900-\u097F]/g, '_');
  }

  setLanguage(lang: Language): void { 
    this.language = lang; 
    this.preloadCriticalAudio(); 
  }
  
  setSpeed(speed: number): void { 
    this.speed = Math.min(1.5, Math.max(0.5, speed)); 
  }
  
  setVolume(vol: number): void { 
    this.volume = Math.min(1.0, Math.max(0, vol)); 
  }
  
  setEnabled(enabled: boolean): void { 
    this.enabled = enabled; 
  }
  
  getIsSpeaking(): boolean { 
    return this._isSpeaking; 
  }
}
