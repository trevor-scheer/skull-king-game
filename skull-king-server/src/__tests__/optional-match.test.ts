// Scripted fixtures retain the direct two-player deal; Graybeard has separate coverage.
import { ApolloServer } from "@apollo/server";
import {
  Card,
  buildDeck,
  isColoredCard,
  isSpecialCard,
} from "../../../skull-king-core/src/cards";
import { Deck } from "../../../skull-king-core/src/deck";
import { Game } from "../../../skull-king-core/src/game";
import { ScoringMode } from "../../../skull-king-core/src/scoring";
import type { Context } from "../index";
import resolvers from "../resolvers";
import typeDefs from "../typeDefs";

type MatchState = {
  phase: string;
  scoringMode: ScoringMode;
  pirateAbilities: boolean;
  me: { name: string; hand: Card[] } | null;
  players: { hand: Card[] }[];
  currentRound: {
    roundNumber: number;
    phase: string;
    playerTurn: string | null;
    trickColor: string | null;
    lastCompletedHand: {
      id: string;
      trickDiscarded: boolean;
      cardsPlayed: { card: Card }[];
      winningCard: { card: Card } | null;
    } | null;
    pirateAbility: {
      id: string;
      playerId: string;
      stage: string;
      privateCards: Card[] | null;
    } | null;
  } | null;
  scorecard:
    | {
        playerName: string;
        tricksBid: number;
        tricksWon: number;
        bidPoints: number;
        bonusPoints: number;
        totalPoints: number;
      }[][]
    | null;
};

const query = `
  query OptionalMatch($playerToken: String) {
    state(gameId: "optional-match", playerToken: $playerToken) {
      phase scoringMode pirateAbilities
      players { hand { ...MatchCard } }
      me { name hand { ...MatchCard } }
      currentRound {
        roundNumber phase playerTurn trickColor
        lastCompletedHand {
          id trickDiscarded
          cardsPlayed { card { ...MatchCard } }
          winningCard { card { ...MatchCard } }
        }
        pirateAbility { id playerId stage privateCards { ...MatchCard } }
      }
      scorecard { playerName tricksBid tricksWon bidPoints bonusPoints totalPoints }
    }
  }
  fragment MatchCard on Card {
    ... on ColoredCard { id color number }
    ... on SpecialCard { id type selection }
  }
`;

