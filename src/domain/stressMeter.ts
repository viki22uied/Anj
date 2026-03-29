/**
 * @module domain/stressMeter
 * Pure functional module for managing farmer stress levels (0–100).
 *
 * Stress affects:
 * - Decision time available (higher stress = less time)
 * - Information visibility (higher stress = some future info hidden)
 * - Negotiation outcomes (higher stress = worse deals)
 *
 * Design: All functions are pure — they take current state and return new state.
 */

import type { RiskEventType } from './types';

// ─── Constants ───────────────────────────────────────────────────────────────

export const STRESS_MIN = 0;
export const STRESS_MAX = 100;

/** Threshold levels for gameplay effects */
export const STRESS_THRESHOLDS = {
  /** Below this: full decision time, all info visible */
  LOW: 25,
  /** Above this: reduced decision time */
  MODERATE: 50,
  /** Above this: some info hidden, negotiation penalties */
  HIGH: 75,
  /** Above this: severe penalties, crisis mode */
  CRITICAL: 90,
} as const;

// ─── Stress Impact Definitions ───────────────────────────────────────────────

/**
 * Base stress increase per event type.
 * These are starting values tuned through playtesting.
 */
const STRESS_IMPACTS: Record<string, number> = {
  // Risk events
  drought: 20,
  flood: 25,
  hailstorm: 15,
  pest_attack: 12,
  unseasonal_rain: 10,
  price_crash: 18,
  family_emergency: 22,
  festival_expense: 8,

  // Financial stressors
  debt_call: 15,
  loan_default: 30,
  low_cash: 10,
  kcc_rejection: 12,

  // Gameplay stressors
  bad_negotiation: 10,
  warehouse_loss: 15,
  missed_msp: 8,
} as const;

/**
 * Recovery amounts for positive events.
 */
const RECOVERY_IMPACTS: Record<string, number> = {
  good_sale: -10,
  insurance_payout: -15,
  debt_cleared: -20,
  community_support: -8,
  good_harvest: -12,
  kcc_approved: -10,
  enwr_profit: -15,
  season_end_positive: -5,
} as const;

// ─── Pure Functions ──────────────────────────────────────────────────────────

/**
 * Clamps stress to valid range [0, 100].
 */
function clampStress(value: number): number {
  return Math.max(STRESS_MIN, Math.min(STRESS_MAX, Math.round(value)));
}

/**
 * Increases stress based on a risk event type and severity.
 *
 * @param currentStress - Current stress level (0–100)
 * @param eventType - Type of risk/financial event
 * @param severity - Event severity multiplier (0–1, default 1.0)
 * @returns New stress level
 *
 * @example
 * ```ts
 * const newStress = increaseStress(30, 'drought', 0.8);
 * // 30 + (20 * 0.8) = 46
 * ```
 */
export function increaseStress(
  currentStress: number,
  eventType: RiskEventType | string,
  severity: number = 1.0
): number {
  const baseImpact = STRESS_IMPACTS[eventType] ?? 10;
  const scaledImpact = baseImpact * Math.max(0, Math.min(1, severity));

  // Stress is harder to increase when already high (diminishing returns)
  const diminishingFactor = 1 - (currentStress / STRESS_MAX) * 0.3;

  return clampStress(currentStress + scaledImpact * diminishingFactor);
}

/**
 * Decreases stress based on a positive event (recovery mechanic).
 *
 * @param currentStress - Current stress level (0–100)
 * @param recoveryType - Type of positive event
 * @returns New stress level
 */
export function decreaseStress(
  currentStress: number,
  recoveryType: string
): number {
  const recovery = RECOVERY_IMPACTS[recoveryType] ?? -5;
  return clampStress(currentStress + recovery); // recovery values are negative
}

/**
 * Applies passive stress decay at end of season.
 * Stress naturally decreases slightly between seasons.
 *
 * @param currentStress - Current stress level
 * @param seasonOutcomePositive - Was the season outcome positive overall?
 * @returns New stress level
 */
export function applySeasonEndDecay(
  currentStress: number,
  seasonOutcomePositive: boolean
): number {
  const baseDecay = seasonOutcomePositive ? 10 : 3;
  return clampStress(currentStress - baseDecay);
}

/**
 * Gets the current stress tier for UI and game mechanic purposes.
 */
export function getStressTier(
  stressLevel: number
): 'low' | 'moderate' | 'high' | 'critical' {
  if (stressLevel >= STRESS_THRESHOLDS.CRITICAL) return 'critical';
  if (stressLevel >= STRESS_THRESHOLDS.HIGH) return 'high';
  if (stressLevel >= STRESS_THRESHOLDS.MODERATE) return 'moderate';
  return 'low';
}

/**
 * Computes gameplay effects based on current stress level.
 * Used by UI and game engine to modify behavior.
 */
export interface StressEffects {
  /** Multiplier for decision time (1.0 = normal, 0.5 = half time) */
  decisionTimeMultiplier: number;
  /** Whether future price info is hidden */
  hideFutureInfo: boolean;
  /** Negotiation skill penalty (0 = none, negative = worse deals) */
  negotiationModifier: number;
  /** UI intensity tier for visual effects */
  tier: 'low' | 'moderate' | 'high' | 'critical';
  /** Stress color for UI */
  color: string;
}

/**
 * Computes the gameplay effects of the current stress level.
 *
 * @param stressLevel - Current stress (0–100)
 * @returns StressEffects object with all modifiers
 */
export function computeStressEffects(stressLevel: number): StressEffects {
  const tier = getStressTier(stressLevel);

  switch (tier) {
    case 'low':
      return {
        decisionTimeMultiplier: 1.0,
        hideFutureInfo: false,
        negotiationModifier: 0,
        tier,
        color: '#22c55e', // green
      };
    case 'moderate':
      return {
        decisionTimeMultiplier: 0.8,
        hideFutureInfo: false,
        negotiationModifier: -0.05,
        tier,
        color: '#eab308', // yellow
      };
    case 'high':
      return {
        decisionTimeMultiplier: 0.6,
        hideFutureInfo: true,
        negotiationModifier: -0.15,
        tier,
        color: '#f97316', // orange
      };
    case 'critical':
      return {
        decisionTimeMultiplier: 0.4,
        hideFutureInfo: true,
        negotiationModifier: -0.25,
        tier,
        color: '#ef4444', // red
      };
  }
}

/**
 * Calculates compound stress from multiple simultaneous events.
 * Events happening together amplify each other slightly.
 *
 * @param currentStress - Current stress level
 * @param events - Array of [eventType, severity] tuples
 * @returns New stress level after all events
 */
export function applyMultipleStressors(
  currentStress: number,
  events: Array<[string, number]>
): number {
  let stress = currentStress;
  const amplification = 1 + (events.length - 1) * 0.1; // 10% extra per additional event

  for (const [eventType, severity] of events) {
    const baseImpact = STRESS_IMPACTS[eventType] ?? 10;
    const scaledImpact =
      baseImpact * Math.max(0, Math.min(1, severity)) * amplification;
    const diminishingFactor = 1 - (stress / STRESS_MAX) * 0.3;
    stress = clampStress(stress + scaledImpact * diminishingFactor);
  }

  return stress;
}
