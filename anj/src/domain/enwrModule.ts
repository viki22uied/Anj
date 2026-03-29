/**
 * @module domain/enwrModule
 * Electronic Negotiable Warehouse Receipt (eNWR) module.
 *
 * Simulates the full eNWR lifecycle:
 * 1. Deposit grain → choose warehouse type
 * 2. Grading assessment → A/B/C quality
 * 3. Issue eNWR → digital receipt
 * 4. Optionally pledge eNWR for bank loan
 * 5. Time passes → price evolves
 * 6. Repay loan → release eNWR → sell at better price
 *
 * All functions are pure. No side effects.
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  ENWRId,
  ENWRReceipt,
  ENWRStatus,
  FarmerProfile,
  GradeLevel,
  WarehouseType,
} from './types';

// ─── Constants ───────────────────────────────────────────────────────────────

/** Storage costs per quintal per month (₹) */
const STORAGE_COSTS: Record<WarehouseType, number> = {
  registered: 50,
  unregistered: 30,
};

/** Loan-to-value ratio by grade */
const LTV_RATIOS: Record<GradeLevel, number> = {
  A: 0.75,
  B: 0.65,
  C: 0.50,
};

/** Bank interest rate for pledge loans (annual %) */
const PLEDGE_LOAN_RATE = 0.09; // 9% p.a.

/** Max storage duration in months */
const MAX_STORAGE_MONTHS: Record<WarehouseType, number> = {
  registered: 12,
  unregistered: 6,
};

/** Premium for registered warehouse (better grain preservation) */
const REGISTERED_QUALITY_BONUS = 1.02; // 2% price premium

// ─── Grading ─────────────────────────────────────────────────────────────────

/**
 * Grading mini-game result: determines eNWR grade based on player performance.
 * In the actual game, this would be driven by a mini-game UI.
 *
 * @param playerScore - Score from grading mini-game (0–100)
 * @returns Grade level
 */
export function determineGrade(playerScore: number): GradeLevel {
  if (playerScore >= 80) return 'A';
  if (playerScore >= 50) return 'B';
  return 'C';
}

/**
 * Price modifier based on grade quality.
 */
export function getGradePriceModifier(grade: GradeLevel): number {
  switch (grade) {
    case 'A':
      return 1.10; // 10% premium
    case 'B':
      return 1.0; // base price
    case 'C':
      return 0.88; // 12% discount
  }
}

// ─── eNWR Lifecycle ──────────────────────────────────────────────────────────

/**
 * Creates a new eNWR receipt by depositing grain into a warehouse.
 *
 * @param quantity - Quintals to deposit
 * @param currentPrice - Current market price per quintal
 * @param warehouseType - Registered or unregistered warehouse
 * @param grade - Quality grade from grading assessment
 * @returns New eNWR receipt and updated farmer grain
 */
export function createENWR(
  quantity: number,
  currentPrice: number,
  warehouseType: WarehouseType,
  grade: GradeLevel
): ENWRReceipt {
  const maxDuration = MAX_STORAGE_MONTHS[warehouseType];
  const now = Date.now();

  return {
    id: uuidv4() as ENWRId,
    quantity,
    grade,
    warehouseType,
    status: 'active' as ENWRStatus,
    depositPrice: currentPrice,
    currentPrice,
    loanAmount: 0,
    loanInterestRate: 0,
    storageCostPerMonth: STORAGE_COSTS[warehouseType] * quantity,
    monthsStored: 0,
    maxStorageDuration: maxDuration,
    createdAt: now,
    expiresAt: now + maxDuration * 30 * 24 * 60 * 60 * 1000,
  };
}

/**
 * Deposits grain and creates an eNWR, updating farmer state.
 *
 * @param farmer - Current farmer profile
 * @param quantity - Quintals to store
 * @param currentPrice - Market price at deposit
 * @param warehouseType - Type of warehouse
 * @param grade - Quality grade
 * @returns Updated farmer profile with new eNWR
 */
export function depositGrain(
  farmer: FarmerProfile,
  quantity: number,
  currentPrice: number,
  warehouseType: WarehouseType,
  grade: GradeLevel
): { farmer: FarmerProfile; enwr: ENWRReceipt } | { error: string } {
  if (quantity <= 0) return { error: 'Quantity must be positive' };
  if (quantity > farmer.grainInStorage)
    return { error: 'Insufficient grain in storage' };

  const enwr = createENWR(quantity, currentPrice, warehouseType, grade);

  const updatedFarmer: FarmerProfile = {
    ...farmer,
    grainInStorage: farmer.grainInStorage - quantity,
    activeENWRs: [...farmer.activeENWRs, enwr],
  };

  return { farmer: updatedFarmer, enwr };
}

/**
 * Pledges an eNWR to get a bank loan.
 *
 * @param farmer - Current farmer profile
 * @param enwrId - ID of the eNWR to pledge
 * @returns Updated farmer with loan credited, or error
 */
