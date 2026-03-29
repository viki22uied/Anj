export type Season = 'kharif' | 'rabi' | 'zaid';

export type GamePhase =
  | 'tutorial' | 'season_start' | 'growing' | 'harvest'
  | 'decision' | 'godown' | 'negotiation' | 'season_end';

export type CropType =
  | 'wheat' | 'paddy' | 'cotton' | 'mustard' | 'gram'
  | 'maize' | 'soybean' | 'onion' | 'tomato' | 'sugarcane';

export type IndianState =
  | 'AP' | 'AR' | 'AS' | 'BR' | 'CG' | 'GA' | 'GJ' | 'HR' | 'HP' | 'JH'
  | 'KA' | 'KL' | 'MP' | 'MH' | 'MN' | 'ML' | 'MZ' | 'NL' | 'OD' | 'PB'
  | 'RJ' | 'SK' | 'TN' | 'TS' | 'TR' | 'UP' | 'UK' | 'WB' | 'JK';

export type Language = 'hi' | 'ta' | 'te' | 'bn' | 'mr' | 'gu' | 'kn' | 'pa' | 'or' | 'as' | 'en';
export type EmotionState = 'dread' | 'pressure' | 'hope' | 'relief' | 'regret' | 'neutral';

export type LenderType = 'moneylender' | 'kcc' | 'cooperative' | 'nbfc' | 'enwr_pledge';

export interface DebtItem {
  id: string;
  lender: LenderType;
  amount: number;
  interestRatePA: number;
  dueWeek: number;
  principal?: number;
}

export type EventType =
  | 'flood' | 'drought' | 'pest_attack' | 'hailstorm' | 'price_crash'
  | 'medical_emergency' | 'wedding_expense' | 'school_fees' | 'festival' | 'night_fear'
  | 'moneylender_visit' | 'government_procurement' | 'good_rain' | 'bumper_crop'
  | 'kcc_approved' | 'pmfby_claim_received';

export interface GameEvent {
  id: string;
  type: EventType;
  titleKey: string;
  descKey: string;
  cashImpact: number;
  yieldImpact: number;
  stressImpact: number;
  weekFired: number;
  resolved: boolean;
  requiresInteraction: boolean;
}

export interface Decision {
  id: string;
  week: number;
  type: string;
  action: string;
  amount?: number;
  outcome?: string;
}

export interface FarmerProfile {
  id: string;
  name: string;
  state: IndianState;
  district: string;
  primaryCrop: CropType;
  language: Language;
  landHoldingHectares: number;
  holdingType: 'marginal' | 'small' | 'medium' | 'large';
  hasSmartphone: boolean;
}

export interface Badge {
  id: string;
  nameKey: string;
  unlockedAt: number;
}

export interface GameState {
  // IDENTITY
  seasonNumber: number;
  weekNumber: number;
  currentMonth: number;
  currentYear: number;
  tutorialStep: number;

  // FINANCES
  cashInHand: number;
  totalDebt: number;
  debtBreakdown: DebtItem[];
  weeklyInterestAccrued: number;

  // GRAIN
  grainOnFarmQuintals: number;
  grainInGodownQuintals: number;
  grainQualityScore: number;
  harvestYieldQuintals: number;

  // eNWR
  eNWRActive: boolean;
  eNWRReceiptId: string | null;
  eNWRGrainQuintals: number;
  eNWRIssuedPrice: number;
  eNWRPledgeLoanTaken: number;
  eNWRStorageFeePaidMonths: number;
  eNWRDepositMonth: number;

  // INSURANCE
  pmfbyEnrolled: boolean;
  pmfbyPremiumPaid: number;
  pmfbyCutoffPassed: boolean;
  pmfbyClaimStatus: 'none' | 'pending' | 'received' | 'denied';
  pmfbyClaimAmount: number;
  claimProcessingWeeksRemaining: number;

  // MARKET
  currentMarketPrice: number;
  mspPrice: number;
  priceProjection: number[];
  lastMandiVisit: number;

  // STRESS
  stressLevel: number;
  stressHistory: number[];

  // NPC RELATIONSHIPS
  arhatiRelationship: number;
  moneylenderRelationship: number;
  bankRelationship: number;
  sarpanchRelationship: number;

  // SEASON OUTCOME
  inputCostPaid: number;
  grossRevenue: number;
  netIncome: number;
  samriddhiScore: number;
  reputationScore: number;

  // FLAGS
  hasKCC: boolean;
  kccCreditLimit: number;
  kccUsed: number;
  kccApplicationPending: boolean;
  kccApprovalWeeksRemaining: number;
  
  inputsBought: boolean;
  harvestComplete: boolean;
  seasonEndReached: boolean;
  
  pendingEvents: GameEvent[];
  resolvedEvents: GameEvent[];
  decisions: Decision[];
  badges: Badge[];
  currentEmotion: EmotionState;
}

export interface NegotiationState {
  round: number;
  maxRounds: number;
  farmerOffer: number;
  arhatiOffer: number;
  currentPrice: number;
  mspPrice: number;
  marketPrice: number;
  confidence: number;
  relationship: 'friendly' | 'neutral' | 'hostile';
  currentEmotion: EmotionState;
}