it.each([
  ["classic", 2],
  ["classic", 6],
  ["rascal", 2],
  ["rascal", 6],
] as const)(
  "finishes an optional-card %s match with %i players",
  async (scoringMode, playerCount) => {
    const deckConfig = {
      includeMermaids: true,
      includeKraken: true,
      includeWhiteWhale: true,
      includeLoot: true,
    };
    // This fixture deals the deck in reverse order: optional cards and pirates are
    // dealt first, so even the two-player match exercises every enabled card.
    const game = new Game("optional-match", { twoPlayerMode: "duel",
      deck: new Deck({ customDeck: buildDeck(deckConfig).reverse(), noShuffle: true }),
      deckConfig,
      scoringMode,
      pirateAbilities: true,
    });
    const server = new ApolloServer<Context>({ typeDefs, resolvers });
    const context: Context = { games: new Map([["optional-match", game]]) };
    const tokens = new Map<string, string>();
    const seenCards = new Set<string>();
    const scores = new Map<string, number>();
    let abilitiesDeclined = 0;
    let discardedTricks = 0;
    const onEnd = jest.fn();
    game.onGameEnd(onEnd);

    async function execute<T>(
      operation: string,
      variables?: Record<string, unknown>,
    ) {
      const result = await server.executeOperation<T>(
        { query: operation, variables },
        { contextValue: context },
      );
      if (result.body.kind !== "single")
        throw new Error("Expected a single response");
      expect(result.body.singleResult.errors).toBeUndefined();
      expect(result.body.singleResult.data).toBeDefined();
      return result.body.singleResult.data!;
    }
    async function state(playerToken?: string) {
      return (await execute<{ state: MatchState }>(query, { playerToken }))
        .state;
    }
    async function advance(handId: string) {
      return (
        await execute<{ advanceTrick: boolean }>(
          `
      mutation Advance($handId: String!) {
        advanceTrick(gameId: "optional-match", playerToken: "${tokens.values().next().value}", expectedHandId: $handId)
      }`,
          { handId },
        )
      ).advanceTrick;
    }

    try {
      for (let index = 0; index < playerCount; index++) {
        const name = `Player ${index + 1}`;
        const joined = await execute<{ addPlayer: string }>(
          `
        mutation Join($name: String!) { addPlayer(gameId: "optional-match", name: $name) }
      `,
          { name },
        );
        tokens.set(name, joined.addPlayer);
      }
      await execute(`mutation { startGame(gameId: "optional-match", playerToken: "${tokens.values().next().value}") }`);
      for (let roundNumber = 1; roundNumber <= 10; roundNumber++) {
        const start = await state();
        expect(start.scoringMode).toBe(scoringMode);
        expect(start.pirateAbilities).toBe(true);
        expect(start.currentRound).toMatchObject({
          roundNumber,
          phase: "bid",
          playerTurn: null,
        });
        expect(start.players.every((player) => player.hand.length === 0)).toBe(
          true,
        );
        for (const token of tokens.values()) {
          expect((await state(token)).me!.hand).toHaveLength(roundNumber);
          await execute(
            `mutation Bid($token: String!) {
          submitBid(gameId: "optional-match", playerToken: $token, count: 0)
        }`,
            { token },
          );
        }
        let wonTricks = 0;
        for (let trick = 0; trick < roundNumber; trick++) {
          for (let turn = 0; turn < playerCount; turn++) {
            const current = (await state()).currentRound!;
            expect(current.phase).toBe("play");
            const token = tokens.get(current.playerTurn!)!;
            expect(token).toBeDefined();
            const hand = (await state(token)).me!.hand;
            const card =
              hand.find(
                (candidate) =>
                  isColoredCard(candidate) &&
                  candidate.color === current.trickColor,
              ) ?? hand[0];
            seenCards.add(card.id);
            if (isSpecialCard(card)) {
              await execute(
                `mutation Play($token: String!, $cardId: String!, $selection: String) {
              playSpecialCard(gameId: "optional-match", playerToken: $token, cardId: $cardId, selection: $selection)
            }`,
                {
                  token,
                  cardId: card.id,
                  selection: card.type === "tigress" ? "escape" : null,
                },
              );
            } else {
              await execute(
                `mutation Play($token: String!, $cardId: String!) {
              playColoredCard(gameId: "optional-match", playerToken: $token, cardId: $cardId)
            }`,
                { token, cardId: card.id },
              );
            }
          }
          const result = (await state()).currentRound!;
          expect(result).toMatchObject({
            phase: "trick_result",
            playerTurn: null,
          });
          const handId = result.lastCompletedHand!.id;
          if (result.lastCompletedHand!.trickDiscarded) discardedTricks++;
          else wonTricks++;
          const ability = result.pirateAbility;
          const playedCards = result.lastCompletedHand!.cardsPlayed.map(
            (play) => play.card,
          );
          const seaCreatures = playedCards.filter(
            (card) =>
              isSpecialCard(card) &&
              (card.type === "kraken" || card.type === "whiteWhale"),
          );
          const activeCreature = seaCreatures[seaCreatures.length - 1];
          if (activeCreature && isSpecialCard(activeCreature)) {
            expect(ability).toBeNull();
            if (activeCreature.type === "kraken") {
              expect(result.lastCompletedHand).toMatchObject({
                trickDiscarded: true,
                winningCard: null,
              });
            } else {
              const numbered = playedCards.filter(isColoredCard);
              if (numbered.length === 0) {
                expect(result.lastCompletedHand).toMatchObject({
                  trickDiscarded: true,
                  winningCard: null,
                });
              } else {
                const highest = numbered.reduce((best, card) =>
                  card.number > best.number ? card : best,
                );
                expect(result.lastCompletedHand!.trickDiscarded).toBe(false);
                expect(result.lastCompletedHand!.winningCard!.card.id).toBe(
                  highest.id,
                );
              }
            }
          }
          if (ability) {
            expect(await advance(handId)).toBe(false);
            expect(ability.privateCards ?? []).toEqual([]);
            const token = tokens.get(ability.playerId)!;
            expect(token).toBeDefined();
            const operation = `mutation Decline($token: String!, $id: String!) {
            usePirateAbility(gameId: "optional-match", playerToken: $token, expectedAbilityId: $id, input: { action: decline })
          }`;
            expect(
              (
                await execute<{ usePirateAbility: boolean }>(operation, {
                  token,
                  id: ability.id,
                })
              ).usePirateAbility,
            ).toBe(true);
            expect(
              (
                await execute<{ usePirateAbility: boolean }>(operation, {
                  token,
                  id: ability.id,
                })
              ).usePirateAbility,
            ).toBe(false);
            abilitiesDeclined++;
          }
          expect(await advance(handId)).toBe(true);
          expect(await advance(handId)).toBe(false);
        }
        const finished = await state();
        const blocks = finished.scorecard![roundNumber - 1];
        expect(blocks).toHaveLength(playerCount);
        expect(blocks.reduce((sum, block) => sum + block.tricksWon, 0)).toBe(
          wonTricks,
        );
        for (const block of blocks) {
          const expectedBidPoints =
            scoringMode === "classic"
              ? roundNumber * 10 * (block.tricksWon === 0 ? 1 : -1)
              : roundNumber *
                (block.tricksWon === 0 ? 10 : block.tricksWon === 1 ? 5 : 0);
          expect(block.bidPoints).toBe(expectedBidPoints);
          expect(block.totalPoints).toBe(
            (scores.get(block.playerName) ?? 0) +
              block.bidPoints +
              block.bonusPoints,
          );
          scores.set(block.playerName, block.totalPoints);
        }
      }
      expect(await state()).toMatchObject({
        phase: "postgame",
        currentRound: null,
      });
      expect(discardedTricks).toBeGreaterThan(0);
      expect(abilitiesDeclined).toBeGreaterThan(0);
      expect([...seenCards]).toEqual(
        expect.arrayContaining([
          "mermaid-1",
          "mermaid-2",
          "kraken",
          "whiteWhale",
          "loot-1",
          "loot-2",
          "pirate-1",
          "pirate-2",
          "pirate-3",
          "pirate-4",
          "pirate-5",
        ]),
      );
      expect(onEnd).toHaveBeenCalledTimes(1);
    } finally {
      await server.stop();
    }
  },
);
