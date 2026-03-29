/**
 * @module app/voiceService
 * Voice input/output service abstractions.
 * Designed for offline ASR (Vosk/Sherpa) with browser fallback.
 */

// Web Speech API type declarations
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export interface VoiceInputService {
  startListening(config?: VoiceConfig): Promise<void>;
  stopListening(): void;
  onTranscript(callback: (transcript: string, isFinal: boolean) => void): void;
  isAvailable(): boolean;
}

export interface VoiceOutputService {
  speak(text: string, lang?: string): Promise<void>;
  stop(): void;
  isAvailable(): boolean;
}

export interface VoiceConfig {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
}

/** Browser Web Speech API fallback implementation */
export class BrowserVoiceInput implements VoiceInputService {
  private recognition: any = null;
  private transcriptCallback: ((t: string, f: boolean) => void) | null = null;

  isAvailable(): boolean {
    return typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
  }

  async startListening(config?: VoiceConfig): Promise<void> {
    if (!this.isAvailable()) throw new Error('Speech recognition not available');
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SR();
    this.recognition.lang = config?.language ?? 'hi-IN';
    this.recognition.continuous = config?.continuous ?? false;
    this.recognition.interimResults = config?.interimResults ?? true;
    this.recognition.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        this.transcriptCallback?.(result[0].transcript, result.isFinal);
      }
    };
    this.recognition.onerror = (e: any) => console.warn('[Voice] Recognition error:', e.error);
    this.recognition.start();
  }

  stopListening(): void {
    this.recognition?.stop();
    this.recognition = null;
  }

  onTranscript(callback: (transcript: string, isFinal: boolean) => void): void {
    this.transcriptCallback = callback;
  }
}

/** Browser Speech Synthesis TTS implementation */
export class BrowserVoiceOutput implements VoiceOutputService {
  isAvailable(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  async speak(text: string, lang: string = 'hi-IN'): Promise<void> {
    if (!this.isAvailable()) return;
    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = 0.9;
      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();
      window.speechSynthesis.speak(utterance);
    });
  }

  stop(): void {
    if (this.isAvailable()) window.speechSynthesis.cancel();
  }
}

/** Stub implementation for testing */
export class StubVoiceInput implements VoiceInputService {
  isAvailable(): boolean { return true; }
  async startListening(): Promise<void> { /* no-op */ }
  stopListening(): void { /* no-op */ }
  onTranscript(): void { /* no-op */ }
}

export class StubVoiceOutput implements VoiceOutputService {
  isAvailable(): boolean { return true; }
  async speak(): Promise<void> { /* no-op */ }
  stop(): void { /* no-op */ }
}
