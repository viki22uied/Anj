/**
 * @module app/gameEngine
 * Central game engine — orchestrates domain logic, persistence, and events.
 */

import type { GameState, FarmerProfile, SeasonState, CropType, GameEvent } from '../domain/types';
import { createFarmerProfile } from '../domain/farmerProfile';
import { createSeason, advancePhase, calculateSeasonSummary } from '../domain/samriddhiCycleMachine';
import type { PhaseDecisions, SeasonSummary } from '../domain/samriddhiCycleMachine';
import type { PersistenceService } from './persistence';
import type { AnalyticsService } from './analytics';
import type { Region } from '../domain/types';

export class GameEngine {
  private state: GameState | null = null;
  private persistence: PersistenceService;
  private analytics: AnalyticsService;
  private listeners: Array<(state: GameState) => void> = [];

  constructor(persistence: PersistenceService, analytics: AnalyticsService) {
    this.persistence = persistence;
    this.analytics = analytics;
  }

  /** Subscribe to state changes */
  subscribe(listener: (state: GameState) => void): () => void {
    this.listeners.push(listener);
    return () => { this.listeners = this.listeners.filter(l => l !== listener); };
  }

  private notify(): void {
    if (this.state) {
      for (const l of this.listeners) l(this.state);
    }
  }

  getState(): GameState | null { return this.state; }

  /** Start a new game */
  async newGame(name: string, region: Region, language: string = 'hi'): Promise<GameState> {
    const farmer = createFarmerProfile(name, region, 2.5, language);
    this.state = {
      farmer,
      currentSeason: null,
      pastSeasons: [],
      loans: [],
      unlockedFeatures: new Set(['basic']),
      pendingTelemetry: [],
      version: 1,
    };
    this.analytics.track('game/new', { region, language });
    await this.save();
    this.notify();
    return this.state;
  }

  /** Load existing game */
  async loadGame(farmerId: string): Promise<GameState | null> {
    this.state = await this.persistence.loadGameState(farmerId);
    if (this.state) {
      this.analytics.track('game/loaded', { farmerId });
      this.notify();
    }
    return this.state;
  }

  /** Start a new season */
  startSeason(crop: CropType): { season: SeasonState; events: GameEvent[] } {
    if (!this.state) throw new Error('No active game');
    const { season, events } = createSeason(this.state.farmer, crop);
    this.state = { ...this.state, currentSeason: season };
    this.analytics.track('season/start', { crop, seasonNumber: season.seasonNumber });
    this.notify();
    return { season, events };
  }

  /** Advance to next phase with player decisions */
  advancePhase(decisions: PhaseDecisions): { season: SeasonState; farmer: FarmerProfile; events: GameEvent[]; seasonComplete: boolean } {
    if (!this.state || !this.state.currentSeason) throw new Error('No active season');
    const result = advancePhase(this.state.currentSeason, this.state.farmer, decisions);
    this.state = {
      ...this.state,
      farmer: result.farmer,
      currentSeason: result.seasonComplete ? null : result.season,
      pastSeasons: result.seasonComplete ? [...this.state.pastSeasons, result.season] : this.state.pastSeasons,
    };
    for (const evt of result.events) {
      this.analytics.track(`game/${evt.type}`, evt.payload);
    }
    this.notify();
    return { season: result.season, farmer: result.farmer, events: result.events, seasonComplete: result.seasonComplete };
  }

  /** Get season summary (for Recap screen) */
  getSeasonSummary(): SeasonSummary | null {
    if (!this.state) return null;
    const season = this.state.pastSeasons[this.state.pastSeasons.length - 1];
    if (!season) return null;
    return calculateSeasonSummary(season, this.state.farmer);
  }

  /** Save current state */
  async save(): Promise<void> {
    if (!this.state) return;
    try {
      await this.persistence.saveGameState(this.state);
      this.analytics.track('game/saved');
    } catch (err) {
      console.error('[GameEngine] Save failed:', err);
    }
  }
}
