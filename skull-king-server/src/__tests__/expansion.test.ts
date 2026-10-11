import { ApolloServer } from "@apollo/server";
import { Game } from "../../../skull-king-core/src/game";
import { Deck } from "../../../skull-king-core/src/deck";
import { buildDeck, isColoredCard } from "../../../skull-king-core/src/cards";
import type { Context } from "../index";
import typeDefs from "../typeDefs";
import resolvers from "../resolvers";

const deckConfig = {
  includeExpansion: true,
  includeFirstMate: true,
  includeStingray: true,
  includeDavyJones: true,
  includeWalkThePlank: true,
  includeLastVolley: true,
  includeKraken: true,
  includeWhiteWhale: true,
  includeLoot: true,
};
let server: ApolloServer<Context>;
beforeEach(() => {
  server = new ApolloServer<Context>({ typeDefs, resolvers });
});
afterEach(async () => {
  await server.stop();
});
async function execute(
  game: Game,
  query: string,
  variables: Record<string, unknown> = {},
) {
  const response = await server.executeOperation(
    { query, variables },
    { contextValue: { games: new Map([["expansion", game]]) } },
  );
  if (response.body.kind !== "single") throw Error("Expected one result");
  return response.body.singleResult;
}

test("Mary’s forced card is private at the GraphQL boundary", async () => {
  const game = new Game("expansion", { deckConfig, pirateAbilities: true });
  const tokens = [
    game.addPlayer("A"),
    game.addPlayer("B"),
    game.addPlayer("C"),
  ];
  game.start();
  const { players, currentRound: round } = game.__debugDump();
  round!.roundNumber = 2;
  round!.phase = "play";
  round!.leader = 0;
  const cards = buildDeck(deckConfig);
  [
    ["maryThorne", "yellow-1"],
    ["escape-1", "purple-1"],
    ["escape-2", "green-1"],
  ].forEach((ids, i) => {
    players[i].hand = ids.map((id) => cards.find((card) => card.id === id)!);
    round!.bids.set(players[i].id, 0);
  });
  for (let i = 0; i < 3; i++)
    game.playCard({ playerToken: tokens[i], cardId: players[i].hand[0].id });
  const response = await execute(
    game,
    `mutation($token:String!,$id:String!){usePirateAbility(gameId:"expansion",playerToken:$token,expectedAbilityId:$id,input:{action:forceCard,playerId:"B"})}`,
    { token: tokens[0], id: round!.pirateAbility!.id },
  );
  expect(response.errors).toBeUndefined();
  for (const token of [undefined, "invalid", ...tokens]) {
    const state = await execute(
      game,
      `query($token:String){state(gameId:"expansion",playerToken:$token){currentRound{myForcedCardId}}}`,
      { token },
    );
    expect(state.errors).toBeUndefined();
    expect(state.data!.state).toEqual({
      currentRound: { myForcedCardId: token === tokens[1] ? "purple-1" : null },
    });
  }
});

test.each([3, 6])(
  "finishes ten rounds with all expansion cards, %i players and API choices",
  async (count) => {
    const game = new Game("expansion", {
      deck: new Deck({ deckConfig, shuffleSeed: 0.999 }),
      pirateAbilities: true,
    });
    const tokens = new Map(
      Array.from({ length: count }, (_, i) => {
        const name = String(i);
        return [name, game.addPlayer(name)];
      }),
    );
    game.start();
    const seen = new Set<string>();
    let steps = 0;
    while (game.getStateForPlayer().phase !== "postgame") {
      if (++steps > 1000) throw Error("Match stopped progressing");
      const state = game.getStateForPlayer();
      const round = state.currentRound!;
      if (round.phase === "bid") {
        for (const token of tokens.values())
          game.submitBid({ playerToken: token, count: 0 });
        continue;
      }
      if (round.pirateAbility) {
        game.usePirateAbility(
          tokens.get(round.pirateAbility.playerId)!,
          round.pirateAbility.id,
          round.pirateAbility.canDecline
            ? { action: "decline" }
            : {
                action: "forceCard",
                playerId: game.__debugDump().players.find((p) => p.hand.length)!
                  .id,
              },
        );
        continue;
      }
      if (round.plankChoice) {
        const response = await execute(
          game,
          `mutation($token:String!,$id:String!,$card:String!){choosePlankTarget(gameId:"expansion",playerToken:$token,expectedChoiceId:$id,cardId:$card)}`,
          {
            token: tokens.get(round.plankChoice.playerId),
            id: round.plankChoice.id,
            card: round.plankChoice.cardIds[0],
          },
        );
        expect(response.errors).toBeUndefined();
        continue;
      }
      if (round.phase === "trick_result") {
        game.advanceFromTrickResult(round.lastCompletedHand!.id);
        continue;
      }
      const token = tokens.get(round.playerTurn!)!;
      const hand = game.getStateForPlayer(token).me!.hand;
      let played = false;
      for (const card of hand) {
        const colored = isColoredCard(card);
        const query = colored
          ? `mutation($token:String!,$card:String!,$number:Int,$color:Color){playColoredCard(gameId:"expansion",playerToken:$token,cardId:$card,numberChoice:$number,colorChoice:$color)}`
          : `mutation($token:String!,$card:String!,$selection:String){playSpecialCard(gameId:"expansion",playerToken:$token,cardId:$card,selection:$selection)}`;
        const result = await execute(game, query, {
          token,
          card: card.id,
          number: colored && card.choice ? 14 : undefined,
          color:
            colored && card.wild
              ? round.trickColor && round.trickColor !== "BLACK"
                ? round.trickColor
                : "YELLOW"
              : undefined,
          selection: !colored && card.type === "tigress" ? "escape" : undefined,
        });
        if (!result.errors) {
          seen.add(card.id);
          played = true;
          break;
        }
        expect(result.errors[0].message).toBe("Illegal move");
      }
      expect(played).toBe(true);
    }
    expect(game.getStateForPlayer().scorecard).toHaveLength(10);
    for (const id of [
      "lastVolley",
      "walkThePlank",
      "davyJones",
      "stingray",
      "firstMate",
      "maryThorne",
      "wild-15",
      "black-zero-fourteen",
    ])
      expect(seen.has(id)).toBe(true);
  },
);
