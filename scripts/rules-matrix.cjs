// Run `corepack yarn build` first. This is a deterministic, bounded rules smoke audit.
const { Game } = require('../skull-king-core/dist/game');
const { Deck } = require('../skull-king-core/dist/deck');
const flags = [
  'includeMermaids', 'includeKraken', 'includeWhiteWhale', 'includeLoot',
  'includeExpansion', 'includeFirstMate', 'includeStingray', 'includeDavyJones',
  'includeWalkThePlank', 'includeLastVolley',
];
const seed = Number(process.argv[2] ?? 20261011);
if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff) throw Error('Seed must be an unsigned 32-bit integer.');
let randomState = seed;
function random() {
  randomState = (randomState + 0x6d2b79f5) | 0;
  let value = Math.imul(randomState ^ (randomState >>> 15), 1 | randomState);
  value ^= value + Math.imul(value ^ (value >>> 7), 61 | value);
  return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
}
const originalRandom = Math.random;
const started = Date.now();
let actions = 0;
let matches = 0;
const seen = new Set();
Math.random = random;
try {
  for (let mask = 0; mask < 2 ** flags.length; mask++) {
    const deckConfig = Object.fromEntries(flags.map((flag, index) => [flag, Boolean(mask & (1 << index))]));
    const count = 2 + (mask % (deckConfig.includeExpansion ? 8 : 7));
    const mode = mask % 3;
    const game = new Game(`audit-${mask}`, {
      deck: new Deck({ deckConfig, shuffleSeed: (seed + mask) >>> 0 }),
      deckConfig, roundSchedule: [1, 3, 6, 10], tieBreakers: false,
      pirateAbilities: true, scoringMode: mode ? 'rascal' : 'classic', cannonball: mode === 2,
    });
    const token = game.addPlayer('Human');
    for (let index = 1; index < count; index++) game.addBot(token);
    game.start();
    game.setAutoplay(token, true);
    let steps = 0;
    while (game.getStateForPlayer().phase !== 'postgame') {
      if (++steps > 2000) throw Error(`Stalled configuration ${mask}; seed ${seed}`);
      if (!game.stepAutoplay()) {
        const round = game.getStateForPlayer().currentRound;
        if (round.phase !== 'trick_result' || round.pirateAbility || round.plankChoice) {
          throw Error(`Blocked configuration ${mask}; seed ${seed}`);
        }
        for (const play of round.lastCompletedHand.cardsPlayed) seen.add(play.card.id);
        game.advanceFromTrickResult(round.lastCompletedHand.id);
      }
    }
    const scores = game.getStateForPlayer().scorecard;
    if (scores.length !== 4 || scores.some(round => round.length !== count || round.some(score => !Number.isFinite(score.totalPoints)))) {
      throw Error(`Invalid scorecard for configuration ${mask}; seed ${seed}`);
    }
    actions += steps;
    matches++;
  }
} finally {
  Math.random = originalRandom;
}
if (seen.size !== 93) throw Error(`Coverage was incomplete: saw ${seen.size} of 93 card IDs; seed ${seed}`);
console.log(JSON.stringify({ seed, matches, actions, distinctCards: seen.size, elapsedMs: Date.now() - started }, null, 2));
