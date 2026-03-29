/**
 * @module domain/samriddhiCycleMachine
 * The Samriddhi Cycle — end-to-end crop-to-cash season simulation.
 *
 * This is the heart of the game. Each season is a deterministic+stochastic
 * state machine that flows through:
 *
 *   Planning → InputFinancing → Sowing → Growing → Harvest →
 *   PostHarvestDecision → Selling → DebtSettlement → Recap
 *
 * Design:
 * - Pure state machine (no side effects, no UI dependencies).
 * - Fully testable — inject the random source.
 * - Each transition returns a new state (immutable updates).
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  CropType,
  FarmerProfile,
  GameEvent,
  RiskEvent,
  SeasonId,
  SeasonPhase,
  SeasonState,
} from './types';
import {
  generateRiskEvents,
  calculateInsurancePremium,
  calculateInsurancePayout,
} from './riskEvents';
import {
  increaseStress,
  decreaseStress,
  applySeasonEndDecay,
} from './stressMeter';

// ─── Crop Data ───────────────────────────────────────────────────────────────

interface CropData {
  /** Base yield in quintals per acre */
  baseYield: number;
  /** Base input cost per acre (₹) */
  inputCostPerAcre: number;
  /** MSP price per quintal (₹) */
  msp: number;
  /** Market price range [min, max] per quintal (₹) */
  marketPriceRange: [number, number];
  /** Sum insured per acre for PMFBY (₹) */
  sumInsuredPerAcre: number;
}

const CROP_DATA: Record<CropType, CropData> = {
  wheat: {
    baseYield: 20,
    inputCostPerAcre: 8000,
    msp: 2275,
    marketPriceRange: [1800, 2800],
    sumInsuredPerAcre: 45000,
  },
  rice: {
    baseYield: 25,
    inputCostPerAcre: 10000,
    msp: 2203,
    marketPriceRange: [1700, 2700],
    sumInsuredPerAcre: 50000,
  },
  cotton: {
    baseYield: 8,
    inputCostPerAcre: 12000,
    msp: 7121,
    marketPriceRange: [5500, 8500],
    sumInsuredPerAcre: 55000,
  },
  soybean: {
    baseYield: 10,
    inputCostPerAcre: 7000,
    msp: 4600,
    marketPriceRange: [3500, 5500],
    sumInsuredPerAcre: 42000,
  },
  maize: {
    baseYield: 22,
    inputCostPerAcre: 6000,
    msp: 2090,
    marketPriceRange: [1600, 2500],
    sumInsuredPerAcre: 38000,
  },
  mustard: {
    baseYield: 8,
    inputCostPerAcre: 6500,
    msp: 5650,
    marketPriceRange: [4500, 6800],
    sumInsuredPerAcre: 40000,
  },
  gram: {
    baseYield: 9,
    inputCostPerAcre: 5500,
    msp: 5440,
    marketPriceRange: [4200, 6500],
    sumInsuredPerAcre: 36000,
  },
};

// ─── Phase Transition Map ────────────────────────────────────────────────────

const PHASE_ORDER: SeasonPhase[] = [
  'Planning',
  'InputFinancing',
  'Sowing',
  'Growing',
  'Harvest',
  'PostHarvestDecision',
  'Selling',
  'DebtSettlement',
  'Recap',
];

/**
 * Gets the next valid phase in the season cycle.
 * Returns null if already at Recap (season complete).
 */
export function getNextPhase(current: SeasonPhase): SeasonPhase | null {
  const idx = PHASE_ORDER.indexOf(current);
  if (idx === -1 || idx === PHASE_ORDER.length - 1) return null;
  return PHASE_ORDER[idx + 1];
}

// ─── Season Factory ──────────────────────────────────────────────────────────

/**
 * Creates a new season state for the given farmer, crop, and region.
 *
 * @param farmer - Current farmer profile
 * @param crop - Chosen crop for this season
 * @param random - Random number generator (inject for testing)
 * @returns New SeasonState at 'Planning' phase
 */
export function createSeason(
  farmer: FarmerProfile,
  crop: CropType,
  random: () => number = Math.random
): { season: SeasonState; events: GameEvent[] } {
  const cropData = CROP_DATA[crop];
  const marketPrice =
    cropData.marketPriceRange[0] +
    random() * (cropData.marketPriceRange[1] - cropData.marketPriceRange[0]);

  const season: SeasonState = {
    id: uuidv4() as SeasonId,
    seasonNumber: farmer.currentSeasonNumber,
    phase: 'Planning',
    crop,
    region: farmer.region,
    expectedYield: cropData.baseYield * farmer.landHolding,
    actualYield: 0,
    inputCost: 0,
    revenue: 0,
    riskEvents: [],
    marketPrice: Math.round(marketPrice),
    mspPrice: cropData.msp,
    weatherCondition: generateInitialWeather(random),
    insurancePremium: 0,
    insurancePayout: 0,
    startedAt: Date.now(),
  };

  const events: GameEvent[] = [
    {
      type: 'SEASON_START',
      payload: {
        seasonId: season.id,
        seasonNumber: season.seasonNumber,
        crop,
        region: farmer.region,
      },
      timestamp: Date.now(),
    },
  ];

  return { season, events };
}

