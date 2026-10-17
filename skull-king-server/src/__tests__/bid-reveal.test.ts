import { ApolloServer } from "@apollo/server";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Rooms } from "../rooms";
import type { Context } from "../context";
import resolvers from "../resolvers";
import typeDefs from "../typeDefs";

test("API games reveal together after restart, without exposing other locked bids", async () => {
  const directory = mkdtempSync(join(tmpdir(), "skull-bid-reveal-"));
  let now = 100_000;
  jest.spyOn(Date, "now").mockImplementation(() => now);
  let rooms = new Rooms(directory, () => now);
  const server = new ApolloServer<Context>({ typeDefs, resolvers });
  async function execute(query: string, variables?: Record<string, unknown>) {
    const response = await server.executeOperation({ query, variables }, { contextValue: { games: rooms.games, rooms } });
    if (response.body.kind !== "single") throw Error("Expected one response");
    expect(response.body.singleResult.errors).toBeUndefined();
    return response.body.singleResult.data!;
  }
  try {
    const { newGame: id } = await execute("mutation { newGame }");
    const game = rooms.games.get(id as string)!;
    const tokens = ["Anne", "Mary", "Jack"].map(name => game.addPlayer(name));
    game.start();
    for (const [index, token] of tokens.entries()) {
      await execute("mutation Bid($id:String!,$token:String!,$count:Int!) { submitBid(gameId:$id,playerToken:$token,count:$count) }", { id, token, count: index % 2 });
    }
    const query = `query State($id:String!,$token:String) { state(gameId:$id,playerToken:$token) {
      players { id bid hand { ... on ColoredCard { id } ... on SpecialCard { id } } }
      currentRound { phase bidRevealEndsAt myBid playerTurn revealedBids { playerId count } }
    } }`;
    const { state: publicState } = await execute(query, { id });
    expect(publicState).toMatchObject({ currentRound: { phase: "bid", bidRevealEndsAt: 104_500, myBid: null, playerTurn: null, revealedBids: [] } });
    expect((publicState as any).players).toEqual(["Anne", "Mary", "Jack"].map(id => ({ id, bid: null, hand: [] })));
    expect(await execute(query, { id, token: tokens[1] })).toMatchObject({ state: { currentRound: { myBid: 1, revealedBids: [] } } });
    rooms = new Rooms(directory, () => now);
    now = 104_499;
    rooms.tick();
    expect(rooms.games.get(id as string)!.getStateForPlayer().currentRound!.phase).toBe("bid");
    now++;
    const failedSave = jest.spyOn(rooms, "save").mockImplementationOnce(() => { throw Error("Storage unavailable"); });
    expect(() => rooms.tick()).toThrow("Storage unavailable");
    expect(rooms.games.get(id as string)!.getStateForPlayer().currentRound).toMatchObject({ phase: "bid", bidRevealEndsAt: 104_500 });
    failedSave.mockRestore();
    rooms.tick();
    rooms = new Rooms(directory, () => now);
    expect(await execute(query, { id })).toMatchObject({ state: { currentRound: { phase: "play", bidRevealEndsAt: null, revealedBids: [{ playerId: "Anne", count: 0 }, { playerId: "Mary", count: 1 }, { playerId: "Jack", count: 0 }] } } });
    rooms.tick();
    expect(rooms.games.get(id as string)!.getStateForPlayer().currentRound!.cardsPlayed).toEqual([]);
  } finally {
    await server.stop();
    jest.restoreAllMocks();
    rmSync(directory, { recursive: true, force: true });
  }
});
