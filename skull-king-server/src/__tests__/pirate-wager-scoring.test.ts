import { ApolloServer } from "@apollo/server";
import { Game } from "../../../skull-king-core/src/game";
import { pirateGame } from "../../../skull-king-core/testUtils/pirateGame";
import type { Context } from "../index";
import resolvers from "../resolvers";
import typeDefs from "../typeDefs";

type WagerState = {
  scoringMode: "classic" | "rascal";
  currentRound: {
    roundNumber: number;
    phase: string;
    pirateAbility: { id: string } | null;
    lastCompletedHand: { id: string } | null;
  };
  scorecard: {
    playerName: string;
    tricksBid: number;
    tricksWon: number;
    bidPoints: number;
    bonusPoints: number;
    totalPoints: number;
  }[][];
};

it.each([
  ["classic", 2, 40, 30],
  ["classic", 1, -10, -20],
  ["rascal", 2, 20, 30],
  ["rascal", 1, 10, -15],
] as const)(
  "%s scoring settles a Rascal wager after bidding %i and winning two tricks",
  async (scoringMode, bid, bidPoints, bonusPoints) => {
    const { deck } = pirateGame("pirate-2", true, false, {
      id: "yellow-14",
      color: "YELLOW",
      number: 14,
    });
    // Reuse the fixture's deterministic deal without its already-started game,
    // so the selected scoring mode is installed before the first round.
    const { originalDeck, cardsInPlay } = deck.__debugDeck();
    cardsInPlay.splice(
      0,
      cardsInPlay.length,
      ...originalDeck.slice().reverse(),
    );
    const game = new Game("wagers", {
      deck,
      pirateAbilities: true,
      scoringMode,
    });
    const context: Context = { games: new Map([["wagers", game]]) };
    const server = new ApolloServer<Context>({ typeDefs, resolvers });

    async function execute<T>(
      query: string,
      variables?: Record<string, unknown>,
    ) {
      const result = await server.executeOperation<T>(
        { query, variables },
        { contextValue: context },
      );
      if (result.body.kind !== "single")
        throw new Error("Expected a single response");
      expect(result.body.singleResult.errors).toBeUndefined();
      expect(result.body.singleResult.data).toBeDefined();
      return result.body.singleResult.data!;
    }
    async function state() {
      return (
        await execute<{ state: WagerState }>(`query {
        state(gameId: "wagers") {
          scoringMode
          currentRound { roundNumber phase pirateAbility { id } lastCompletedHand { id } }
          scorecard { playerName tricksBid tricksWon bidPoints bonusPoints totalPoints }
        }
      }`)
      ).state;
    }
    async function submitBid(token: string, count: number) {
      await execute(
        `mutation Bid($token: String!, $count: Int!) {
        submitBid(gameId: "wagers", playerToken: $token, count: $count)
      }`,
        { token, count },
      );
    }
    async function play(token: string, cardId: string, special: boolean) {
      const field = special ? "playSpecialCard" : "playColoredCard";
      await execute(
        `mutation Play($token: String!, $cardId: String!) {
        ${field}(gameId: "wagers", playerToken: $token, cardId: $cardId)
      }`,
        { token, cardId },
      );
    }
    let hostToken: string;
    async function advance() {
      const id = (await state()).currentRound.lastCompletedHand!.id;
      const result = await execute<{ advanceTrick: boolean }>(
        `mutation Advance($id: String!) {
        advanceTrick(gameId: "wagers", playerToken: "${hostToken}", expectedHandId: $id)
      }`,
        { id },
      );
      expect(result.advanceTrick).toBe(true);
    }

    try {
      const tokens: string[] = [];
      for (const name of ["Alice", "Bob"]) {
        tokens.push(
          (
            await execute<{ addPlayer: string }>(
              `mutation Join($name: String!) {
          addPlayer(gameId: "wagers", name: $name)
        }`,
              { name },
            )
          ).addPlayer,
        );
      }
      const [alice, bob] = tokens;
      hostToken = alice;
      await execute(`mutation { startGame(gameId: "wagers", playerToken: "${alice}") }`);
      await submitBid(alice, 0);
      await submitBid(bob, 1);
      await play(bob, "escape-2", true);
      await play(alice, "escape-1", true);
      await advance();
      const previousPoints = (await state()).scorecard[0].find(
        (block) => block.playerName === "Alice",
      )!.totalPoints;

      await submitBid(alice, bid);
      await submitBid(bob, 0);
      await play(alice, "pirate-2", true);
      await play(bob, "yellow-14", false);
      const abilityId = (await state()).currentRound.pirateAbility!.id;
      const wager = `mutation Wager($token: String!, $id: String!) {
        usePirateAbility(gameId: "wagers", playerToken: $token, expectedAbilityId: $id, input: { action: wager, amount: 20 })
      }`;
      expect(
        (
          await execute<{ usePirateAbility: boolean }>(wager, {
            token: alice,
            id: abilityId,
          })
        ).usePirateAbility,
      ).toBe(true);
      expect(
        (
          await execute<{ usePirateAbility: boolean }>(wager, {
            token: alice,
            id: abilityId,
          })
        ).usePirateAbility,
      ).toBe(false);
      await advance();
      await play(alice, "yellow-1", false);
      await play(bob, "escape-4", true);
      await advance();

      const scored = await state();
      expect(scored.scoringMode).toBe(scoringMode);
      expect(scored.currentRound).toMatchObject({
        roundNumber: 3,
        phase: "bid",
        pirateAbility: null,
      });
      expect(
        scored.scorecard[1].find((block) => block.playerName === "Alice"),
      ).toEqual({
        playerName: "Alice",
        tricksBid: bid,
        tricksWon: 2,
        bidPoints,
        bonusPoints,
        totalPoints: previousPoints + bidPoints + bonusPoints,
      });
    } finally {
      await server.stop();
    }
  },
);