/**
 * Generates initial weather for the season.
 */
function generateInitialWeather(random: () => number): 'normal' | 'dry' | 'wet' | 'extreme' {
  const roll = random();
  if (roll < 0.5) return 'normal';
  if (roll < 0.7) return 'dry';
  if (roll < 0.9) return 'wet';
  return 'extreme';
}

// ─── Phase Transition Logic ─────────────────────────────────────────────────

export interface PhaseTransitionResult {
  /** Updated season state */
  season: SeasonState;
  /** Updated farmer profile */
  farmer: FarmerProfile;
  /** Game events emitted */
  events: GameEvent[];
  /** New risk events (if any) */
  newRiskEvents: RiskEvent[];
  /** Whether the season is complete */
  seasonComplete: boolean;
}

/**
 * Advances the season to the next phase, applying all relevant logic.
 * This is the main game loop function — called when the player confirms/proceeds.
 *
 * @param season - Current season state
 * @param farmer - Current farmer profile
 * @param decisions - Player decisions for this phase transition (varies by phase)
 * @param random - Random number generator
 * @returns PhaseTransitionResult with all updated state
 */
export function advancePhase(
  season: SeasonState,
  farmer: FarmerProfile,
  decisions: PhaseDecisions,
  random: () => number = Math.random
): PhaseTransitionResult {
  const nextPhase = getNextPhase(season.phase);
  if (!nextPhase) {
    return {
      season,
      farmer,
      events: [],
      newRiskEvents: [],
      seasonComplete: true,
    };
  }

  let updatedSeason = { ...season };
  let updatedFarmer = { ...farmer };
  const events: GameEvent[] = [];
  let newRiskEvents: RiskEvent[] = [];

  // ── Apply phase-specific logic ──
  switch (season.phase) {
    case 'Planning':
      // Player has chosen crop — already set. Nothing else happens at transition.
      break;

    case 'InputFinancing': {
      // Calculate and apply input costs
      const cropData = CROP_DATA[season.crop];
      const totalInputCost = cropData.inputCostPerAcre * farmer.landHolding;
      updatedSeason.inputCost = totalInputCost;

      // Handle financing decision
      if (decisions.financingSource === 'kcc') {
        updatedFarmer.kccOutstanding += totalInputCost;
        updatedFarmer.totalDebt += totalInputCost;
      } else if (decisions.financingSource === 'moneylender') {
        updatedFarmer.informalDebt += totalInputCost;
        updatedFarmer.totalDebt += totalInputCost;
      } else {
        // Self-financed
        updatedFarmer.cash -= totalInputCost;
      }

      // Handle insurance enrollment
      if (decisions.enrollInsurance) {
        const premium = calculateInsurancePremium(
          cropData.sumInsuredPerAcre * farmer.landHolding,
          season.crop
        );
        updatedSeason.insurancePremium = premium;
        updatedFarmer.cash -= premium;
        updatedFarmer.insuranceEnrolled = true;
      }
      break;
    }

    case 'Sowing': {
      // Generate sowing-phase risk events
      newRiskEvents = generateRiskEvents(
        'Sowing',
        season.crop,
        season.region,
        season.weatherCondition,
        random
      );
      updatedSeason.riskEvents = [...season.riskEvents, ...newRiskEvents];

      // Apply stress from risk events
      for (const event of newRiskEvents) {
        updatedFarmer.stressLevel = increaseStress(
          updatedFarmer.stressLevel,
          event.type,
          event.severity
        );
        updatedFarmer.cash -= event.financialCost;
      }
      break;
    }

    case 'Growing': {
      // This is the main risk phase
      newRiskEvents = generateRiskEvents(
        'Growing',
        season.crop,
        season.region,
        season.weatherCondition,
        random
      );
      updatedSeason.riskEvents = [...season.riskEvents, ...newRiskEvents];

      // Apply yield impacts
      let yieldMultiplier = 1.0;
      for (const event of newRiskEvents) {
        yieldMultiplier *= event.yieldImpact;
        updatedFarmer.stressLevel = increaseStress(
          updatedFarmer.stressLevel,
          event.type,
          event.severity
        );
        updatedFarmer.cash -= event.financialCost;

        events.push({
          type: 'RISK_EVENT_OCCURRED',
          payload: { eventType: event.type, severity: event.severity },
          timestamp: Date.now(),
        });
      }

      // Update expected yield
      updatedSeason.expectedYield = Math.round(
        season.expectedYield * yieldMultiplier
      );
      break;
    }

    case 'Harvest': {
      // Finalize actual yield (add small random variance ±10%)
      const variance = 0.9 + random() * 0.2;
      updatedSeason.actualYield = Math.round(
        updatedSeason.expectedYield * variance
      );

      // Check for harvest-phase risks
      newRiskEvents = generateRiskEvents(
        'Harvest',
        season.crop,
        season.region,
        season.weatherCondition,
        random
      );

      if (newRiskEvents.length > 0) {
        let lastMinuteMultiplier = 1.0;
        for (const event of newRiskEvents) {
          lastMinuteMultiplier *= event.yieldImpact;
          updatedFarmer.stressLevel = increaseStress(
            updatedFarmer.stressLevel,
            event.type,
            event.severity
          );
        }
        updatedSeason.actualYield = Math.round(
          updatedSeason.actualYield * lastMinuteMultiplier
        );
        updatedSeason.riskEvents = [...season.riskEvents, ...newRiskEvents];
      }

      // Calculate insurance payout if enrolled
      if (farmer.insuranceEnrolled) {
        const cropData = CROP_DATA[season.crop];
        const thresholdYield = cropData.baseYield * farmer.landHolding * 0.7; // 70% of normal is threshold
        const sumInsured = cropData.sumInsuredPerAcre * farmer.landHolding;

        const payout = calculateInsurancePayout(
          updatedSeason.actualYield,
          thresholdYield,
          sumInsured
        );

        if (payout > 0) {
          updatedSeason.insurancePayout = payout;
          updatedFarmer.cash += payout;
          updatedFarmer.stressLevel = decreaseStress(
            updatedFarmer.stressLevel,
            'insurance_payout'
          );

          events.push({
            type: 'INSURANCE_PAYOUT',
            payload: { amount: payout },
            timestamp: Date.now(),
          });
        }
      }

      updatedFarmer.grainInStorage += updatedSeason.actualYield;
      break;
    }

    case 'PostHarvestDecision': {
      // Player decides: sell now, store (eNWR), or mix
      // This is handled by the decisions object
      const sellQuantity = decisions.sellQuantity ?? updatedFarmer.grainInStorage;
      const storeQuantity = decisions.storeQuantity ?? 0;

      if (sellQuantity + storeQuantity > updatedFarmer.grainInStorage) {
        // Invalid — cap it
        // In practice, the UI should prevent this
      }

      // Selling price is market price (negotiation may modify this later)
      break;
    }

    case 'Selling': {
      // Execute the sale
      const sellQty = decisions.sellQuantity ?? updatedFarmer.grainInStorage;
      const salePrice = decisions.negotiatedPrice ?? season.marketPrice;
      const revenue = sellQty * salePrice;

      updatedSeason.revenue = revenue;
      updatedFarmer.cash += revenue;
      updatedFarmer.grainInStorage -= sellQty;
      updatedFarmer.lifetimeEarnings += revenue;

      if (salePrice >= season.mspPrice) {
        updatedFarmer.stressLevel = decreaseStress(
          updatedFarmer.stressLevel,
          'good_sale'
        );
      }

      events.push({
        type: 'CROP_SOLD',
        payload: { quantity: sellQty, price: salePrice, revenue },
        timestamp: Date.now(),
      });
      break;
    }

    case 'DebtSettlement': {
      // Calculate interest and settle debts
      const kccInterestRate = 0.04; // 4% per season (~7% annual, subsidized)
      const informalInterestRate = 0.12; // 12% per season (~24%+ annual)

      const kccInterest = Math.round(
        updatedFarmer.kccOutstanding * kccInterestRate
      );
      const informalInterest = Math.round(
        updatedFarmer.informalDebt * informalInterestRate
      );

      // Auto-repay what we can
      const repayAmount = decisions.debtRepayAmount ?? 0;

      if (repayAmount > 0) {
        // Prioritize KCC repayment (lower interest, build credit history)
        const kccRepay = Math.min(
          repayAmount,
          updatedFarmer.kccOutstanding + kccInterest
        );
        updatedFarmer.kccOutstanding = Math.max(
          0,
          updatedFarmer.kccOutstanding + kccInterest - kccRepay
        );

        const remaining = repayAmount - kccRepay;
        if (remaining > 0) {
          const informalRepay = Math.min(
            remaining,
            updatedFarmer.informalDebt + informalInterest
          );
          updatedFarmer.informalDebt = Math.max(
            0,
            updatedFarmer.informalDebt + informalInterest - informalRepay
          );
        }
      } else {
        // Interest accrues
        updatedFarmer.kccOutstanding += kccInterest;
        updatedFarmer.informalDebt += informalInterest;
      }

      updatedFarmer.totalDebt =
        updatedFarmer.kccOutstanding + updatedFarmer.informalDebt;

      if (updatedFarmer.totalDebt === 0) {
        updatedFarmer.stressLevel = decreaseStress(
          updatedFarmer.stressLevel,
          'debt_cleared'
        );
      }

      events.push({
        type: 'LOAN_REPAID',
        payload: {
          repaid: repayAmount,
          remainingDebt: updatedFarmer.totalDebt,
        },
        timestamp: Date.now(),
      });
      break;
    }

    case 'Recap': {
      // Season is complete — this shouldn't normally be called
      return {
        season: updatedSeason,
        farmer: updatedFarmer,
        events,
        newRiskEvents,
        seasonComplete: true,
      };
    }
  }

  // Advance to next phase
  updatedSeason.phase = nextPhase;

  // If entering Recap, apply season-end logic
  if (nextPhase === 'Recap') {
    const netProfit = updatedSeason.revenue - updatedSeason.inputCost;
    const isPositive = netProfit > 0;
    updatedFarmer.stressLevel = applySeasonEndDecay(
      updatedFarmer.stressLevel,
      isPositive
    );
    updatedFarmer.currentSeasonNumber += 1;
    updatedFarmer.insuranceEnrolled = false;
  }

  events.push({
    type: 'PHASE_ADVANCE',
    payload: {
      from: season.phase,
      to: nextPhase,
      seasonId: season.id,
    },
    timestamp: Date.now(),
  });

  return {
    season: updatedSeason,
    farmer: updatedFarmer,
    events,
    newRiskEvents,
    seasonComplete: nextPhase === 'Recap',
  };
}

