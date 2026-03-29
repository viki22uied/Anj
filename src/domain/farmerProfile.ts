/**
 * @module domain/farmerProfile
 * Farmer profile creation and management.
 * Pure functions for creating and updating farmer profiles.
 */

import { v4 as uuidv4 } from 'uuid';
import type { FarmerId, FarmerProfile, Region } from './types';

/**
 * Creates a new farmer profile with sensible defaults for the target demographic.
 * Default values represent a small/marginal Indian farmer.
 *
 * @param name - Farmer's name
 * @param region - Geographic region
 * @param landHolding - Land in acres (default: 2.5 — avg marginal farmer)
 * @param language - Preferred language (default: 'hi' for Hindi)
 * @returns New FarmerProfile
 */
export function createFarmerProfile(
  name: string,
  region: Region,
  landHolding: number = 2.5,
  language: string = 'hi'
): FarmerProfile {
  return {
    id: uuidv4() as FarmerId,
    name,
    region,
    landHolding,
    cash: 25000, // Starting cash: ₹25,000
    grainInStorage: 0,
    totalDebt: 0,
    kccLimit: 50000, // Initial KCC limit: ₹50,000
    kccOutstanding: 0,
    informalDebt: 0,
    currentSeasonNumber: 1,
    lifetimeEarnings: 0,
    stressLevel: 15, // Start with slight baseline stress
    activeENWRs: [],
    insuranceEnrolled: false,
    language,
  };
}

/**
 * Validates that a farmer profile is in a consistent state.
 * Used for save/load integrity checks.
 */
export function validateFarmerProfile(
  farmer: FarmerProfile
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!farmer.id) errors.push('Missing farmer ID');
  if (!farmer.name || farmer.name.trim().length === 0)
    errors.push('Name is required');
  if (farmer.landHolding <= 0) errors.push('Land holding must be positive');
  if (farmer.stressLevel < 0 || farmer.stressLevel > 100)
    errors.push('Stress level out of range');
  if (farmer.totalDebt !== farmer.kccOutstanding + farmer.informalDebt)
    errors.push('Debt totals inconsistent');
  if (farmer.currentSeasonNumber < 1) errors.push('Invalid season number');

  return { valid: errors.length === 0, errors };
}

/**
 * Updates KCC limit based on repayment history (credit score improvement).
 * After each season of timely repayment, limit increases by 10%.
 */
export function updateKCCLimit(
  farmer: FarmerProfile,
  repaidOnTime: boolean
): FarmerProfile {
  if (!repaidOnTime) return farmer;

  const newLimit = Math.round(farmer.kccLimit * 1.1);
  return { ...farmer, kccLimit: Math.min(newLimit, 300000) }; // Cap at ₹3L
}

/**
 * Serializes a farmer profile for storage (handles Set → Array conversion etc.)
 */
export function serializeFarmerProfile(
  farmer: FarmerProfile
): Record<string, unknown> {
  return {
    ...farmer,
    activeENWRs: [...farmer.activeENWRs],
  };
}

/**
 * Deserializes a farmer profile from storage.
 */
export function deserializeFarmerProfile(
  data: Record<string, unknown>
): FarmerProfile {
  return {
    ...(data as unknown as FarmerProfile),
    activeENWRs: Array.isArray(data.activeENWRs)
      ? data.activeENWRs
      : [],
  };
}
