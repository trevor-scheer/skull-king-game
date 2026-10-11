import { Card, Color, isColoredCard, isSpecialCard } from './cards';
import type { PirateAbilityInput } from './pirateAbilities';

/** Deliberately narrower than GameState: only this seat's cards and public facts. */
export interface BotView {
  playerId: string;
  hand: Card[];
  legalCardIds: string[];
  phase: string;
  bid?: number;
  tricksWon: number;
  cardsPerPlayer: number;
  trickColor: Color | null;
  forcedCardId: string | null;
  players: { id: string; handCount: number }[];
  ability: { id: string; kind: string; stage: string; canDecline: boolean } | null;
  plankChoice: { id: string; cardIds: string[] } | null;
}
export type BotAction =
  | { kind: 'bid'; count: number }
  | { kind: 'load' }
  | { kind: 'play'; cardId: string; selection?: 'escape' | 'pirate'; numberChoice?: number; colorChoice?: Color }
  | { kind: 'ability'; id: string; input: PirateAbilityInput }
  | { kind: 'plank'; id: string; cardId: string };
function strength(card: Card) {
  if (isColoredCard(card)) return (card.wild ? 15 : card.choice ? 14 : card.number) + (card.color === 'BLACK' ? 15 : 0);
  return ({ escape: 0, loot: 0, lastVolley: 1, walkThePlank: 2, kraken: 3, whiteWhale: 3, mermaid: 30, stingray: 31, pirate: 40, maryThorne: 40, tigress: 40, firstMate: 45, skullKing: 50, davyJones: 55 } as Record<string,number>)[card.type] ?? 0;
}
export function chooseBotAction(view: BotView): BotAction | null {
  if (view.plankChoice) return { kind: 'plank', id: view.plankChoice.id, cardId: view.plankChoice.cardIds[0] };
  if (view.ability) {
    const ability = view.ability;
    let input: PirateAbilityInput;
    if (ability.stage === 'view') input = { action: 'finish' };
    else if (ability.stage === 'discard') input = { action: 'discard', cardIds: view.hand.filter(card => card.id !== view.forcedCardId).sort((a,b) => strength(a)-strength(b)).slice(0,2).map(card => card.id) };
    else if (ability.kind === 'harry') input = { action: 'adjustBid', amount: Math.sign(view.tricksWon - (view.bid ?? 0)) };
    else if (ability.kind === 'mary' && !ability.canDecline) input = { action: 'forceCard', playerId: view.players.find(player => player.id !== view.playerId && player.handCount > 0)?.id ?? view.playerId };
    else input = { action: 'decline' };
    return { kind: 'ability', id: ability.id, input };
  }
  if (view.phase === 'bid') {
    const estimated = view.hand.reduce((sum, card) => sum + (strength(card) >= 40 ? .8 : strength(card) >= 26 ? .6 : strength(card) >= 13 ? .25 : 0), 0);
    return { kind: 'bid', count: Math.min(view.cardsPerPlayer, Math.round(estimated)) };
  }
  if (view.phase === 'load') return { kind: 'load' };
  if (view.phase !== 'play') return null;
  const wantsTrick = view.tricksWon < (view.bid ?? 0);
  const legal = view.hand.filter(card => view.legalCardIds.includes(card.id)).sort((a,b) => strength(a)-strength(b));
  const card = wantsTrick ? legal[legal.length - 1] : legal[0];
  if (!card) return null;
  return { kind: 'play', cardId: card.id,
    ...(isSpecialCard(card) && card.type === 'tigress' ? { selection: wantsTrick ? 'pirate' as const : 'escape' as const } : {}),
    ...(isColoredCard(card) && card.choice ? { numberChoice: wantsTrick ? 14 : 0 } : {}),
    ...(isColoredCard(card) && card.wild ? { colorChoice: view.trickColor && view.trickColor !== 'BLACK' ? view.trickColor : 'YELLOW' as const } : {}),
  };
}
