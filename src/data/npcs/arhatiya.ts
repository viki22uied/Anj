export interface ArhatiyaScript {
  openingTactic: string;
  qualityChallenge: string;
  marketDownNarrative: string;
  debtPressure: string;
  finalOffer: string;
  counterToMSP: string;
}

export const ARHATIYA_SCRIPTS: Record<string, ArhatiyaScript> = {
  default: {
    openingTactic:       'npc.arhatiya.opening_default',
    qualityChallenge:    'npc.arhatiya.quality_challenge',
    marketDownNarrative: 'npc.arhatiya.market_down',
    debtPressure:        'npc.arhatiya.debt_pressure',
    finalOffer:          'npc.arhatiya.final_offer',
    counterToMSP:        'npc.arhatiya.counter_msp',
  },
  PB: {
    openingTactic:       'npc.arhatiya.pb.opening',
    qualityChallenge:    'npc.arhatiya.pb.quality',
    marketDownNarrative: 'npc.arhatiya.pb.market_down',
    debtPressure:        'npc.arhatiya.pb.debt',
    finalOffer:          'npc.arhatiya.pb.final',
    counterToMSP:        'npc.arhatiya.pb.msp',
  },
  MH: {
    openingTactic:       'npc.arhatiya.mh.opening',
    qualityChallenge:    'npc.arhatiya.mh.quality',
    marketDownNarrative: 'npc.arhatiya.mh.market_down',
    debtPressure:        'npc.arhatiya.mh.debt',
    finalOffer:          'npc.arhatiya.mh.final',
    counterToMSP:        'npc.arhatiya.mh.msp',
  },
  UP: {
    openingTactic:       'npc.arhatiya.up.opening',
    qualityChallenge:    'npc.arhatiya.up.quality',
    marketDownNarrative: 'npc.arhatiya.up.market_down',
    debtPressure:        'npc.arhatiya.up.debt',
    finalOffer:          'npc.arhatiya.up.final',
    counterToMSP:        'npc.arhatiya.up.msp',
  },
};
