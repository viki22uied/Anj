import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { GameState, FarmerProfile, NegotiationState, DebtItem, LenderType, Decision, EmotionState } from '../types/game.types';
import { CROP_BASE_DATA } from '../data/crops';
import { generateStochasticEvents } from '../utils/eventGenerator';

const generateId = () => Math.random().toString(36).substr(2, 9);

interface GameStore {
  gameState: GameState | null;
  farmer: FarmerProfile | null;
  profile: FarmerProfile | null; // Alias for farmer
  negotiation: NegotiationState | null;
  seasonHistory: Array<GameState & { usedKCC?: boolean; usedMoneylender?: boolean; usedENWR?: boolean; distressSold?: boolean; enrolledPMFBY?: boolean; invokedMSP?: boolean; netIncome?: number; kccInterestPaid?: number; pmfbyClaimReceived?: number }>;
  
  initGame: (farmer: FarmerProfile, cash: number, debtAmt: number, lender: LenderType) => void;
  resetGame: () => void;
  tick: () => void;
  startNextSeason: () => void;
  updateProfile: (updates: Partial<FarmerProfile>) => void;

  // Actions
  takeLoan: (lender: LenderType, amount: number) => void;
  repayLoan: (debtId: string, amount: number) => void;
  repayAllKCC: () => void;
  applyKCC: () => void;
  claimKCC: () => void;

  buyInputs: (cost: number, yieldMod: number, qualityMod: number) => void;
  enrollPMFBY: (premium: number) => void;
  fileInsuranceClaim: () => void;
  collectInsuranceClaim: () => void;

  decideHarvestOption: (option: 'sell' | 'store' | 'wait', qty?: number) => void;
  startNegotiation: () => void;
  processNegotiationAction: (action: string, customAmount?: number) => void;
  sellGrainNow: (quantity: number, price: number) => void;
  
  decideStoreGodown: (quantity: number, registrationFee: number) => void;
  pledgeGodown: (amount: number) => void;
  sellFromGodown: (quantity: number) => void;
  
  resolveCrisisEvent: (eventId: string, resolutionType: string, cost?: number) => void;
  recordDecision: (type: string, action: string, amount?: number) => void;

  // Setters
  setGameState: (updates: Partial<GameState>) => void;
}

const calculateYield = (baseYield: number, land: number, inputsMult: number, weatherMult: number, pestMult: number) => {
  const jitter = 0.95 + Math.random() * 0.1;
  return Math.round(baseYield * land * inputsMult * weatherMult * pestMult * jitter);
};

