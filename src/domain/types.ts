/**
 * @module domain/types
 * Core domain types for the Anaj-Arth simulation engine.
 * All monetary values are in INR (₹). Quantities are in quintals (100 kg).
 */

// ─── Branded ID types ────────────────────────────────────────────────────────

export type FarmerId = string & { readonly __brand: 'FarmerId' };
export type SeasonId = string & { readonly __brand: 'SeasonId' };
export type ENWRId = string & { readonly __brand: 'ENWRId' };

// ─── Crop & Region ───────────────────────────────────────────────────────────

export type CropType =
  | 'wheat'
  | 'rice'
  | 'cotton'
  | 'soybean'
  | 'maize'
  | 'mustard'
  | 'gram';

export type Region =
  | 'madhya_pradesh'
  | 'maharashtra'
  | 'punjab'
  | 'rajasthan'
  | 'uttar_pradesh'
  | 'karnataka';

// ─── Farmer Profile ──────────────────────────────────────────────────────────

/** Persistent farmer profile across seasons */
export interface FarmerProfile {
  readonly id: FarmerId;
  name: string;
  region: Region;
  landHolding: number; // in acres
  /** Current cash balance in ₹ */
  cash: number;
  /** Grain in storage (quintals) */
  grainInStorage: number;
  /** Total outstanding debt (₹) */
  totalDebt: number;
  /** KCC credit limit (₹) */
  kccLimit: number;
  /** KCC outstanding (₹) */
  kccOutstanding: number;
  /** Informal debt (₹) */
  informalDebt: number;
  /** Season count (1-indexed) */
  currentSeasonNumber: number;
  /** Cumulative earnings across all seasons */
  lifetimeEarnings: number;
  /** Current stress level 0–100 */
  stressLevel: number;
  /** Active eNWR receipts */
  activeENWRs: ENWRReceipt[];
  /** Insurance enrolled this season? */
  insuranceEnrolled: boolean;
  /** Preferred language code (ISO 639-1) */
  language: string;
}

// ─── Season ──────────────────────────────────────────────────────────────────

export type SeasonPhase =
  | 'Planning'
  | 'InputFinancing'
  | 'Sowing'
  | 'Growing'
  | 'Harvest'
  | 'PostHarvestDecision'
  | 'Selling'
  | 'DebtSettlement'
  | 'Recap';

export interface SeasonState {
  readonly id: SeasonId;
  readonly seasonNumber: number;
  phase: SeasonPhase;
  crop: CropType;
  region: Region;
  /** Expected yield in quintals, adjusted by events */
  expectedYield: number;
  /** Actual yield after harvest */
  actualYield: number;
  /** Cost of inputs for this season */
  inputCost: number;
  /** Revenue from sales this season */
  revenue: number;
  /** Risk events that occurred */
  riskEvents: RiskEvent[];
  /** Current market price per quintal */
  marketPrice: number;
  /** MSP for the crop */
  mspPrice: number;
  /** Weather condition affecting growth */
  weatherCondition: WeatherCondition;
  /** Insurance premium paid */
  insurancePremium: number;
  /** Insurance payout received */
  insurancePayout: number;
  /** Timestamp of season start */
  startedAt: number;
}

// ─── Risk Events ─────────────────────────────────────────────────────────────

export type RiskEventType =
  | 'drought'
  | 'flood'
  | 'hailstorm'
  | 'pest_attack'
  | 'unseasonal_rain'
  | 'price_crash'
  | 'family_emergency'
  | 'festival_expense';

export type WeatherCondition = 'normal' | 'dry' | 'wet' | 'extreme';

export interface RiskEvent {
  type: RiskEventType;
  severity: number; // 0–1 scale
  /** Yield impact multiplier (e.g., 0.7 means 30% loss) */
  yieldImpact: number;
  /** Stress impact (absolute increase) */
  stressImpact: number;
  /** Financial cost (direct, e.g., family emergency) */
  financialCost: number;
  /** Description key for i18n */
  descriptionKey: string;
}

// ─── eNWR (Electronic Negotiable Warehouse Receipt) ──────────────────────────

export type WarehouseType = 'registered' | 'unregistered';
export type GradeLevel = 'A' | 'B' | 'C';
export type ENWRStatus = 'active' | 'pledged' | 'released' | 'expired';

