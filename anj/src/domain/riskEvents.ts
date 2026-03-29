/**
 * @module domain/riskEvents
 * Risk event generation and probability engine.
 *
 * Design principles:
 * - Per-crop, per-region probability tables (extensible via data files later).
 * - Deterministic when seeded (for testing).
 * - Pure functions — no side effects.
 */

import type {
  CropType,
  Region,
  RiskEvent,
  RiskEventType,
  SeasonPhase,
  WeatherCondition,
} from './types';

// ─── Probability Tables ──────────────────────────────────────────────────────

/**
 * Base probability of each risk event type per phase.
 * Probabilities are 0–1 (before crop/region modifiers).
 */
const BASE_PROBABILITIES: Record<
  RiskEventType,
  Partial<Record<SeasonPhase, number>>
> = {
  drought: { Growing: 0.15, Harvest: 0.05 },
  flood: { Growing: 0.1, Harvest: 0.08 },
  hailstorm: { Growing: 0.05, Harvest: 0.1 },
  pest_attack: { Growing: 0.2, Harvest: 0.1 },
  unseasonal_rain: { Sowing: 0.1, Harvest: 0.12 },
  price_crash: { Selling: 0.15, PostHarvestDecision: 0.1 },
  family_emergency: {
    Planning: 0.05,
    Growing: 0.05,
    Harvest: 0.05,
    Selling: 0.05,
  },
  festival_expense: { Planning: 0.15, Growing: 0.1 },
};

/**
 * Region modifiers — multiply base probability.
 * > 1 = more likely, < 1 = less likely
 */
const REGION_MODIFIERS: Partial<
  Record<Region, Partial<Record<RiskEventType, number>>>
> = {
  rajasthan: { drought: 1.8, flood: 0.3, hailstorm: 0.5 },
  punjab: { flood: 1.5, drought: 0.5, pest_attack: 0.8 },
  maharashtra: { drought: 1.3, unseasonal_rain: 1.4 },
  madhya_pradesh: { hailstorm: 1.4, pest_attack: 1.2 },
  uttar_pradesh: { flood: 1.3, pest_attack: 1.3 },
  karnataka: { drought: 1.2, pest_attack: 1.1 },
};

/**
 * Crop vulnerability modifiers — multiply base probability.
 */
const CROP_MODIFIERS: Partial<
  Record<CropType, Partial<Record<RiskEventType, number>>>
> = {
  cotton: { pest_attack: 1.5, drought: 1.2 },
  rice: { flood: 1.4, drought: 0.7 },
  wheat: { hailstorm: 1.3, unseasonal_rain: 1.2 },
  soybean: { unseasonal_rain: 1.3, pest_attack: 1.2 },
  maize: { drought: 1.1, pest_attack: 1.3 },
  mustard: { hailstorm: 1.2, unseasonal_rain: 1.3 },
  gram: { drought: 0.8, pest_attack: 1.1 },
};

// ─── Impact Definitions ─────────────────────────────────────────────────────

interface RiskEventTemplate {
  type: RiskEventType;
  /** Min yield impact (worst case) */
  minYieldImpact: number;
  /** Max yield impact (best case) */
  maxYieldImpact: number;
  baseStressImpact: number;
  baseFinancialCost: number;
  descriptionKey: string;
}

const EVENT_TEMPLATES: Record<RiskEventType, RiskEventTemplate> = {
  drought: {
    type: 'drought',
    minYieldImpact: 0.3,
    maxYieldImpact: 0.7,
    baseStressImpact: 20,
    baseFinancialCost: 0,
    descriptionKey: 'risk.drought',
  },
  flood: {
    type: 'flood',
    minYieldImpact: 0.2,
    maxYieldImpact: 0.6,
    baseStressImpact: 25,
    baseFinancialCost: 5000,
    descriptionKey: 'risk.flood',
  },
  hailstorm: {
    type: 'hailstorm',
    minYieldImpact: 0.4,
    maxYieldImpact: 0.8,
    baseStressImpact: 15,
    baseFinancialCost: 2000,
    descriptionKey: 'risk.hailstorm',
  },
  pest_attack: {
    type: 'pest_attack',
    minYieldImpact: 0.5,
    maxYieldImpact: 0.85,
    baseStressImpact: 12,
    baseFinancialCost: 3000,
    descriptionKey: 'risk.pest_attack',
  },
  unseasonal_rain: {
    type: 'unseasonal_rain',
    minYieldImpact: 0.6,
    maxYieldImpact: 0.9,
    baseStressImpact: 10,
    baseFinancialCost: 1000,
    descriptionKey: 'risk.unseasonal_rain',
  },
  price_crash: {
    type: 'price_crash',
    minYieldImpact: 1.0, // no yield impact
    maxYieldImpact: 1.0,
    baseStressImpact: 18,
    baseFinancialCost: 0,
    descriptionKey: 'risk.price_crash',
  },
  family_emergency: {
    type: 'family_emergency',
    minYieldImpact: 1.0,
    maxYieldImpact: 1.0,
    baseStressImpact: 22,
    baseFinancialCost: 15000,
    descriptionKey: 'risk.family_emergency',
  },
  festival_expense: {
    type: 'festival_expense',
    minYieldImpact: 1.0,
    maxYieldImpact: 1.0,
    baseStressImpact: 8,
    baseFinancialCost: 5000,
    descriptionKey: 'risk.festival_expense',
  },
};

