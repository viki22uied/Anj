/**
 * @module app/persistence
 * Abstract persistence interface + PouchDB implementation.
 */

import type { GameState, FarmerProfile, SeasonState, Loan } from '../domain/types';

export interface PersistenceService {
  saveGameState(state: GameState): Promise<void>;
  loadGameState(farmerId: string): Promise<GameState | null>;
  saveProfile(profile: FarmerProfile): Promise<void>;
  loadProfile(farmerId: string): Promise<FarmerProfile | null>;
  listProfiles(): Promise<FarmerProfile[]>;
  deleteProfile(farmerId: string): Promise<void>;
}

/** Serializable version of GameState (Sets → Arrays) */
interface SerializableGameState {
  _id: string;
  _rev?: string;
  type: 'gameState';
  farmer: FarmerProfile;
  currentSeason: SeasonState | null;
  pastSeasons: SeasonState[];
  loans: Loan[];
  unlockedFeatures: string[];
  version: number;
  updatedAt: number;
}

interface PouchDoc {
  _id: string;
  _rev?: string;
  [key: string]: unknown;
}

interface PouchAllDocsRow {
  doc?: PouchDoc;
}

interface PouchAllDocsResult {
  rows: PouchAllDocsRow[];
}

interface PouchDBInstance {
  get(id: string): Promise<PouchDoc>;
  put(doc: unknown): Promise<unknown>;
  remove(doc: PouchDoc): Promise<unknown>;
  allDocs(options: { include_docs: boolean; startkey: string; endkey: string }): Promise<PouchAllDocsResult>;
}

export class PouchDBPersistence implements PersistenceService {
  private db: PouchDBInstance;

  constructor(dbName: string = 'anaj-arth') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const PouchDB = (globalThis as any).PouchDB || (() => {
      // For environments without global PouchDB, we import dynamically
      return null;
    })();

    if (PouchDB) {
      this.db = new PouchDB(dbName) as PouchDBInstance;
    } else {
      // Fallback: in-memory stub (will be replaced with proper import)
      this.db = createInMemoryDB();
    }
  }

  async saveGameState(state: GameState): Promise<void> {
    const doc: SerializableGameState = {
      _id: `game_${state.farmer.id}`,
      type: 'gameState',
      farmer: state.farmer,
      currentSeason: state.currentSeason,
      pastSeasons: state.pastSeasons,
      loans: state.loans,
      unlockedFeatures: Array.from(state.unlockedFeatures),
      version: state.version,
      updatedAt: Date.now(),
    };

    try {
      const existing = await this.db.get(doc._id).catch(() => null);
      if (existing) {
        doc._rev = existing._rev;
      }
      await this.db.put(doc);
    } catch (err) {
      console.error('[PouchDB] Failed to save game state:', err);
      throw err;
    }
  }

  async loadGameState(farmerId: string): Promise<GameState | null> {
    try {
      const doc = await this.db.get(`game_${farmerId}`) as unknown as SerializableGameState;
      return {
        farmer: doc.farmer,
        currentSeason: doc.currentSeason,
        pastSeasons: doc.pastSeasons,
        loans: doc.loans,
        unlockedFeatures: new Set(doc.unlockedFeatures),
        pendingTelemetry: [],
        version: doc.version,
      };
    } catch {
      return null;
    }
  }

  async saveProfile(profile: FarmerProfile): Promise<void> {
    const doc: PouchDoc = { _id: `profile_${profile.id}`, type: 'profile', ...profile };
    try {
      const existing = await this.db.get(doc._id).catch(() => null);
      if (existing) { doc._rev = existing._rev; }
      await this.db.put(doc);
    } catch (err) {
      console.error('[PouchDB] Failed to save profile:', err);
      throw err;
    }
  }

  async loadProfile(farmerId: string): Promise<FarmerProfile | null> {
    try {
      const doc = await this.db.get(`profile_${farmerId}`);
      const { _id: _a, _rev: _b, type: _c, ...profile } = doc;
      return profile as unknown as FarmerProfile;
    } catch {
      return null;
    }
  }

  async listProfiles(): Promise<FarmerProfile[]> {
    try {
      const result = await this.db.allDocs({ include_docs: true, startkey: 'profile_', endkey: 'profile_\uffff' });
      return result.rows.filter((r) => r.doc).map(row => {
        const { _id: _a, _rev: _b, type: _c, ...profile } = row.doc as PouchDoc;
        return profile as unknown as FarmerProfile;
      });
    } catch {
      return [];
    }
  }

  async deleteProfile(farmerId: string): Promise<void> {
    try {
      const doc = await this.db.get(`profile_${farmerId}`);
      await this.db.remove(doc);
      const gameDoc = await this.db.get(`game_${farmerId}`).catch(() => null);
      if (gameDoc) await this.db.remove(gameDoc);
    } catch (err) {
      console.error('[PouchDB] Failed to delete:', err);
    }
  }
}

/** In-memory database for when PouchDB isn't available */
function createInMemoryDB(): PouchDBInstance {
  const store = new Map<string, PouchDoc>();
  return {
    async get(id: string): Promise<PouchDoc> {
      const doc = store.get(id);
      if (!doc) throw new Error('not_found');
      return { ...doc };
    },
    async put(doc: unknown): Promise<unknown> {
      const d = doc as PouchDoc;
      const rev = `${Date.now()}`;
      store.set(d._id, { ...d, _rev: rev });
      return { ok: true, id: d._id, rev };
    },
    async remove(doc: PouchDoc): Promise<unknown> {
      store.delete(doc._id);
      return { ok: true };
    },
    async allDocs(options: { include_docs: boolean; startkey: string; endkey: string }): Promise<PouchAllDocsResult> {
      const rows: PouchAllDocsRow[] = [];
      for (const [key, val] of store.entries()) {
        if (key >= options.startkey && key <= options.endkey) {
          rows.push({ doc: options.include_docs ? { ...val } : undefined });
        }
      }
      return { rows };
    },
  };
}
