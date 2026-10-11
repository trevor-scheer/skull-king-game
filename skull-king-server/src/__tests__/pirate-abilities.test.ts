import { ApolloServer } from "@apollo/server";
import { pirateGame } from "../../../skull-king-core/testUtils/pirateGame";
import type { Context } from "../index";
import typeDefs from "../typeDefs";
import resolvers from "../resolvers";

describe("pirate abilities through GraphQL", () => {
  let server: ApolloServer<Context>;
  beforeEach(() => { server = new ApolloServer<Context>({ typeDefs, resolvers }); });
  afterEach(async () => { await server.stop(); });

  const stateQuery = `query State($token: String) {
    state(gameId: "pirates", playerToken: $token) {
      pirateAbilities
      currentRound { pirateAbility { id name stage privateCards { ... on ColoredCard { id } ... on SpecialCard { id } } } }
      me { hand { ... on ColoredCard { id } ... on SpecialCard { id } } }
    }
  }`;
  const choiceMutation = `mutation Choice($token:String!, $id:String!, $input:PirateAbilityInput!) {
    usePirateAbility(gameId:"pirates",playerToken:$token,expectedAbilityId:$id,input:$input)
  }`;

  async function execute(game: ReturnType<typeof pirateGame>["game"], query: string, variables: Record<string, unknown> = {}) {
    const response = await server.executeOperation({ query, variables }, { contextValue: { games: new Map([["pirates", game]]) } });
    if (response.body.kind !== "single") throw new Error("Expected single result");
    return response.body.singleResult;
  }

  it("exposes the opt-in setting and defaults it to false", async () => {
    const games = new Map();
    for (const enabled of [false, true]) {
      const result = await server.executeOperation<{ newGame: string }>({
        query: enabled ? "mutation {newGame(pirateAbilities:true)}" : "mutation {newGame}",
      }, { contextValue: { games } });
      if (result.body.kind !== "single") throw new Error("Expected single result");
      expect(result.body.singleResult.errors).toBeUndefined();
      expect(games.get(result.body.singleResult.data!.newGame).getStateForPlayer().pirateAbilities).toBe(enabled);
    }
  });

  it("keeps Juanita's undealt cards private even when other clients know the ability ID", async () => {
    const { game, alice, bob, deck } = pirateGame("pirate-3");
    const id = game.getStateForPlayer().currentRound!.pirateAbility!.id;
    const unauthorized = await execute(game, choiceMutation, { token: bob, id, input: { action: "reveal" } });
    expect(unauthorized.errors?.[0].message).toMatch("winning player");
    const reveal = await execute(game, choiceMutation, { token: alice, id, input: { action: "reveal" } });
    expect(reveal.errors).toBeUndefined();
    for (const token of [undefined, bob, "invalid", alice]) {
      const result = await execute(game, stateQuery, { token });
      expect(result.errors).toBeUndefined();
      const state = result.data!.state as { currentRound: { pirateAbility: { stage: string; privateCards: { id: string }[] } } };
      expect(state.currentRound.pirateAbility.stage).toBe("view");
      expect(state.currentRound.pirateAbility.privateCards).toHaveLength(token === alice ? deck.getUndealtCards().length : 0);
    }
  });

  it("makes Bendt draw/discard retries safe at the API boundary", async () => {
    const { game, alice, bob } = pirateGame("pirate-4");
    const id = game.getStateForPlayer().currentRound!.pirateAbility!.id;
    for (let attempt = 0; attempt < 2; attempt++) {
      const result = await execute(game, choiceMutation, { token: alice, id, input: { action: "draw" } });
      expect(result.errors).toBeUndefined();
      expect(result.data!.usePirateAbility).toBe(attempt === 0);
    }
    const hand = game.getStateForPlayer(alice).me!.hand;
    expect(hand).toHaveLength(3);
    const discardId = game.getStateForPlayer().currentRound!.pirateAbility!.id;
    const invalid = await execute(game, choiceMutation, { token: bob, id: discardId, input: { action: "discard", cardIds: [hand[0].id, hand[1].id] } });
    expect(invalid.errors?.[0].message).toMatch("winning player");
    for (let attempt = 0; attempt < 2; attempt++) {
      const result = await execute(game, choiceMutation, { token: alice, id: discardId, input: { action: "discard", cardIds: [hand[0].id, hand[1].id] } });
      expect(result.errors).toBeUndefined();
      expect(result.data!.usePirateAbility).toBe(attempt === 0);
    }
    expect(game.getStateForPlayer(alice).me!.hand).toHaveLength(1);
    const invalidToken = await execute(game, choiceMutation, { token: "invalid", id, input: { action: "draw" } });
    expect(invalidToken.errors?.[0].message).toMatch("token");
  });
});
