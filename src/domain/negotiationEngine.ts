/**
 * @module domain/negotiationEngine
 * Mandi negotiation dialogue engine — arhatiya vs farmer.
 * Branching dialogue system with tactics, counter-moves, and price effects.
 */

import type { DialogueNode, DialogueChoice } from './types';

// ─── Dialogue Tree Builder ──────────────────────────────────────────────────

export function createNegotiationScript(_basePrice: number, _mspPrice: number): DialogueNode[] {
  const nodes: DialogueNode[] = [
    {
      id: 'start',
      speaker: 'narrator',
      textKey: 'negotiation.narrator.welcome',
      choices: [{ id: 'c_start', textKey: 'negotiation.farmer.ready', move: 'accept', nextNodeId: 'arh_open', voiceIntents: ['ready', 'start', 'begin', 'shuru'] }],
      priceModifier: 1.0,
      stressModifier: 0,
    },
    {
      id: 'arh_open',
      speaker: 'arhatiya',
      textKey: 'negotiation.arhatiya.opening',
      tactic: 'quality_downgrade',
      choices: [
        { id: 'c1', textKey: 'negotiation.farmer.quote_msp', move: 'quote_msp', nextNodeId: 'arh_market_down', voiceIntents: ['msp', 'minimum', 'sarkar', 'government'] },
        { id: 'c2', textKey: 'negotiation.farmer.accept_low', move: 'accept', nextNodeId: 'end_low', voiceIntents: ['ok', 'theek', 'accept'] },
        { id: 'c3', textKey: 'negotiation.farmer.counter', move: 'counter_offer', nextNodeId: 'arh_delay', voiceIntents: ['no', 'nahi', 'zyada', 'more'] },
      ],
      priceModifier: 0.85,
      stressModifier: 5,
    },
    {
      id: 'arh_market_down',
      speaker: 'arhatiya',
      textKey: 'negotiation.arhatiya.market_down',
      tactic: 'market_is_down',
      choices: [
        { id: 'c4', textKey: 'negotiation.farmer.show_enam', move: 'show_enam', nextNodeId: 'arh_concede', voiceIntents: ['enam', 'online', 'rate'] },
        { id: 'c5', textKey: 'negotiation.farmer.alt_mandi', move: 'alternative_mandi', nextNodeId: 'arh_concede', voiceIntents: ['other mandi', 'dusri', 'alternative'] },
        { id: 'c6', textKey: 'negotiation.farmer.walk_away', move: 'walk_away', nextNodeId: 'end_walkaway', voiceIntents: ['walk', 'leave', 'chalo', 'jaata'] },
      ],
      priceModifier: 0.88,
      stressModifier: 8,
    },
    {
      id: 'arh_delay',
      speaker: 'arhatiya',
      textKey: 'negotiation.arhatiya.delay_threat',
      tactic: 'delay_threat',
      choices: [
        { id: 'c7', textKey: 'negotiation.farmer.use_enwr', move: 'use_enwr', nextNodeId: 'end_enwr', voiceIntents: ['warehouse', 'store', 'enwr', 'godown'] },
        { id: 'c8', textKey: 'negotiation.farmer.accept_mid', move: 'accept', nextNodeId: 'end_mid', voiceIntents: ['ok', 'theek', 'done'] },
      ],
      priceModifier: 0.90,
      stressModifier: 10,
    },
    {
      id: 'arh_concede',
      speaker: 'arhatiya',
      textKey: 'negotiation.arhatiya.concede',
      choices: [
        { id: 'c9', textKey: 'negotiation.farmer.accept_fair', move: 'accept', nextNodeId: 'end_fair', voiceIntents: ['ok', 'theek', 'accept', 'done'] },
        { id: 'c10', textKey: 'negotiation.farmer.push_more', move: 'counter_offer', nextNodeId: 'end_good', voiceIntents: ['more', 'zyada', 'aur'] },
      ],
      priceModifier: 0.96,
      stressModifier: -3,
    },
    // ── End Nodes ──
    { id: 'end_low', speaker: 'narrator', textKey: 'negotiation.end.low', choices: [], priceModifier: 0.82, stressModifier: 15 },
    { id: 'end_mid', speaker: 'narrator', textKey: 'negotiation.end.mid', choices: [], priceModifier: 0.90, stressModifier: 5 },
    { id: 'end_fair', speaker: 'narrator', textKey: 'negotiation.end.fair', choices: [], priceModifier: 0.96, stressModifier: -5 },
    { id: 'end_good', speaker: 'narrator', textKey: 'negotiation.end.good', choices: [], priceModifier: 1.02, stressModifier: -10 },
    { id: 'end_walkaway', speaker: 'narrator', textKey: 'negotiation.end.walkaway', choices: [], priceModifier: 1.0, stressModifier: 3 },
    { id: 'end_enwr', speaker: 'narrator', textKey: 'negotiation.end.enwr', choices: [], priceModifier: 1.0, stressModifier: -5 },
  ];
  return nodes;
}

export function getNode(nodes: DialogueNode[], nodeId: string): DialogueNode | undefined {
  return nodes.find(n => n.id === nodeId);
}

export function isEndNode(node: DialogueNode): boolean {
  return node.choices.length === 0;
}

/** Calculate final negotiated price from base price and dialogue path */
export function calculateNegotiatedPrice(basePrice: number, priceModifiers: number[]): number {
  let finalMod = 1.0;
  for (const mod of priceModifiers) {
    finalMod *= mod;
  }
  return Math.round(basePrice * finalMod);
}

/** Match voice transcript to best dialogue choice */
export function matchVoiceIntent(transcript: string, choices: DialogueChoice[]): DialogueChoice | null {
  const lower = transcript.toLowerCase().trim();
  let bestMatch: DialogueChoice | null = null;
  let bestScore = 0;
  for (const choice of choices) {
    for (const intent of choice.voiceIntents) {
      if (lower.includes(intent.toLowerCase())) {
        const score = intent.length;
        if (score > bestScore) { bestScore = score; bestMatch = choice; }
      }
    }
  }
  return bestMatch;
}
