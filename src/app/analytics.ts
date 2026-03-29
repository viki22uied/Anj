/**
 * @module app/analytics
 * Privacy-respecting telemetry service with offline queue.
 */

import type { TelemetryEvent } from '../domain/types';
import { v4 as uuidv4 } from 'uuid';

export interface AnalyticsService {
  track(eventName: string, payload?: Record<string, unknown>): void;
  flush(): Promise<void>;
  getPendingEvents(): TelemetryEvent[];
}

export class OfflineAnalytics implements AnalyticsService {
  private queue: TelemetryEvent[] = [];
  private sessionId: string;
  private maxQueueSize: number;

  constructor(maxQueueSize: number = 500) {
    this.sessionId = uuidv4();
    this.maxQueueSize = maxQueueSize;
  }

  track(eventName: string, payload: Record<string, unknown> = {}): void {
    if (this.queue.length >= this.maxQueueSize) {
      this.queue.shift(); // Drop oldest
    }
    this.queue.push({
      eventName,
      payload: { ...payload },
      timestamp: Date.now(),
      sessionId: this.sessionId,
    });
  }

  async flush(): Promise<void> {
    // In production, this would POST to a sync endpoint
    // For now, just clear the queue
    if (this.queue.length === 0) return;
    console.debug(`[Analytics] Flushing ${this.queue.length} events`);
    this.queue = [];
  }

  getPendingEvents(): TelemetryEvent[] {
    return [...this.queue];
  }
}
