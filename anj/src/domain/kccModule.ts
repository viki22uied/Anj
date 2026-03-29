/**
 * @module domain/kccModule
 * Credit Choice Engine — KCC vs informal lending.
 */

import type { CreditSource, CreditOption, Loan } from './types';

const CREDIT_PARAMS: Record<CreditSource, {
  annualRate: number;
  seasonalRate: number;
  processingDays: number;
  defaultPenalty: number;
  descriptionKey: string;
}> = {
  kcc: { annualRate: 0.07, seasonalRate: 0.035, processingDays: 7, defaultPenalty: 15, descriptionKey: 'credit.kcc' },
  moneylender: { annualRate: 0.36, seasonalRate: 0.18, processingDays: 0, defaultPenalty: 30, descriptionKey: 'credit.moneylender' },
  nbfc: { annualRate: 0.18, seasonalRate: 0.09, processingDays: 3, defaultPenalty: 20, descriptionKey: 'credit.nbfc' },
};

export function getAvailableCreditOptions(kccLimit: number, kccOutstanding: number, seasonNumber: number): CreditOption[] {
  const options: CreditOption[] = [];
  const kccAvailable = Math.max(0, kccLimit - kccOutstanding);
  if (kccAvailable > 0) {
    options.push({ source: 'kcc', availableAmount: kccAvailable, interestRate: CREDIT_PARAMS.kcc.annualRate, processingDays: 7, defaultPenalty: 15, descriptionKey: 'credit.kcc' });
  }
  options.push({ source: 'moneylender', availableAmount: 200000, interestRate: CREDIT_PARAMS.moneylender.annualRate, processingDays: 0, defaultPenalty: 30, descriptionKey: 'credit.moneylender' });
  if (seasonNumber >= 2) {
    options.push({ source: 'nbfc', availableAmount: 100000, interestRate: CREDIT_PARAMS.nbfc.annualRate, processingDays: 3, defaultPenalty: 20, descriptionKey: 'credit.nbfc' });
  }
  return options;
}

export function createLoan(source: CreditSource, principal: number): Loan {
  return { source, principal, interestRate: CREDIT_PARAMS[source].annualRate, outstanding: principal, seasonsActive: 0, defaulted: false };
}

export function calculateSeasonalInterest(loan: Loan): number {
  return Math.round(loan.outstanding * CREDIT_PARAMS[loan.source].seasonalRate);
}

export function accrueInterest(loan: Loan): Loan {
  const interest = calculateSeasonalInterest(loan);
  return { ...loan, outstanding: loan.outstanding + interest, seasonsActive: loan.seasonsActive + 1 };
}

export function makePayment(loan: Loan, amount: number): { loan: Loan; remainingPayment: number; fullyPaid: boolean } {
  const payment = Math.min(amount, loan.outstanding);
  return { loan: { ...loan, outstanding: loan.outstanding - payment, defaulted: false }, remainingPayment: amount - payment, fullyPaid: loan.outstanding - payment === 0 };
}

export interface SeasonProjection { season: number; outstanding: number; interestPaid: number; cumulativeInterest: number; }

export function projectDebtTrajectory(principal: number, source: CreditSource, seasons: number): SeasonProjection[] {
  const projections: SeasonProjection[] = [];
  let outstanding = principal;
  let cumulative = 0;
  const rate = CREDIT_PARAMS[source].seasonalRate;
  for (let s = 1; s <= seasons; s++) {
    const interest = Math.round(outstanding * rate);
    cumulative += interest;
    outstanding += interest;
    projections.push({ season: s, outstanding, interestPaid: interest, cumulativeInterest: cumulative });
  }
  return projections;
}

export function compareDebtTrajectories(principal: number, seasons: number = 5): Record<CreditSource, SeasonProjection[]> {
  return { kcc: projectDebtTrajectory(principal, 'kcc', seasons), moneylender: projectDebtTrajectory(principal, 'moneylender', seasons), nbfc: projectDebtTrajectory(principal, 'nbfc', seasons) };
}