export interface ENWRReceipt {
  readonly id: ENWRId;
  quantity: number; // quintals
  grade: GradeLevel;
  warehouseType: WarehouseType;
  status: ENWRStatus;
  /** Value at time of deposit (₹/quintal) */
  depositPrice: number;
  /** Current market price at time of last update */
  currentPrice: number;
  /** Loan amount taken against this eNWR */
  loanAmount: number;
  /** Interest rate on loan (annual %) */
  loanInterestRate: number;
  /** Monthly storage cost (₹) */
  storageCostPerMonth: number;
  /** Months stored so far */
  monthsStored: number;
  /** Maximum storage duration (months) */
  maxStorageDuration: number;
  /** Created timestamp */
  createdAt: number;
  /** Expiry timestamp */
  expiresAt: number;
}

// ─── Negotiation ─────────────────────────────────────────────────────────────

export type ArhatiyaTactic =
  | 'quality_downgrade'
  | 'market_is_down'
  | 'you_owe_me'
  | 'delay_threat'
  | 'bulk_discount'
  | 'cash_now';

export type FarmerCounterMove =
  | 'quote_msp'
  | 'alternative_mandi'
  | 'show_enam'
  | 'walk_away'
  | 'use_enwr'
  | 'accept'
  | 'counter_offer';

export interface DialogueNode {
  readonly id: string;
  speaker: 'arhatiya' | 'farmer' | 'narrator';
  /** i18n key for the text */
  textKey: string;
  /** Tactic or move being used */
  tactic?: ArhatiyaTactic | FarmerCounterMove;
  /** Available player choices (empty = NPC turn or narration) */
  choices: DialogueChoice[];
  /** Price modifier applied at this node (multiplier on current offer) */
  priceModifier: number;
  /** Stress impact at this node */
  stressModifier: number;
}

export interface DialogueChoice {
  readonly id: string;
  /** i18n key for the choice text */
  textKey: string;
  move: FarmerCounterMove;
  /** ID of the next dialogue node */
  nextNodeId: string;
  /** Voice intent keywords for ASR matching */
  voiceIntents: string[];
}

// ─── Credit ──────────────────────────────────────────────────────────────────

export type CreditSource = 'kcc' | 'moneylender' | 'nbfc';

export interface CreditOption {
  source: CreditSource;
  /** Amount available to borrow */
  availableAmount: number;
  /** Annual interest rate (%) */
  interestRate: number;
  /** Processing time (in-game days) */
  processingDays: number;
  /** Social penalty on default (stress increase) */
  defaultPenalty: number;
  /** Description key for i18n */
  descriptionKey: string;
}

export interface Loan {
  source: CreditSource;
  principal: number;
  interestRate: number;
  outstanding: number;
  seasonsActive: number;
  /** Has the borrower defaulted? */
  defaulted: boolean;
}

// ─── Game State ──────────────────────────────────────────────────────────────

export interface GameState {
  farmer: FarmerProfile;
  currentSeason: SeasonState | null;
  pastSeasons: SeasonState[];
  loans: Loan[];
  /** Feature flags for progressive unlocking */
  unlockedFeatures: Set<string>;
  /** Telemetry event queue (flushed on sync) */
  pendingTelemetry: TelemetryEvent[];
  /** Game version for migration */
  version: number;
}

// ─── Telemetry ───────────────────────────────────────────────────────────────

export interface TelemetryEvent {
  eventName: string;
  payload: Record<string, unknown>;
  timestamp: number;
  sessionId: string;
}

// ─── Feature Flags ───────────────────────────────────────────────────────────

export interface FeatureFlags {
  enwrAdvanced: boolean;
  negotiationVoice: boolean;
  multiSeasonCredit: boolean;
  insuranceShield: boolean;
  stressRecovery: boolean;
}

// ─── Game Events (command pattern) ───────────────────────────────────────────

export type GameEventType =
  | 'SEASON_START'
  | 'PHASE_ADVANCE'
  | 'RISK_EVENT_OCCURRED'
  | 'CROP_SOLD'
  | 'ENWR_CREATED'
  | 'ENWR_PLEDGED'
  | 'ENWR_RELEASED'
  | 'LOAN_TAKEN'
  | 'LOAN_REPAID'
  | 'INSURANCE_ENROLLED'
  | 'INSURANCE_PAYOUT'
  | 'NEGOTIATION_COMPLETE'
  | 'STRESS_CHANGED'
  | 'GAME_SAVED'
  | 'GAME_LOADED';

export interface GameEvent {
  type: GameEventType;
  payload: Record<string, unknown>;
  timestamp: number;
}
