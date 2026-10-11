import { ApolloServer } from "@apollo/server";
import { Card, isColoredCard, isSpecialCard } from "../../../skull-king-core/src/cards";
import { Deck } from "../../../skull-king-core/src/deck";
import { Game } from "../../../skull-king-core/src/game";
import type { Context } from "../index";
import resolvers from "../resolvers";
import typeDefs from "../typeDefs";

type State = {
  phase: string;
  me: { name: string; hand: Card[] } | null;
  players: { name: string; hand: Card[] }[];
  currentRound: {
    roundNumber: number;
    phase: string;
    playerTurn: string | null;
    leader: string;
    trickColor: string | null;
    lastCompletedHand: { id: string } | null;
  } | null;
  scorecard: { playerName: string; tricksWon: number; totalPoints: number }[][] | null;
};

const stateQuery = `
  query State($playerToken: String) {
    state(gameId: "test-game", playerToken: $playerToken) {
      phase
      players { name hand { ...CardFields } }
      me { name hand { ...CardFields } }
      currentRound {
        roundNumber phase playerTurn leader trickColor
        lastCompletedHand { id }
      }
      scorecard { playerName tricksWon totalPoints }
    }
  }
  fragment CardFields on Card {
    ... on ColoredCard { id color number }
    ... on SpecialCard { id type selection }
  }
`;