// ─── Decision Interface ─────────────────────────────────────────────────────

/**
 * Player decisions for each phase transition.
 * Not all fields are used in every phase.
 */
export interface PhaseDecisions {
  /** How to finance inputs (InputFinancing phase) */
  financingSource?: 'self' | 'kcc' | 'moneylender';
  /** Whether to enroll in crop insurance (InputFinancing phase) */
  enrollInsurance?: boolean;
  /** Quantity to sell immediately (PostHarvestDecision / Selling) */
  sellQuantity?: number;
  /** Quantity to store in warehouse (PostHarvestDecision) */
  storeQuantity?: number;
  /** Price achieved through negotiation (Selling) */
  negotiatedPrice?: number;
  /** Amount to repay on debts (DebtSettlement) */
  debtRepayAmount?: number;
}

// ─── Utilities ───────────────────────────────────────────────────────────────

/**
 * Calculates the season summary for the Recap screen.
 */
export interface SeasonSummary {
  seasonNumber: number;
  crop: CropType;
  totalYield: number;
  totalRevenue: number;
  totalCosts: number;
  netProfit: number;
  riskEventsCount: number;
  insurancePayout: number;
  endingCash: number;
  endingDebt: number;
  endingStress: number;
  performanceRating: 'excellent' | 'good' | 'average' | 'poor' | 'crisis';
}

