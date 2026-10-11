import { ApolloServer } from "@apollo/server";
import { Game } from "../../../skull-king-core/src/game";
import { Deck } from "../../../skull-king-core/src/deck";
import type { Context } from "../index";
import resolvers from "../resolvers";
import typeDefs from "../typeDefs";

const stateQuery = `query State($token: String) {
  state(gameId:"rounds",playerToken:$token) {
    roundSchedule tieBreakers cannonball maxPlayers
    currentRound {
      roundNumber cardsPerPlayer isTieBreaker phase playerTurn myCannonLoad
      revealedBids {playerId count} revealedCannonLoads {playerId load}
      lastCompletedHand {id}
    }
    me { hand { ... on ColoredCard {id} ... on SpecialCard {id} } }
    scorecard {playerName bidPoints bonusPoints totalPoints}
  }
}`;

type State = {
  currentRound: {
    roundNumber: number;
    phase: string;
    myCannonLoad: string | null;
    revealedCannonLoads: unknown[];
    revealedBids: unknown[];
    lastCompletedHand: { id: string };
  } | null;
  scorecard: {
    playerName: string;
    bidPoints: number;
    bonusPoints: number;
    totalPoints: number;
  }[][];
};

describe("round options through GraphQL", () => {
  let server: ApolloServer<Context>;
  beforeEach(() => {
    server = new ApolloServer<Context>({ typeDefs, resolvers });
  });
  afterEach(async () => {
    await server.stop();
  });

  async function execute<T>(
    context: Context,
    query: string,
    variables?: Record<string, unknown>,
  ) {
    const result = await server.executeOperation<T>(
      { query, variables },
      { contextValue: context },
    );
    if (result.body.kind !== "single")
      throw new Error("Expected single response");
    expect(result.body.singleResult.errors).toBeUndefined();
    return result.body.singleResult.data!;
  }

  it("creates a custom schedule with tie and Cannonball options", async () => {
    const context: Context = { games: new Map() };
    const created = await execute<{ newGame: string }>(
      context,
      `mutation {
      newGame(roundSchedule:[5,3,1],scoringMode:rascal,cannonball:true,tieBreakers:false)
    }`,
    );
    expect(
      context.games.get(created.newGame)!.getStateForPlayer(),
    ).toMatchObject({
      roundSchedule: [5, 3, 1],
      cannonball: true,
      tieBreakers: false,
      maxPlayers: 8,
    });
    const result = await server.executeOperation(
      { query: `mutation{newGame(scoringMode:classic,cannonball:true)}` },
      { contextValue: context },
    );
    if (result.body.kind !== "single")
      throw new Error("Expected single response");
    expect(result.body.singleResult.errors?.[0].message).toContain(
      "requires Rascal",
    );
    expect(context.games.size).toBe(1);
  });

  it("reveals loads together, rejects stale choices, and scores mixed Cannonball/Grapeshot bids", async () => {
    const deck = new Deck({
      customDeck: [3, 2, 1].map((number) => ({
        id: `yellow-${number}`,
        color: "YELLOW",
        number,
      })),
      noShuffle: true,
    });
    const game = new Game("rounds", {
      deck,
      roundSchedule: [1],
      scoringMode: "rascal",
      cannonball: true,
      tieBreakers: false,
    });
    const context: Context = { games: new Map([["rounds", game]]) };
    const alice = game.addPlayer("Alice"),
      bob = game.addPlayer("Bob"),
      cara = game.addPlayer("Cara");
    game.start();
    const state = async (token?: string) =>
      (await execute<{ state: State }>(context, stateQuery, { token })).state;
    const load = async (token: string, choice: string, round = 1) =>
      (
        await execute<{ loadCannon: boolean }>(
          context,
          `mutation Load($token:String!,$load:CannonLoad!,$round:Int!){
      loadCannon(gameId:"rounds",playerToken:$token,load:$load,expectedRoundNumber:$round)
    }`,
          { token, load: choice, round },
        )
      ).loadCannon;

    expect((await state()).currentRound!.revealedBids).toEqual([]);
    for (const token of [alice, bob, cara])
      await execute(
        context,
        `mutation Bid($token:String!){submitBid(gameId:"rounds",playerToken:$token,count:0)}`,
        { token },
      );
    const awaiting = (await state()).currentRound!;
    expect(awaiting).toMatchObject({
      phase: "load",
      playerTurn: null,
      cardsPerPlayer: 1,
      isTieBreaker: false,
    });
    expect(awaiting.revealedBids).toHaveLength(3);
    expect(await load(alice, "cannonball", 99)).toBe(false);
    expect(await load(alice, "cannonball")).toBe(true);
    expect((await state(alice)).currentRound!.myCannonLoad).toBe("cannonball");
    for (const token of [undefined, bob, "invalid"]) {
      expect((await state(token)).currentRound!.myCannonLoad).toBeNull();
      expect((await state(token)).currentRound!.revealedCannonLoads).toEqual(
        [],
      );
    }
    expect(await load(alice, "grapeshot")).toBe(false);
    expect(await load(bob, "cannonball")).toBe(true);
    expect((await state()).currentRound!.phase).toBe("load");
    expect(await load(cara, "grapeshot")).toBe(true);
    expect((await state()).currentRound).toMatchObject({
      phase: "play",
      revealedCannonLoads: [
        { playerId: "Alice", load: "cannonball" },
        { playerId: "Bob", load: "cannonball" },
        { playerId: "Cara", load: "grapeshot" },
      ],
    });
    expect(await load(cara, "cannonball")).toBe(false);

    for (const token of [bob, cara, alice]) {
      const card = game.getStateForPlayer(token).me!.hand[0];
      await execute(
        context,
        `mutation Play($token:String!,$card:String!){playColoredCard(gameId:"rounds",playerToken:$token,cardId:$card)}`,
        { token, card: card.id },
      );
    }
    const handId = (await state()).currentRound!.lastCompletedHand.id;
    await execute(
      context,
      `mutation Advance($id:String!,$token:String!){advanceTrick(gameId:"rounds",playerToken:$token,expectedHandId:$id)}`,
      { id: handId, token: alice },
    );
    const final = await state();
    expect(final.currentRound).toBeNull();
    const scores = Object.fromEntries(
      final.scorecard[0].map((block) => [block.playerName, block.bidPoints]),
    );
    // Cara holds the yellow3 and misses a zero bid byone with Grapeshot.
    expect(scores).toEqual({ Alice: 15, Bob: 15, Cara: 5 });
    expect(await load(alice, "grapeshot")).toBe(false);
  });
});
