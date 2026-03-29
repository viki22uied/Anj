import type { Language } from '../types/game.types';

// Vosk model sizes — small models for mobile
const MODEL_URLS: Partial<Record<Language, string>> = {
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

// Model sizes in MB for display
const MODEL_SIZES: Partial<Record<Language, number>> = {
  hi: 45,
  ta: 42,
  te: 41,
  bn: 43,
  mr: 40,
  gu: 39,
  kn: 38,
  pa: 37,
  or: 36,
  as: 35,
};

export class ModelDownloader {
  async downloadModel(
    language: Language,
    onProgress: (percent: number) => void,
    onComplete: () => void,
    onError: (error: string) => void
  ): Promise<void> {
    const url = MODEL_URLS[language];
    if (!url) {
      onError('इस भाषा के लिए मॉडल उपलब्ध नहीं है');
      return;
    }
    
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Download failed');
      
      const contentLength = Number(response.headers.get('content-length') ?? 0);
      const reader = response.body!.getReader();
      const chunks: Uint8Array[] = [];
      let received = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        received += value.length;
        if (contentLength > 0) {
          onProgress(Math.round((received / contentLength) * 100));
        }
      }

      // Cache in CacheStorage for offline use
      const blob = new Blob(chunks.map(c => c.buffer as ArrayBuffer));
      await this.cacheModel(language, blob);
      onComplete();

    } catch (e) {
      onError('डाउनलोड नहीं हुआ। दोबारा कोशिश करें।');
    }
  }

  private async cacheModel(language: Language, blob: Blob): Promise<void> {
    const cache = await caches.open('vosk-models');
    await cache.put(`/models/${language}`, new Response(blob));
  }

  async isModelCached(language: Language): Promise<boolean> {
    try {
      const cache = await caches.open('vosk-models');
      const response = await cache.match(`/models/${language}`);
      return response !== undefined;
    } catch {
      return false;
    }
  }

  getModelSize(language: Language): number {
    return MODEL_SIZES[language] ?? 40;
  }

  async clearCachedModel(language: Language): Promise<void> {
    try {
      const cache = await caches.open('vosk-models');
      await cache.delete(`/models/${language}`);
    } catch {
      // Ignore errors
    }
  }
}

export const modelDownloader = new ModelDownloader();
