import { ApolloServer } from "@apollo/server";
import { Game } from "../../../skull-king-core/src/game";
import type { Context } from "../index";
import resolvers from "../resolvers";
import typeDefs from "../typeDefs";

const create = `mutation Create($deck: DeckConfigInput, $scoring: ScoringMode, $powers: Boolean) {
  newGame(deckConfig: $deck, scoringMode: $scoring, pirateAbilities: $powers)
}`;
const read = `query Rules($id: String!) {
  state(gameId: $id) {
    scoringMode pirateAbilities
    deckConfig { includeMermaids includeKraken includeWhiteWhale includeLoot }
  }
}`;

describe("game configuration through GraphQL", () => {
  let server: ApolloServer<Context>;
  let context: Context;

  beforeEach(() => {
    context = { games: new Map() };
    server = new ApolloServer<Context>({ typeDefs, resolvers });
  });
  afterEach(async () => {
    await server.stop();
  });

  async function execute(query: string, variables = {}) {
    const response = await server.executeOperation(
      { query, variables },
      { contextValue: context },
    );
    if (response.body.kind !== "single")
      throw new Error("Expected one response");
    return response.body.singleResult;
  }

  test("omitted settings use the current standard deck and classic rules", async () => {
    const created = await execute(create);
    expect(created.errors).toBeUndefined();
    const id = created.data!.newGame as string;
    const rules = await execute(read, { id });
    expect(rules.errors).toBeUndefined();
    expect(rules.data!.state).toEqual({
      scoringMode: "classic",
      pirateAbilities: false,
      deckConfig: {
        includeMermaids: true,
        includeKraken: false,
        includeWhiteWhale: false,
        includeLoot: false,
      },
    });
    expect(
      context.games.get(id)!.__debugDump().deck.__debugDeck().originalDeck,
    ).toHaveLength(70);
  });

  test.each([
    { deck: { includeLoot: true }, count: 72, mermaids: true },
    { deck: { includeMermaids: false }, count: 68, mermaids: false },
  ])(
    "partial deck config $deck preserves explicit choices and defaults",
    async ({ deck, count, mermaids }) => {
      const created = await execute(create, { deck });
      expect(created.errors).toBeUndefined();
      const id = created.data!.newGame as string;
      const rules = await execute(read, { id });
      expect(rules.errors).toBeUndefined();
      expect(rules.data!.state).toMatchObject({
        deckConfig: {
          includeMermaids: mermaids,
          includeLoot: "includeLoot" in deck ? deck.includeLoot : false,
          includeKraken: false,
          includeWhiteWhale: false,
        },
      });
      expect(
        context.games.get(id)!.__debugDump().deck.__debugDeck().originalDeck,
      ).toHaveLength(count);
    },
  );

  test.each(Array.from({ length: 16 }, (_, mask) => mask))(
    "deck combination %i controls the actual cards",
    async (mask) => {
      const deck = {
        includeMermaids: Boolean(mask & 1),
        includeKraken: Boolean(mask & 2),
        includeWhiteWhale: Boolean(mask & 4),
        includeLoot: Boolean(mask & 8),
      };
      const created = await execute(create, {
        deck,
        scoring: "rascal",
        powers: true,
      });
      expect(created.errors).toBeUndefined();
      const id = created.data!.newGame as string;
      const rules = await execute(read, { id });
      expect(rules.errors).toBeUndefined();
      expect(rules.data!.state).toEqual({
        scoringMode: "rascal",
        pirateAbilities: true,
        deckConfig: deck,
      });
      const cards = context.games
        .get(id)!
        .__debugDump()
        .deck.__debugDeck().originalDeck;
      for (const [type, count] of Object.entries({
        mermaid: deck.includeMermaids ? 2 : 0,
        kraken: deck.includeKraken ? 1 : 0,
        whiteWhale: deck.includeWhiteWhale ? 1 : 0,
        loot: deck.includeLoot ? 2 : 0,
      })) {
        expect(
          cards.filter((card) => "type" in card && card.type === type),
        ).toHaveLength(count);
      }
    },
  );

  test("unknown scoring methods are rejected before a game is created", async () => {
    const result = await execute(create, { scoring: "anything" });
    expect(result.errors).toBeDefined();
    expect(context.games.size).toBe(0);
    expect(
      () => new Game("invalid", { scoringMode: "anything" as never }),
    ).toThrow("Unknown scoring mode");
  });

  test("explicit null settings use defaults", async () => {
    const created = await execute(create, {
      deck: null,
      scoring: null,
      powers: null,
    });
    expect(created.errors).toBeUndefined();
    const result = await execute(read, { id: created.data!.newGame });
    expect(result.errors).toBeUndefined();
    expect(result.data!.state).toMatchObject({
      scoringMode: "classic",
      pirateAbilities: false,
    });
  });
});
