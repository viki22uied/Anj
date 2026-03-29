import type { LenderType } from '../types/game.types';

export const CREDIT_RATES: Record<LenderType, {
  annualRate: number;
  description: string;
  processingDays: number;
  collateral: string;
}> = {
  moneylender: { annualRate: 36, description: 'Sahukaar — instant but expensive. 3–5% per month.', processingDays: 0, collateral: 'Social threat, land as informal pledge' },
  kcc:         { annualRate: 4,  description: 'Kisan Credit Card — 4% with on-time repayment.', processingDays: 7, collateral: 'Land records / hypothecation of crop' },
  cooperative: { annualRate: 9,  description: 'PACS cooperative loan — moderate rate, group guarantee.', processingDays: 5, collateral: 'Group guarantee' },
  nbfc:        { annualRate: 22, description: 'Microfinance / NBFC — flexible 18–26% p.a.', processingDays: 2, collateral: 'None (unsecured)' },
  enwr_pledge:    { annualRate: 7,  description: 'eNWR warehouse receipt pledge loan at 7-9%.', processingDays: 2, collateral: 'eNWR Receipt' },
};