export function calculateSeasonSummary(
  season: SeasonState,
  farmer: FarmerProfile
): SeasonSummary {
  const totalCosts = season.inputCost + season.insurancePremium;
  const netProfit = season.revenue + season.insurancePayout - totalCosts;

  let performanceRating: SeasonSummary['performanceRating'];
  const profitRatio = totalCosts > 0 ? netProfit / totalCosts : 0;

  if (profitRatio > 0.5) performanceRating = 'excellent';
  else if (profitRatio > 0.2) performanceRating = 'good';
  else if (profitRatio > 0) performanceRating = 'average';
  else if (profitRatio > -0.3) performanceRating = 'poor';
  else performanceRating = 'crisis';

  return {
    seasonNumber: season.seasonNumber,
    crop: season.crop,
    totalYield: season.actualYield,
    totalRevenue: season.revenue,
    totalCosts,
    netProfit,
    riskEventsCount: season.riskEvents.length,
    insurancePayout: season.insurancePayout,
    endingCash: farmer.cash,
    endingDebt: farmer.totalDebt,
    endingStress: farmer.stressLevel,
    performanceRating,
  };
}

/**
 * Gets crop data for display and calculations.
 */
export function getCropData(crop: CropType): CropData {
  return CROP_DATA[crop];
}

/**
 * Gets all available crops.
 */
export function getAvailableCrops(): CropType[] {
  return Object.keys(CROP_DATA) as CropType[];
}
