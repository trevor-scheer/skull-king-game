import { ApolloServer } from "@apollo/server";
import { Game } from "../../../skull-king-core/src/game";
import { Deck } from "../../../skull-king-core/src/deck";
import { isSpecialCard } from "../../../skull-king-core/src/cards";
import type { Context } from "../index";
import resolvers from "../resolvers";
import typeDefs from "../typeDefs";

it.each(["classic", "rascal"] as const)("completes an official two-human %s match with private automatic hands", async (scoringMode) => {
  const deckConfig = { includeLoot: true, includeKraken: true, includeWhiteWhale: true };
  const game = new Game("graybeard", { scoringMode, pirateAbilities: true, deckConfig, deck: new Deck({ deckConfig, shuffleSeed: 0.99 }) });
  const tokens = new Map([["Alice", game.addPlayer("Alice")], ["Bob", game.addPlayer("Bob")]]);
  const server = new ApolloServer<Context>({ typeDefs, resolvers });
  const context: Context = { games: new Map([["graybeard", game]]) };
  async function execute(query: string, variables: Record<string, unknown> = {}) {
    const result = await server.executeOperation({ query, variables }, { contextValue: context });
    if (result.body.kind !== "single") throw Error("Expected single response");
    expect(result.body.singleResult.errors).toBeUndefined();
    return result.body.singleResult.data as any;
  }
  async function read(token?: string) {
    return (await execute(`query State($token: String) { state(gameId:"graybeard", playerToken:$token) {
      phase legalCardIds deckConfig { includeLoot }
      players { id isAutomated handCount bid tricksWon hand { ... on ColoredCard { id } ... on SpecialCard { id } } }
      me { id hand { ... on ColoredCard { id color number } ... on SpecialCard { id type selection } } }
      currentRound { roundNumber phase playerTurn pirateAbility { id playerId } lastCompletedHand { id winningCard { playerId } cardsPlayed { playerId card { ... on ColoredCard { id } ... on SpecialCard { id } } } } }
      scorecard { playerName tricksWon }
    } }`, { token })).state;
  }
  let completed = 0;
  let ghostWins = 0;
  try {
    await execute(`mutation { startGame(gameId:"graybeard") }`);
    while ((await read()).phase !== "postgame") {
      expect(completed).toBeLessThan(60);
      let state = await read();
      expect(state.players).toHaveLength(3);
      expect(state.players.every((player: any) => player.hand.length === 0)).toBe(true);
      expect(state.deckConfig.includeLoot).toBe(false);
      const ghost = state.players.find((player: any) => player.isAutomated);
      expect(ghost.bid).toBeNull();
      if (state.currentRound.phase === "bid") {
        expect(state.players.every((player: any) => player.bid == null)).toBe(true);
        for (const token of tokens.values()) await execute(`mutation Bid($token:String!) { submitBid(gameId:"graybeard",playerToken:$token,count:0) }`, { token });
      }
      state = await read();
      let humanTurns = 0;
      while (state.currentRound.phase === "play") {
        const token = tokens.get(state.currentRound.playerTurn)!;
        expect(token).toBeDefined();
        const mine = await read(token);
        const cardId = mine.legalCardIds[0];
        expect(cardId).toBeDefined();
        const card = mine.me.hand.find((candidate: any) => candidate.id === cardId);
        if (isSpecialCard(card)) await execute(`mutation Play($token:String!,$id:String!,$selection:String) { playSpecialCard(gameId:"graybeard",playerToken:$token,cardId:$id,selection:$selection) }`, { token, id: cardId, selection: card.type === "tigress" ? "escape" : null });
        else await execute(`mutation Play($token:String!,$id:String!) { playColoredCard(gameId:"graybeard",playerToken:$token,cardId:$id) }`, { token, id: cardId });
        state = await read();
        expect(++humanTurns).toBeLessThanOrEqual(2);
      }
      expect(humanTurns).toBe(2);
      const hand = state.currentRound.lastCompletedHand;
      expect(hand.cardsPlayed).toHaveLength(3);
      expect(new Set(hand.cardsPlayed.map((play: any) => play.playerId)).size).toBe(3);
      if (hand.winningCard?.playerId === ghost.id) {
        ghostWins++;
        expect(state.currentRound.pirateAbility).toBeNull();
      }
      const ability = state.currentRound.pirateAbility;
      if (ability) await execute(`mutation Decline($token:String!,$id:String!) { usePirateAbility(gameId:"graybeard",playerToken:$token,expectedAbilityId:$id,input:{action:decline}) }`, { token: tokens.get(ability.playerId), id: ability.id });
      expect((await execute(`mutation Advance($id:String!) { advanceTrick(gameId:"graybeard",expectedHandId:$id) }`, { id: hand.id })).advanceTrick).toBe(true);
      completed++;
    }
    expect(completed).toBe(55);
    expect(ghostWins).toBeGreaterThan(0);
    const state = await read();
    expect(state.scorecard).toHaveLength(10);
    expect(state.scorecard.every((round: any[]) => round.length === 2 && round.every((score: any) => tokens.has(score.playerName)))).toBe(true);
  } finally { await server.stop(); }
});