// ─── Seeded PRNG ─────────────────────────────────────────────────────────────

/**
 * Simple seeded pseudo-random number generator (mulberry32).
 * Used so risk events are deterministic given the same seed.
 */
export function createPRNG(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─── Risk Event Generation ──────────────────────────────────────────────────

/**
 * Generates risk events for a given phase based on crop, region, and randomness.
 *
 * @param phase - Current season phase
 * @param crop - Selected crop type
 * @param region - Farm region
 * @param weather - Current weather condition
 * @param random - Random number generator (0–1), defaults to Math.random
 * @returns Array of risk events that occurred
 */
export function generateRiskEvents(
  phase: SeasonPhase,
  crop: CropType,
  region: Region,
  weather: WeatherCondition,
  random: () => number = Math.random
): RiskEvent[] {
  const events: RiskEvent[] = [];

  const riskTypes = Object.keys(BASE_PROBABILITIES) as RiskEventType[];

  for (const riskType of riskTypes) {
    const baseProbMap = BASE_PROBABILITIES[riskType];
    const baseProb = baseProbMap[phase] ?? 0;

    if (baseProb === 0) continue;

    // Apply region modifier
    const regionMod = REGION_MODIFIERS[region]?.[riskType] ?? 1.0;

    // Apply crop modifier
    const cropModMap = CROP_MODIFIERS[crop] as
      | Record<string, number>
      | undefined;
    const cropMod = cropModMap?.[riskType] ?? 1.0;

    // Apply weather modifier
    const weatherMod = getWeatherModifier(weather, riskType);

    const finalProb = Math.min(
      0.6,
      baseProb * regionMod * cropMod * weatherMod
    );

    const roll = random();

    if (roll < finalProb) {
      const template = EVENT_TEMPLATES[riskType];
      const severity = random(); // 0–1

      const yieldImpact =
        template.minYieldImpact +
        (template.maxYieldImpact - template.minYieldImpact) * (1 - severity);

      events.push({
        type: riskType,
        severity,
        yieldImpact,
        stressImpact: template.baseStressImpact * (0.5 + severity * 0.5),
        financialCost: Math.round(
          template.baseFinancialCost * (0.5 + severity * 0.5)
        ),
        descriptionKey: template.descriptionKey,
      });
    }
  }

  return events;
}

/**
 * Weather condition modifies risk probabilities.
 */
function getWeatherModifier(
  weather: WeatherCondition,
  riskType: RiskEventType
): number {
  switch (weather) {
    case 'dry':
      if (riskType === 'drought') return 2.0;
      if (riskType === 'flood') return 0.2;
      return 1.0;
    case 'wet':
      if (riskType === 'flood') return 2.0;
      if (riskType === 'unseasonal_rain') return 1.5;
      if (riskType === 'drought') return 0.2;
      return 1.0;
    case 'extreme':
      if (
        riskType === 'hailstorm' ||
        riskType === 'flood' ||
        riskType === 'drought'
      )
        return 1.8;
      return 1.3;
    default:
      return 1.0;
  }
}

/**
 * Calculates insurance payout for PMFBY-style area-based yield index.
 *
 * @param actualYield - Actual yield (quintals/acre)
 * @param thresholdYield - Guaranteed yield threshold
 * @param sumInsured - Sum insured amount
 * @returns Payout amount in ₹ (0 if yield >= threshold)
 */
export function calculateInsurancePayout(
  actualYield: number,
  thresholdYield: number,
  sumInsured: number
): number {
  if (actualYield >= thresholdYield) return 0;

  const shortfall = (thresholdYield - actualYield) / thresholdYield;
  // PMFBY pays proportional to shortfall
  return Math.round(sumInsured * shortfall);
}

/**
 * Calculates PMFBY premium based on crop type.
 * Real PMFBY premiums: Kharif 2%, Rabi 1.5%, Commercial 5%.
 */
export function calculateInsurancePremium(
  sumInsured: number,
  crop: CropType
): number {
  const premiumRates: Record<CropType, number> = {
    rice: 0.02, // Kharif
    cotton: 0.05, // Commercial
    soybean: 0.02,
    maize: 0.02,
    wheat: 0.015, // Rabi
    mustard: 0.015,
    gram: 0.015,
  };

  const rate = premiumRates[crop] ?? 0.02;
  return Math.round(sumInsured * rate);
}