describe("game lifecycle through GraphQL", () => {
  let server: ApolloServer<Context>;
  let context: Context;
  let game: Game;
  let hostToken: string;

  beforeEach(() => {
    game = new Game("test-game", { deck: new Deck({ shuffleSeed: 0.3 }) });
    context = { games: new Map([["test-game", game]]) };
    server = new ApolloServer<Context>({ typeDefs, resolvers });
  });

  afterEach(async () => {
    await server.stop();
  });

  async function execute<T>(query: string, variables?: Record<string, unknown>) {
    const response = await server.executeOperation<T>(
      { query, variables },
      { contextValue: context }
    );
    if (response.body.kind !== "single") throw new Error("Expected a single response");
    expect(response.body.singleResult.errors).toBeUndefined();
    expect(response.body.singleResult.data).toBeDefined();
    return response.body.singleResult.data!;
  }

  async function state(playerToken?: string) {
    return (await execute<{ state: State }>(stateQuery, { playerToken })).state;
  }

  async function start(playerCount = 2) {
    const tokens = new Map<string, string>();
    for (let index = 0; index < playerCount; index++) {
      const name = `Player ${index + 1}`;
      const result = await execute<{ addPlayer: string }>(
        `mutation Join($name: String!) { addPlayer(gameId: "test-game", name: $name) }`,
        { name }
      );
      tokens.set(name, result.addPlayer);
    }
    hostToken = tokens.values().next().value!;
    await execute(`mutation { startGame(gameId: "test-game", playerToken: "${hostToken}") }`);
    return tokens;
  }

  async function advance(expectedHandId: string) {
    return (await execute<{ advanceTrick: boolean }>(
      `mutation Advance($expectedHandId: String!) {
        advanceTrick(gameId: "test-game", playerToken: "${hostToken}", expectedHandId: $expectedHandId)
      }`,
      { expectedHandId }
    )).advanceTrick;
  }

  async function bid(tokens: Map<string, string>) {
    for (const playerToken of tokens.values()) {
      await execute(
        `mutation Bid($playerToken: String!) {
          submitBid(gameId: "test-game", playerToken: $playerToken, count: 0)
        }`,
        { playerToken }
      );
    }
  }

  async function play(token: string, card: Card) {
    const variables = { playerToken: token, cardId: card.id };
    if (isSpecialCard(card)) {
      await execute(
        `mutation Play($playerToken: String!, $cardId: String!, $selection: String) {
          playSpecialCard(gameId: "test-game", playerToken: $playerToken, cardId: $cardId, selection: $selection)
        }`,
        { ...variables, selection: card.type === "tigress" ? "escape" : null }
      );
    } else {
      await execute(
        `mutation Play($playerToken: String!, $cardId: String!) {
          playColoredCard(gameId: "test-game", playerToken: $playerToken, cardId: $cardId)
        }`,
        variables
      );
    }
  }

  it("has no active round in an empty or one-player lobby", async () => {
    expect(await state()).toMatchObject({ phase: "setup", currentRound: null });
    const token = game.addPlayer("Trevor");
    expect(await state(token)).toMatchObject({
      phase: "setup", currentRound: null, me: { name: "Trevor", hand: [] },
    });
  });

  it("keeps a completed trick readable while nobody is taking a turn", async () => {
    const tokens = await start();
    await bid(tokens);
    for (const name of ["Player 2", "Player 1"]) {
      const token = tokens.get(name)!;
      const hand = (await state(token)).me!.hand;
      await play(token, hand[0]);
    }
    expect(await state()).toMatchObject({
      phase: "play",
      currentRound: { phase: "trick_result", playerTurn: null, lastCompletedHand: { id: expect.any(String) } },
    });
  });

  it("treats a stale player token as a public viewer without leaking hands", async () => {
    const tokens = await start();
    const publicState = await state("token-from-another-room");
    expect(publicState.me).toBeNull();
    expect(publicState.players.every(player => player.hand.length === 0)).toBe(true);
    expect((await state(tokens.get("Player 1"))).me!.hand).toHaveLength(1);
  });

  it("requires the completed trick ID before advancing", async () => {
    const tokens = await start();
    await bid(tokens);
    for (const name of ["Player 2", "Player 1"]) {
      const token = tokens.get(name)!;
      await play(token, (await state(token)).me!.hand[0]);
    }
    const response = await server.executeOperation(
      { query: `mutation { advanceTrick(gameId: "test-game", playerToken: "${hostToken}") }` },
      { contextValue: context }
    );
    if (response.body.kind !== "single") throw new Error("Expected a single response");
    expect(response.body.singleResult.errors?.[0].message).toContain("expectedHandId");
    expect((await state()).currentRound!.phase).toBe("trick_result");
  });

  it.each([2, 6])("completes ten rounds with %i players and readable final scores", async (playerCount) => {
    const tokens = await start(playerCount);
    const onEnd = jest.fn();
    game.onGameEnd(onEnd);
    let completedTricks = 0;
    let previousHandId: string | undefined;

    for (let roundNumber = 1; roundNumber <= 10; roundNumber++) {
      expect((await state()).currentRound).toMatchObject({
        roundNumber, phase: "bid", playerTurn: null,
      });
      await bid(tokens);
      for (let trick = 0; trick < roundNumber; trick++) {
        for (let turn = 0; turn < playerCount; turn++) {
          const current = (await state()).currentRound!;
          expect(current.phase).toBe("play");
          const token = tokens.get(current.playerTurn!)!;
          expect(token).toBeDefined();
          const hand = (await state(token)).me!.hand;
          const matchingCard = hand.find(card => isColoredCard(card) && card.color === current.trickColor);
          const card = matchingCard ?? hand[0];
          expect(card).toBeDefined();
          await play(token, card);
        }
        const result = (await state()).currentRound!;
        expect(result.phase).toBe("trick_result");
        expect(result.playerTurn).toBeNull();
        expect(result.lastCompletedHand?.id).toBeDefined();
        if (previousHandId) {
          expect(await advance(previousHandId)).toBe(false);
          expect((await state()).currentRound).toEqual(result);
        }
        const handId = result.lastCompletedHand!.id;
        expect(await advance(handId)).toBe(true);
        const afterAdvance = await state();
        expect(await advance(handId)).toBe(false);
        expect(await state()).toEqual(afterAdvance);
        previousHandId = handId;
        completedTricks++;
      }
    }

    const final = await state(tokens.get("Player 1"));
    expect(final.phase).toBe("postgame");
    expect(final.currentRound).toBeNull();
    expect(final.scorecard).toHaveLength(10);
    final.scorecard!.forEach((round, index) => {
      expect(round).toHaveLength(playerCount);
      expect(round.reduce((sum, block) => sum + block.tricksWon, 0)).toBe(index + 1);
      expect(round.every(block => Number.isFinite(block.totalPoints))).toBe(true);
    });
    expect(completedTricks).toBe(55);
    expect(onEnd).toHaveBeenCalledTimes(1);
  });
});
