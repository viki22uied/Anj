import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { GameState, FarmerProfile, NegotiationState, DebtItem, LenderType, Decision } from '../types/game.types';
import { CROP_BASE_DATA } from '../data/crops';
import { generateStochasticEvents } from '../utils/eventGenerator';

const generateId = () => Math.random().toString(36).substr(2, 9);

interface GameStore {
  gameState: GameState | null;
  farmer: FarmerProfile | null;
  negotiation: NegotiationState | null;
  
  initGame: (farmer: FarmerProfile, cash: number, debtAmt: number, lender: LenderType) => void;
  resetGame: () => void;
  tick: () => void; // Advances 1 week
  startNextSeason: () => void;

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

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      gameState: null,
      farmer: null,
      negotiation: null,

      initGame: (farmer, startingCash, startingDebt, lender) => {
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
          badges: []
        };
        
        set({ farmer, gameState: state });
      },

      resetGame: () => set({ gameState: null, farmer: null, negotiation: null }),
      
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

        // 2. Interest Accrual
        let totalInterestThisWeek = 0;
        s.debtBreakdown = s.debtBreakdown.map(debt => {
          const weeklyRate = debt.interestRatePA / 52 / 100;
          const interest = Math.round(debt.amount * weeklyRate);
          totalInterestThisWeek += interest;
          return { ...debt, amount: debt.amount + interest };
        });
        s.totalDebt += totalInterestThisWeek;
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
          dueWeek: s.weekNumber + dueWeekOffsets[lender]
        }];
        
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
        if (s.cashInHand < amount) return;

        s.cashInHand -= amount;
        const actualPayment = Math.min(debt.amount, amount);
        
        s.debtBreakdown = s.debtBreakdown.map(d => 
          d.id === debtId ? { ...d, amount: d.amount - actualPayment } : d
        ).filter(d => d.amount > 0);
        
        s.totalDebt -= actualPayment;

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
        const discount = 0.72 + Math.random() * 0.10; // 18-28% below
        
        set({ negotiation: {
          round: 1,
          maxRounds: 5,
          farmerOffer: market,
          arhatiOffer: Math.round(market * discount),
          currentPrice: Math.round(market * discount),
          mspPrice: msp,
          marketPrice: market,
          confidence: 50,
          relationship: 'neutral'
        }});
      },

      processNegotiationAction: (action, customAmt) => {
        const { negotiation, gameState } = get();
        if (!negotiation || !gameState) return;
        
        let n = { ...negotiation };
        n.round += 1;
        
        if (action === 'invoke_msp') {
          n.arhatiOffer = Math.max(Math.round(n.arhatiOffer * 1.10), Math.round(n.mspPrice * 0.95));
          n.confidence += 15;
          get().setGameState({ arhatiRelationship: gameState.arhatiRelationship - 3 });
        } 
        else if (action === 'show_enwr') {
          n.arhatiOffer = Math.round(n.marketPrice * 0.95);
          n.confidence += 20;
          get().setGameState({ arhatiRelationship: gameState.arhatiRelationship - 5 });
        } 
        else if (action === 'walk_away') {
          if (Math.random() < 0.5) n.arhatiOffer = Math.round(n.arhatiOffer * (1.05 + Math.random()*0.1));
          n.confidence += 12;
          get().setGameState({ arhatiRelationship: gameState.arhatiRelationship - 10 });
        } 
        else if (action === 'counter') {
          if (customAmt && customAmt <= n.marketPrice * 0.92) {
            n.arhatiOffer = customAmt; // accepted
            n.confidence += 8;
          } else {
            n.arhatiOffer = Math.round(n.arhatiOffer * 1.05); // rejected but moves up slightly
          }
        }
        else if (action === 'accept') {
          // Handled externally usually, but if called, it's final price.
        }

        set({ negotiation: n });
      },

      sellGrainNow: (quantity, price) => {
        const { gameState } = get();
        if (!gameState) return;
        let s = { ...gameState };
        const revenue = quantity * price;
        s.cashInHand += revenue;
        s.grossRevenue += revenue;
        s.grainOnFarmQuintals -= quantity;
        s.stressLevel = Math.max(0, s.stressLevel - 15);
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
          dueWeek: s.weekNumber + 12
        }];
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
        s.totalDebt = s.debtBreakdown.reduce((a, b) => a + b.amount, 0);
        
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
        let s = { ...gameState };
        
        s.samriddhiScore += Math.floor(s.netIncome / 1000) + (s.pmfbyEnrolled ? 40 : 0) + (s.eNWRActive ? 75 : 0) - (s.stressLevel * 0.3);
        
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