export function pledgeENWR(
  farmer: FarmerProfile,
  enwrId: ENWRId
): { farmer: FarmerProfile; loanAmount: number } | { error: string } {
  const enwrIdx = farmer.activeENWRs.findIndex((e) => e.id === enwrId);
  if (enwrIdx === -1) return { error: 'eNWR not found' };

  const enwr = farmer.activeENWRs[enwrIdx];
  if (enwr.status !== 'active')
    return { error: 'eNWR must be active to pledge' };

  const gradeValue = enwr.currentPrice * getGradePriceModifier(enwr.grade);
  const loanAmount = Math.round(
    enwr.quantity * gradeValue * LTV_RATIOS[enwr.grade]
  );

  const updatedENWR: ENWRReceipt = {
    ...enwr,
    status: 'pledged',
    loanAmount,
    loanInterestRate: PLEDGE_LOAN_RATE,
  };

  const updatedENWRs = [...farmer.activeENWRs];
  updatedENWRs[enwrIdx] = updatedENWR;

  const updatedFarmer: FarmerProfile = {
    ...farmer,
    cash: farmer.cash + loanAmount,
    kccOutstanding: farmer.kccOutstanding + loanAmount,
    totalDebt: farmer.totalDebt + loanAmount,
    activeENWRs: updatedENWRs,
  };

  return { farmer: updatedFarmer, loanAmount };
}

/**
 * Releases a pledged eNWR by repaying the loan.
 *
 * @param farmer - Current farmer profile
 * @param enwrId - ID of the eNWR to release
 * @returns Updated farmer with loan repaid and eNWR released
 */
export function releaseENWR(
  farmer: FarmerProfile,
  enwrId: ENWRId
): { farmer: FarmerProfile } | { error: string } {
  const enwrIdx = farmer.activeENWRs.findIndex((e) => e.id === enwrId);
  if (enwrIdx === -1) return { error: 'eNWR not found' };

  const enwr = farmer.activeENWRs[enwrIdx];
  if (enwr.status !== 'pledged')
    return { error: 'eNWR must be pledged to release' };

  // Calculate total repayment (principal + interest for months stored)
  const monthlyRate = enwr.loanInterestRate / 12;
  const interest = Math.round(
    enwr.loanAmount * monthlyRate * enwr.monthsStored
  );
  const totalRepayment = enwr.loanAmount + interest;

  if (farmer.cash < totalRepayment)
    return { error: 'Insufficient cash to repay loan' };

  const updatedENWR: ENWRReceipt = {
    ...enwr,
    status: 'released',
    loanAmount: 0,
  };

  const updatedENWRs = [...farmer.activeENWRs];
  updatedENWRs[enwrIdx] = updatedENWR;

  const updatedFarmer: FarmerProfile = {
    ...farmer,
    cash: farmer.cash - totalRepayment,
    kccOutstanding: Math.max(0, farmer.kccOutstanding - enwr.loanAmount),
    totalDebt: Math.max(0, farmer.totalDebt - enwr.loanAmount),
    grainInStorage: farmer.grainInStorage + enwr.quantity,
    activeENWRs: updatedENWRs,
  };

  return { farmer: updatedFarmer };
}

/**
 * Simulates price evolution over stored months.
 * Prices can go up (reward for waiting) or down (risk of storage).
 *
 * @param basePrice - Price at deposit time
 * @param months - Months of storage
 * @param warehouseType - Type affects quality preservation
 * @param random - Random number generator
 * @returns New market price per quintal
 */
export function evolvePrice(
  basePrice: number,
  months: number,
  warehouseType: WarehouseType,
  random: () => number = Math.random
): number {
  // Base trend: prices tend to increase 2-5% per month post-harvest
  const trendPerMonth = 0.02 + random() * 0.03;
  // Volatility: ±3% random walk per month
  let price = basePrice;

  for (let m = 0; m < months; m++) {
    const noise = (random() - 0.5) * 0.06; // ±3%
    price *= 1 + trendPerMonth + noise;
  }

  // Registered warehouse preserves quality better
  if (warehouseType === 'registered') {
    price *= REGISTERED_QUALITY_BONUS;
  }

  return Math.round(price);
}

/**
 * Calculates total storage cost for an eNWR.
 */
export function calculateStorageCost(enwr: ENWRReceipt): number {
  return enwr.storageCostPerMonth * enwr.monthsStored;
}

/**
 * Calculates potential profit from selling stored grain now vs at deposit time.
 */
export function calculateENWRProfit(enwr: ENWRReceipt): {
  storageCost: number;
  loanInterest: number;
  priceGain: number;
  netProfit: number;
} {
  const storageCost = calculateStorageCost(enwr);
  const monthlyRate = enwr.loanInterestRate / 12;
  const loanInterest = Math.round(
    enwr.loanAmount * monthlyRate * enwr.monthsStored
  );
  const priceModifier = getGradePriceModifier(enwr.grade);
  const priceGain = Math.round(
    (enwr.currentPrice * priceModifier - enwr.depositPrice) * enwr.quantity
  );
  const netProfit = priceGain - storageCost - loanInterest;

  return { storageCost, loanInterest, priceGain, netProfit };
}
