import type { IndianState } from './game.types';

export interface CropData {
  id: string;
  nameKey: string;
  season: string;
  sowingMonths: number[];
  harvestMonths: number[];
  states: IndianState[];
  baseYield: number;
  yieldVariance: number;
  baseMSP: number;
  baseMarketPrice: number;
  peakSeasonalPrice: number;
  inputCostPerHectare: number;
  storageRisk: 'low' | 'medium' | 'high' | 'very_high';
  pests: string[];
  disasters: string[];
  warehouseEligible: boolean;
  minimumWarehouseLot: number;
  gradeFactors: GradeFactor[];
}

export interface GradeFactor {
  name: string;
  maxAllowed: string;
  failureConsequence: string;
}
