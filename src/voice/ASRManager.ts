import type { Language } from '../types/game.types';

export class ASRManager {
  private language: Language;
  private vosk: any = null;           // Vosk WASM instance
  private model: any = null;          // Loaded language model
  private recognizer: any = null;
  private isListening: boolean = false;
  private mediaStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private modelLoaded: boolean = false;

  // Vosk model sizes — small models for mobile
  private readonly MODEL_URLS: Partial<Record<Language, string>> = {
    hi: '/models/vosk-model-small-hi-0.22.tar.gz',
    ta: '/models/vosk-model-small-ta-0.4.tar.gz',
    te: '/models/vosk-model-small-te-0.4.tar.gz',
    bn: '/models/vosk-model-small-bn-0.4.tar.gz',
    mr: '/models/vosk-model-small-mr-0.4.tar.gz',
    gu: '/models/vosk-model-small-gu-0.4.tar.gz',
    kn: '/models/vosk-model-small-kn-0.4.tar.gz',
    pa: '/models/vosk-model-small-pa-0.4.tar.gz',
    or: '/models/vosk-model-small-or-0.4.tar.gz',
    as: '/models/vosk-model-small-as-0.4.tar.gz',
  };

  constructor(language: Language) {
    this.language = language;
  }

  async initialize(): Promise<void> {
    try {
      // Dynamic import — only load if voice is enabled
      // Note: vosk-browser will be added as dependency later
      // For now, we'll use a fallback implementation
      this.modelLoaded = false;
    } catch (e) {
      // Model not available — silent fallback to tap-only mode
      this.modelLoaded = false;
    }
  }

  /**
   * LISTEN METHOD
   * Records audio for up to timeoutMs
   * Returns transcript + confidence
   * Never throws — always returns a result (may be empty)
   */
  async listen(timeoutMs: number = 8000): Promise<ASRResult> {
    if (!this.modelLoaded) {
      return { transcript: '', confidence: 0, success: false, error: 'MODEL_NOT_LOADED' };
    }

    if (this.isListening) {
      return { transcript: '', confidence: 0, success: false, error: 'ALREADY_LISTENING' };
    }

    try {
      this.isListening = true;
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.audioContext = new AudioContext({ sampleRate: 16000 });

      const recognizer = new this.model.KaldiRecognizer(16000);
      recognizer.setWords(true);

      return new Promise((resolve) => {
        const source = this.audioContext!.createMediaStreamSource(this.mediaStream!);
        const processor = this.audioContext!.createScriptProcessor(4096, 1, 1);

        let finalResult = '';
        let maxConfidence = 0;

        processor.onaudioprocess = (e) => {
          const inputData = e.inputBuffer.getChannelData(0);
          const int16 = new Int16Array(inputData.length);
          for (let i = 0; i < inputData.length; i++) {
            int16[i] = Math.max(-32768, Math.min(32767, inputData[i] * 32768));
          }
          if (recognizer.acceptWaveform(int16)) {
            const result = JSON.parse(recognizer.result());
            if (result.text && result.text.length > 0) {
              finalResult = result.text;
              maxConfidence = result.result?.[0]?.conf ?? 0.5;
            }
          }
        };

        source.connect(processor);
        processor.connect(this.audioContext!.destination);

        // Stop after timeout
        setTimeout(() => {
          this.stopListening();
          const final = JSON.parse(recognizer.finalResult());
          resolve({
            transcript: final.text || finalResult,
            confidence: maxConfidence,
            success: (final.text || finalResult).length > 0,
            error: null,
          });
        }, timeoutMs);
      });

    } catch (e: any) {
      this.isListening = false;
      if (e.name === 'NotAllowedError') {
        return { transcript: '', confidence: 0, success: false, error: 'PERMISSION_DENIED' };
      }
      return { transcript: '', confidence: 0, success: false, error: 'UNKNOWN' };
    }
  }

  stopListening(): void {
    this.mediaStream?.getTracks().forEach(t => t.stop());
    this.audioContext?.close();
    this.isListening = false;
    this.mediaStream = null;
    this.audioContext = null;
  }

  setLanguage(lang: Language): void {
    this.language = lang;
    this.modelLoaded = false;
    this.initialize(); // Reload model for new language
  }

  getIsListening(): boolean { return this.isListening; }
  getModelLoaded(): boolean { return this.modelLoaded; }
}

export interface ASRResult {
  transcript: string;
  confidence: number;      // 0.0 – 1.0
  success: boolean;
  error: 'MODEL_NOT_LOADED' | 'ALREADY_LISTENING' | 'PERMISSION_DENIED' | 'UNKNOWN' | null;
}
