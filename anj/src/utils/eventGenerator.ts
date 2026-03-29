import type { GameState, FarmerProfile, GameEvent } from '../types/game.types';

const generateId = () => Math.random().toString(36).substr(2, 9);

export function generateStochasticEvents(state: GameState, farmer: FarmerProfile): GameEvent[] {
  const events: GameEvent[] = [];
  
  // Only fire events randomly in the growing phase (week 5 to week 16 typical).
  // Some events can fire anytime, but let's restrict major crop events.
  const isGrowing = state.weekNumber >= 5 && state.weekNumber <= 16;
  
  const probs: Record<string, Partial<Record<string, number>>> = {
    flood: { base: 0.005, AS: 0.03, BR: 0.02, OD: 0.02, paddy: 0.003 },
    drought: { base: 0.008, RJ: 0.025, MH: 0.015, paddy: 0.01 },
    pest_attack: { base: 0.01, TS: 0.02, MH: 0.015, cotton: 0.02 },
    medical_emergency: { base: 0.012 },
    school_fees: { base: 0.008 }, 
    moneylender_visit: { base: 0 } // Determined by debt
  };

  const getProb = (type: string) => {
    let p = probs[type]?.base || 0;
    if (probs[type]?.[farmer.state]) p += probs[type][farmer.state] as number;
    if (probs[type]?.[farmer.primaryCrop]) p += probs[type][farmer.primaryCrop] as number;
    return p;
  };

  const check = (type: string) => Math.random() < getProb(type);

  // 1. Flood
  if (isGrowing && check('flood')) {
    events.push({
      id: generateId(),
      type: 'flood',
      titleKey: 'events.flood.title',
      descKey: 'events.flood.desc',
      cashImpact: -(5000 + Math.random() * 20000),
      yieldImpact: state.pmfbyEnrolled ? 0.60 + Math.random() * 0.20 : 0.35 + Math.random() * 0.25,
      stressImpact: 25,
      weekFired: state.weekNumber,
      resolved: false,
      requiresInteraction: true
    });
  }

  // 2. Drought
  if (isGrowing && check('drought')) {
    events.push({
      id: generateId(),
      type: 'drought',
      titleKey: 'events.drought.title',
      descKey: 'events.drought.desc',
      cashImpact: 0,
      yieldImpact: state.pmfbyEnrolled ? 0.65 + Math.random() * 0.15 : 0.40 + Math.random() * 0.25,
      stressImpact: 20,
      weekFired: state.weekNumber,
      resolved: false,
      requiresInteraction: true
    });
  }

  // 3. Pest Attack
  if (isGrowing && check('pest_attack')) {
    events.push({
      id: generateId(),
      type: 'pest_attack',
      titleKey: 'events.pest.title',
      descKey: 'events.pest.desc',
      cashImpact: -(2000 + Math.random() * 8000),
      yieldImpact: 0.60 + Math.random() * 0.25, // Improved if they bought pesticide earlier, handled in main logic via inputs
      stressImpact: 18,
      weekFired: state.weekNumber,
      resolved: false,
      requiresInteraction: true
    });
  }

  // 4. Medical Emergency (Anytime)
  if (check('medical_emergency')) {
    events.push({
      id: generateId(),
      type: 'medical_emergency',
      titleKey: 'events.medical.title',
      descKey: 'events.medical.desc',
      cashImpact: -(5000 + Math.random() * 25000),
      yieldImpact: 1.0,
      stressImpact: 22,
      weekFired: state.weekNumber,
      resolved: false,
      requiresInteraction: true
    });
  }

  // 5. Moneylender Visit (If debt overdue)
  const mlDebt = state.debtBreakdown.find(d => d.lender === 'moneylender' && d.dueWeek < state.weekNumber);
  if (mlDebt && Math.random() < 0.2) {
    events.push({
      id: generateId(),
      type: 'moneylender_visit',
      titleKey: 'events.moneylender.title',
      descKey: 'events.moneylender.desc',
      cashImpact: 0,
      yieldImpact: 1.0,
      stressImpact: 18,
      weekFired: state.weekNumber,
      resolved: false,
      requiresInteraction: true
    });
  }

  return events;
}