const syncDerivedStats = (s: GameState) => {
  s.totalDebt = s.debtBreakdown.reduce((sum, d) => sum + d.amount, 0);
  s.kccUsed = s.debtBreakdown.filter(d => d.lender === 'kcc').reduce((sum, d) => sum + d.amount, 0);
  return s;
};

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      gameState: null,
      farmer: null,
      profile: null, // Alias for farmer
      negotiation: null,
      seasonHistory: [],

      initGame: (farmer: FarmerProfile, startingCash: number, startingDebt: number, lender: LenderType) => {
        const crop = CROP_BASE_DATA[farmer.primaryCrop];
        const startMonth = crop?.sowingMonths[0] ?? 6;
        
        let initialDebt: DebtItem[] = [];
        if (startingDebt > 0) {
          initialDebt.push({
            id: generateId(),
            lender,
            amount: startingDebt,
            interestRatePA: lender === 'moneylender' ? 48 : lender === 'kcc' ? 4 : 9,
            dueWeek: 24
          });
        }

        const state: GameState = {
          seasonNumber: 1,
          weekNumber: 1,
          currentMonth: startMonth,
          currentYear: new Date().getFullYear(),
          tutorialStep: 0,
          
          cashInHand: startingCash,
          totalDebt: startingDebt,
          debtBreakdown: initialDebt,
          weeklyInterestAccrued: 0,
          
          grainOnFarmQuintals: 0,
          grainInGodownQuintals: 0,
          grainQualityScore: 50,
          harvestYieldQuintals: 0,
          
          eNWRActive: false,
          eNWRReceiptId: null,
          eNWRGrainQuintals: 0,
          eNWRIssuedPrice: 0,
          eNWRPledgeLoanTaken: 0,
          eNWRStorageFeePaidMonths: 0,
          eNWRDepositMonth: 0,
          
          pmfbyEnrolled: false,
          pmfbyPremiumPaid: 0,
          pmfbyCutoffPassed: false,
          pmfbyClaimStatus: 'none',
          pmfbyClaimAmount: 0,
          claimProcessingWeeksRemaining: 0,
          
          currentMarketPrice: crop?.baseMarketPrice ?? 2000,
          mspPrice: crop?.baseMSP ?? Math.round((crop?.baseMarketPrice ?? 2000) * 0.9),
          priceProjection: [],
          lastMandiVisit: 0,
          
          stressLevel: 20,
          stressHistory: [20],
          
          arhatiRelationship: 0,
          moneylenderRelationship: 0,
          bankRelationship: 0,
          sarpanchRelationship: 0,

          inputCostPaid: 0,
          grossRevenue: 0,
          netIncome: 0,
          samriddhiScore: 0,
          reputationScore: 50,

          hasKCC: lender === 'kcc',
          kccCreditLimit: lender === 'kcc' ? (startingDebt > 0 ? startingDebt * 1.5 : 50000) : 0,
          kccUsed: lender === 'kcc' ? startingDebt : 0,
          kccApplicationPending: false,
          kccApprovalWeeksRemaining: 0,
          
          inputsBought: false,
          harvestComplete: false,
          seasonEndReached: false,
          
          pendingEvents: [],
          resolvedEvents: [],
          decisions: [],
          badges: [],
          currentEmotion: 'neutral'
        };
        
        set({ farmer, profile: farmer, gameState: state });
      },

      resetGame: () => set({ gameState: null, farmer: null, profile: null, negotiation: null, seasonHistory: [] }),
      
      updateProfile: (updates) => {
        set((state) => ({
          farmer: state.farmer ? { ...state.farmer, ...updates } : null,
          profile: state.profile ? { ...state.profile, ...updates } : null,
        }));
      },

      setGameState: (updates) => {
        set(state => ({ gameState: state.gameState ? { ...state.gameState, ...updates } : null }));
      },

      recordDecision: (type, action, amount) => {
        const { gameState } = get();
        if (!gameState) return;
        const d: Decision = { id: generateId(), week: gameState.weekNumber, type, action, amount };
        set({ gameState: { ...gameState, decisions: [...gameState.decisions, d] }});
      },

      tick: () => {
        const { gameState, farmer } = get();
        if (!gameState || !farmer) return;
        let s = { ...gameState };
        
        // 1. Time Advance
        s.weekNumber += 1;
        if (s.weekNumber % 4 === 1 && s.weekNumber > 1) {
          s.currentMonth = (s.currentMonth % 12) + 1;
          if (s.currentMonth === 1) s.currentYear++;
        }

        // 2. Interest Accrual (Strict PRD Formula: KCC = Simple, Moneylender = Compound)
        let totalInterestThisWeek = 0;
        s.debtBreakdown = s.debtBreakdown.map(debt => {
          let interest = 0;
          if (debt.lender === 'moneylender' || debt.lender === 'nbfc') {
             // Precise Weekly Compounding Equivalent for brutal moneylender loop
             const compoundRate = Math.pow(1 + debt.interestRatePA / 100, 1/52) - 1;
             interest = Math.ceil(debt.amount * compoundRate);
          } else {
             // Precise Simple Interest for KCC / Cooperative based on principal
             const p = debt.principal || debt.amount;
             const simpleRate = debt.interestRatePA / 100 / 52;
             interest = Math.ceil(p * simpleRate);
          }
          totalInterestThisWeek += interest;
          return { ...debt, amount: debt.amount + interest };
        });
        syncDerivedStats(s);
        s.weeklyInterestAccrued = totalInterestThisWeek;

        // 3. Status updates (Insurance Cutoff, harvest milestone check, KCC)
        if (s.weekNumber === 4 && !s.pmfbyEnrolled) {
          s.pmfbyCutoffPassed = true;
        }

        if (s.kccApplicationPending) {
          s.kccApprovalWeeksRemaining -= 1;
        }

        if (s.pmfbyClaimStatus === 'pending') {
          s.claimProcessingWeeksRemaining -= 1;
          if (s.claimProcessingWeeksRemaining <= 0) {
            s.pmfbyClaimStatus = 'received';
          }
        }

        // 4. Update Price Projections & Current Price
        // Simulated exponential recovery + noise
        const crop = CROP_BASE_DATA[farmer.primaryCrop];
        if (crop) {
          const H = crop.harvestMonths[0] ?? Math.abs(s.currentMonth - 1);
          const dist = Math.min(Math.abs(s.currentMonth - H), 12 - Math.abs(s.currentMonth - H));
          const recoveryF = 1 - Math.exp(-dist / 3);
          const rawPrice = crop.baseMarketPrice + (crop.peakSeasonalPrice - crop.baseMarketPrice) * recoveryF;
          s.currentMarketPrice = Math.round(rawPrice * (0.92 + Math.random() * 0.16));
        }

        // 4.5. Stochastic Events
        const newEvents = generateStochasticEvents(s, farmer);
        s.pendingEvents = [...s.pendingEvents, ...newEvents];

        // 5. Stress Calculation Re-evaluation
        let stress = 20;
        stress += (s.totalDebt / Math.max(s.cashInHand + 10000, 1)) * 20;
        if (s.grainOnFarmQuintals > 0 && !s.pmfbyEnrolled) stress += 8;
        stress += s.cashInHand < 5000 ? 20 : s.cashInHand < 15000 ? 10 : 0;
        stress += s.pendingEvents.length * 12;
        if (s.eNWRActive) stress -= 12;
        if (s.pmfbyEnrolled) stress -= 8;
        if (s.cashInHand > 50000) stress -= 10;
        if (s.bankRelationship > 50) stress -= 5;
        
        s.stressLevel = Math.min(100, Math.max(0, Math.round(stress)));
        s.stressHistory = [...s.stressHistory, s.stressLevel].slice(-24); // Keep a season's track max

        // Determine current emotion (PRD 1.1)
        let newEmotion: EmotionState = 'neutral';
        const hasBadEvent = s.pendingEvents.some(e => ['flood', 'drought', 'pest_attack', 'price_crash', 'moneylender_visit'].includes(e.type));
        const hasFinancialCrisis = s.cashInHand < 3000 || s.totalDebt > 40000;

        if (hasBadEvent || s.stressLevel > 75 || hasFinancialCrisis) {
          newEmotion = 'dread';
        } else if (s.pendingEvents.length > 1 || (s.currentMarketPrice < s.mspPrice && s.weekNumber > 18)) {
          newEmotion = 'pressure';
        } else if (s.kccApplicationPending || s.pmfbyEnrolled || s.eNWRActive) {
          newEmotion = 'hope';
        }

        s.currentEmotion = newEmotion;

        // End of Season logic
        if (s.weekNumber >= 24) {
          s.seasonEndReached = true;
        }

        set({ gameState: s });
      },

      takeLoan: (lender: LenderType, amount: number) => {
        const { gameState } = get();
        if (!gameState) return;
        const rates: Record<LenderType, number> = { moneylender: 48, kcc: 4, cooperative: 9, nbfc: 22, enwr_pledge: 7 };
        const debtId = generateId();
        const dueWeekOffsets: Record<LenderType, number> = { moneylender: 8, kcc: 24, cooperative: 20, nbfc: 16, enwr_pledge: 12 };
        
        let s = { ...gameState };
        s.cashInHand += amount;
        s.totalDebt += amount;
        
        if (lender === 'kcc') s.kccUsed += amount;

        s.debtBreakdown = [...s.debtBreakdown, {
          id: debtId,
          lender,
          amount,
          interestRatePA: rates[lender],
          dueWeek: s.weekNumber + dueWeekOffsets[lender],
          principal: amount
        }];
        
        syncDerivedStats(s);
        
        if (lender === 'moneylender') {
          s.stressLevel = Math.min(100, s.stressLevel + 15);
          s.moneylenderRelationship += 5;
        } else if (lender === 'kcc') {
          s.stressLevel = Math.max(0, s.stressLevel - 2);
          s.bankRelationship += 3;
        }
        
        set({ gameState: s });
        get().recordDecision('loan', lender, amount);
      },

      repayLoan: (debtId: string, amount: number) => {
        const { gameState } = get();
        if (!gameState) return;
        let s = { ...gameState };
        
        const debt = s.debtBreakdown.find(d => d.id === debtId);
        if (!debt) return;
        
        // Ensure we don't pay more than the debt or more than we have
        const actualPayment = Math.min(debt.amount, amount, s.cashInHand);
        if (actualPayment <= 0) return;

        s.cashInHand -= actualPayment;
        
        s.debtBreakdown = s.debtBreakdown.map(d => 
          d.id === debtId ? { ...d, amount: d.amount - actualPayment } : d
        ).filter(d => d.amount > 0);
        
        syncDerivedStats(s);

        if (debt.lender === 'kcc') {
          s.kccUsed = Math.max(0, s.kccUsed - actualPayment);
          s.bankRelationship += 2;
        } else if (debt.lender === 'moneylender') {
          s.stressLevel = Math.max(0, s.stressLevel - 4);
          s.moneylenderRelationship += 3;
        }
        
        if (!s.debtBreakdown.find(d => d.id === debtId)) {
           // Fully paid
           s.stressLevel = Math.max(0, s.stressLevel - 10);
           s.reputationScore += 5;
           if (typeof navigator !== 'undefined' && navigator.vibrate) {
             navigator.vibrate(400); // Long smooth pulse for relief
           }
        }
        
        set({ gameState: s });
        get().recordDecision('repay_loan', debt.lender, actualPayment);
      },

      repayAllKCC: () => {
        const { gameState } = get();
        if (!gameState) return;
        
        const kccDebts = gameState.debtBreakdown.filter(d => d.lender === 'kcc');
        const sum = kccDebts.reduce((a, b) => a + b.amount, 0);
        if (gameState.cashInHand < sum) return;
        
        let s = { ...gameState };
        s.cashInHand -= sum;
        s.debtBreakdown = s.debtBreakdown.filter(d => d.lender !== 'kcc');
        s.totalDebt -= sum;
        s.kccUsed = 0;
        s.bankRelationship += 10;
        s.stressLevel = Math.max(0, s.stressLevel - 10);
        
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate(400);
        }

        set({ gameState: s });
        get().recordDecision('repay_all_kcc', 'kcc', sum);
      },

      applyKCC: () => {
        const { gameState } = get();
        if (!gameState || gameState.hasKCC || gameState.kccApplicationPending) return;
        
        set({ gameState: {
          ...gameState,
          kccApplicationPending: true,
          kccApprovalWeeksRemaining: 4
        }});
        get().recordDecision('apply_kcc', 'kcc', 0);
      },

      claimKCC: () => {
        const { gameState, farmer } = get();
        if (!gameState || !farmer) return;
        set({ gameState: {
          ...gameState,
          hasKCC: true,
          kccCreditLimit: farmer.landHoldingHectares * 30000 + 20000,
          kccUsed: 0,
          kccApplicationPending: false,
          bankRelationship: gameState.bankRelationship + 15,
          stressLevel: Math.max(0, gameState.stressLevel - 10)
        }});
        get().recordDecision('claim_kcc', 'kcc', gameState.kccCreditLimit);
      },

      buyInputs: (cost, yieldMod, qualityMod) => {
        const { gameState } = get();
        if (!gameState) return;
        if (gameState.cashInHand < cost) return;

        set({ gameState: {
          ...gameState,
          cashInHand: gameState.cashInHand - cost,
          inputCostPaid: gameState.inputCostPaid + cost,
          grainQualityScore: gameState.grainQualityScore + qualityMod,
          harvestYieldQuintals: gameState.harvestYieldQuintals * yieldMod, // Store temporary multiplier
          inputsBought: true
        }});
        get().recordDecision('inputs', 'purchase', cost);
      },

      enrollPMFBY: (premium) => {
        const { gameState } = get();
        if (!gameState) return;
        if (gameState.cashInHand < premium) return;

        set({ gameState: {
          ...gameState,
          cashInHand: gameState.cashInHand - premium,
          pmfbyEnrolled: true,
          pmfbyPremiumPaid: premium,
          stressLevel: Math.max(0, gameState.stressLevel - 8)
        }});
        get().recordDecision('insurance', 'pmfby', premium);
      },

      fileInsuranceClaim: () => {
        const { gameState } = get();
        if (!gameState) return;
        set({ gameState: {
          ...gameState,
          pmfbyClaimStatus: 'pending',
          claimProcessingWeeksRemaining: Math.floor(8 + Math.random() * 8)
        }});
        get().recordDecision('insurance', 'file_claim');
      },

      collectInsuranceClaim: () => {
        const { gameState } = get();
        if (!gameState || gameState.pmfbyClaimStatus !== 'received') return;
        set({ gameState: {
          ...gameState,
          cashInHand: gameState.cashInHand + gameState.pmfbyClaimAmount,
          pmfbyClaimStatus: 'none',
          stressLevel: Math.max(0, gameState.stressLevel - 20)
        }});
        get().recordDecision('insurance', 'collect_claim', gameState.pmfbyClaimAmount);
      },

      decideHarvestOption: (option) => {
        const { gameState, farmer } = get();
        if (!gameState || !farmer) return;
        // The Harvest is finalized at week 20 typically
        let s = { ...gameState };
        s.harvestComplete = true;
        
        let baseYield = CROP_BASE_DATA[farmer.primaryCrop]?.baseYield ?? 30;
        let actualYield = calculateYield(baseYield, farmer.landHoldingHectares, s.harvestYieldQuintals === 0 ? 1 : s.harvestYieldQuintals, 1.0, 1.0);
        s.grainOnFarmQuintals = actualYield;

        if (option === 'wait') {
          s.weekNumber += 4;
        }
        
        set({ gameState: s });
        get().recordDecision('harvest_choice', option);
      },

      startNegotiation: () => {
        const { gameState, farmer } = get();
        if (!gameState || !farmer) return;
        const crop = CROP_BASE_DATA[farmer.primaryCrop];
        const msp = crop?.baseMSP ?? 2000;
        const market = gameState.currentMarketPrice;
        const discount = 0.85; // Strict PRD `quality_downgrade` starting state
        
        set({ negotiation: {
          round: 1,
          maxRounds: 5,
          farmerOffer: market,
          arhatiOffer: Math.round(market * discount),
          currentPrice: Math.round(market * discount),
          mspPrice: msp,
          marketPrice: market,
          confidence: 50,
          relationship: 'neutral',
          currentEmotion: market < msp ? 'pressure' : 'neutral'
        }});
      },

      processNegotiationAction: (action, customAmt) => {
        const { negotiation, gameState } = get();
        if (!negotiation || !gameState) return;
        
        let n = { ...negotiation };
        n.round += 1;
        
        if (action === 'invoke_msp') {
          // PRD: quote_msp -> market_down -> priceModifier=0.88, stress=8
          n.arhatiOffer = Math.round(n.marketPrice * 0.88);
          n.confidence += 5;
          get().setGameState({ stressLevel: Math.min(100, gameState.stressLevel + 8) });
        } 
        else if (action === 'show_enwr') {
          // PRD: show_enam/use_enwr -> concede -> priceModifier=1.0, stress=-5
          n.arhatiOffer = Math.round(n.marketPrice * 1.0);
          n.confidence += 20;
          get().setGameState({ stressLevel: Math.max(0, gameState.stressLevel - 5) });
        } 
        else if (action === 'walk_away') {
          // PRD: walk_away -> priceModifier=1.0, stress=3
          n.confidence += 12;
          get().setGameState({ stressLevel: Math.min(100, gameState.stressLevel + 3) });
        } 
        else if (action === 'counter') {
          // PRD: push_more -> priceModifier=1.02 or 0.96 depending on stage
          if (customAmt && customAmt <= n.marketPrice * 0.96) {
            n.arhatiOffer = customAmt; 
            n.confidence += 8;
            get().setGameState({ stressLevel: Math.max(0, gameState.stressLevel - 3) });
          } else {
            n.arhatiOffer = Math.round(n.marketPrice * 0.90);
            get().setGameState({ stressLevel: Math.min(100, gameState.stressLevel + 10) });
          }
        }
        else if (action === 'accept') {
          // Handled externally usually, but if called, it's final price.
        }

        set({ negotiation: n });
      },

      sellGrainNow: (quantity, price) => {
        const { gameState, farmer } = get();
        if (!gameState || !farmer) return;
        let s = { ...gameState };
        const revenue = quantity * price;
        s.cashInHand += revenue;
        s.grossRevenue += revenue;
        s.grainOnFarmQuintals -= quantity;
        s.stressLevel = Math.max(0, s.stressLevel - 15);
        s.currentEmotion = price >= s.mspPrice ? 'relief' : 'regret';

        // BADGE UNLOCKS for Negotiation
        if (price >= s.mspPrice) {
          if (!s.badges.find((b: any) => b.id === 'msp_fighter')) s.badges.push({ id: 'msp_fighter', nameKey: 'msp_fighter', unlockedAt: Date.now() });
        }
        const crop = CROP_BASE_DATA[farmer.primaryCrop];
        if (crop && price >= crop.baseMarketPrice) {
          if (!s.badges.find((b: any) => b.id === 'master_negotiator')) s.badges.push({ id: 'master_negotiator', nameKey: 'master_negotiator', unlockedAt: Date.now() });
        }

        set({ gameState: s, negotiation: null });
        get().recordDecision('sell', 'mandi', quantity);
      },

      decideStoreGodown: (quantity, registrationFee) => {
        const { gameState } = get();
        if (!gameState) return;
        let s = { ...gameState };
        if (s.cashInHand < registrationFee) return;

        s.cashInHand -= registrationFee;
        s.grainOnFarmQuintals -= quantity;
        s.grainInGodownQuintals += quantity;
        s.eNWRActive = true;
        s.eNWRIssuedPrice = s.currentMarketPrice;
        s.eNWRGrainQuintals = quantity;
        s.eNWRDepositMonth = s.currentMonth;
        s.stressLevel = Math.max(0, s.stressLevel - 12);
        
        set({ gameState: s });
        get().recordDecision('enwr', 'deposit', quantity);
      },

      pledgeGodown: (amount) => {
        const { gameState } = get();
        if (!gameState) return;
        let s = { ...gameState };
        
        s.cashInHand += amount;
        s.eNWRPledgeLoanTaken += amount;
        s.totalDebt += amount;
        s.debtBreakdown = [...s.debtBreakdown, {
          id: generateId(),
          lender: 'enwr_pledge',
          amount: amount,
          interestRatePA: 7,
          dueWeek: s.weekNumber + 12,
          principal: amount
        }];
        syncDerivedStats(s);
        s.stressLevel = Math.max(0, s.stressLevel - 5);
        
        set({ gameState: s });
        get().recordDecision('enwr', 'pledge_loan', amount);
      },

      sellFromGodown: (quantity) => {
        const { gameState } = get();
        if (!gameState) return;
        let s = { ...gameState };
        
        const revenue = quantity * s.currentMarketPrice;
        const monthsStored = Math.max(1, (12 + s.currentMonth - s.eNWRDepositMonth) % 12);
        const storageCost = quantity * 25 * monthsStored; // 25 per q per month
        
        const debtRepayment = s.eNWRPledgeLoanTaken;
        
        const netCash = revenue - storageCost - debtRepayment;
        s.cashInHand += netCash;
        s.grossRevenue += revenue;
        s.grainInGodownQuintals -= quantity;
        
        s.eNWRPledgeLoanTaken = 0;
        s.debtBreakdown = s.debtBreakdown.filter(d => d.lender !== 'enwr_pledge');
        syncDerivedStats(s);
        
        if (s.grainInGodownQuintals <= 0) {
          s.eNWRActive = false;
          s.eNWRGrainQuintals = 0;
        }
        
        s.stressLevel = Math.max(0, s.stressLevel - 20);
        set({ gameState: s });
        get().recordDecision('sell', 'enwr', quantity);
      },

      resolveCrisisEvent: (eventId, resolutionType, cost = 0) => {
        const { gameState } = get();
        if (!gameState) return;
        let s = { ...gameState };
        
        const evIdx = s.pendingEvents.findIndex(e => e.id === eventId);
        if (evIdx === -1) return;
        
        const ev = s.pendingEvents[evIdx];
        s.pendingEvents.splice(evIdx, 1);
        
        ev.resolved = true;
        s.resolvedEvents.push(ev);

        if (resolutionType === 'pay_cash' && cost > 0) {
          s.cashInHand -= cost;
          s.stressLevel = Math.max(0, s.stressLevel - 5);
        }

        set({ gameState: s });
      },

      startNextSeason: () => {
        const { gameState } = get();
        if (!gameState) return;
        
        // Max 4 seasons - game ends after season 4
        if (gameState.seasonNumber >= 4) {
          // Game over - show final report
          return;
        }
        
        let s = { ...gameState };
        
        s.samriddhiScore += Math.floor(s.netIncome / 1000) + (s.pmfbyEnrolled ? 40 : 0) + (s.eNWRActive ? 75 : 0) - (s.stressLevel * 0.3);

        // BADGE UNLOCKS for Season End checks
        if (!s.badges) s.badges = [];
        if (s.stressLevel < 20 && !s.badges.find((b:any) => b.id === 'stress_free')) {
          s.badges.push({ id: 'stress_free', nameKey: 'stress_free', unlockedAt: Date.now() });
        }
        if (s.totalDebt === 0 && !s.badges.find((b:any) => b.id === 'debt_free')) {
          s.badges.push({ id: 'debt_free', nameKey: 'debt_free', unlockedAt: Date.now() });
        }
        if (s.pmfbyEnrolled && s.seasonNumber >= 1 && !s.badges.find((b:any) => b.id === 'insurance_wise')) {
          s.badges.push({ id: 'insurance_wise', nameKey: 'insurance_wise', unlockedAt: Date.now() });
        }
        if (s.samriddhiScore >= 200 && !s.badges.find((b:any) => b.id === 'samriddhi_champion')) {
          s.badges.push({ id: 'samriddhi_champion', nameKey: 'samriddhi_champion', unlockedAt: Date.now() });
        }
        if (s.eNWRActive && s.seasonNumber >= 1 && !s.badges.find((b:any) => b.id === 'godown_king')) {
          s.badges.push({ id: 'godown_king', nameKey: 'godown_king', unlockedAt: Date.now() });
        }
        
        s.currentEmotion = s.netIncome > 0 ? 'relief' : 'neutral';

        s.seasonNumber += 1;
        s.weekNumber = 1;
        s.inputsBought = false;
        s.harvestComplete = false;
        s.pmfbyEnrolled = false;
        s.pmfbyCutoffPassed = false;
        s.grainOnFarmQuintals = 0;
        s.grossRevenue = 0;
        s.inputCostPaid = 0;
        s.netIncome = 0;
        s.seasonEndReached = false;
        s.pendingEvents = [];
        s.currentMonth = s.currentMonth === 12 ? 1 : s.currentMonth + 1;
        
        set({ gameState: s });
      }
    }),
    {
      name: 'anaj-arth-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ farmer: state.farmer, gameState: state.gameState })
    }
  )
);
