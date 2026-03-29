/**
 * @module domain/insuranceModule
 * PMFBY-style crop insurance simulation.
 */

import type { CropType, SeasonState } from './types';

interface InsuranceScheme {
  name: string;
  premiumRate: Record<CropType, number>;
  coverageMultiplier: number;
  thresholdYieldPercent: number;
}

const PMFBY: InsuranceScheme = {
  name: 'PMFBY',
  premiumRate: { rice: 0.02, wheat: 0.015, cotton: 0.05, soybean: 0.02, maize: 0.02, mustard: 0.015, gram: 0.015 },
  coverageMultiplier: 1.0,
  thresholdYieldPercent: 0.7,
};

export function calculatePremium(sumInsured: number, crop: CropType): number {
  const rate = PMFBY.premiumRate[crop] ?? 0.02;
  return Math.round(sumInsured * rate);
}

export function calculatePayout(actualYield: number, normalYield: number, sumInsured: number): number {
  const threshold = normalYield * PMFBY.thresholdYieldPercent;
  if (actualYield >= threshold) return 0;
  const shortfall = (threshold - actualYield) / threshold;
  return Math.round(sumInsured * shortfall * PMFBY.coverageMultiplier);
}

export function shouldEnrollInsurance(season: SeasonState, riskTolerance: number): { recommended: boolean; reason: string } {
  const isHighRiskWeather = season.weatherCondition === 'extreme' || season.weatherCondition === 'dry';
  const isHighRiskCrop = ['cotton', 'rice'].includes(season.crop);
  if (isHighRiskWeather || isHighRiskCrop || riskTolerance < 0.3) {
    return { recommended: true, reason: 'insurance.recommend.high_risk' };
  }
  return { recommended: false, reason: 'insurance.recommend.low_risk' };
}

/** Show insurance value over multiple seasons (pedagogical tool) */
export function simulateInsuranceValue(seasons: number, random: () => number = Math.random): { withInsurance: number[]; withoutInsurance: number[] } {
  const withIns: number[] = [];
  const withoutIns: number[] = [];
  let cashWith = 50000;
  let cashWithout = 50000;
  for (let s = 0; s < seasons; s++) {
    const premium = 2000;
    const yieldLoss = random() < 0.25;
    const lossAmount = yieldLoss ? 15000 + Math.round(random() * 15000) : 0;
    const payout = yieldLoss ? Math.round(lossAmount * 0.7) : 0;
    cashWith = cashWith - premium - lossAmount + payout + 20000;
    cashWithout = cashWithout - lossAmount + 20000;
    withIns.push(cashWith);
    withoutIns.push(cashWithout);
  }
  return { withInsurance: withIns, withoutInsurance: withoutIns };
}
