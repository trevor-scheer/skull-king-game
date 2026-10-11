import { client } from "../client";
import { GameStateDocument, GameStateQuery } from "../types/graphqlTypes";

test("caches a completed trick from the game-state polling query", () => {
  client.cache.restore({});
  const variables = { gameId: "game-1", playerToken: "player-token" };
  const data: GameStateQuery = {
    state: {
      __typename: "GameState",
      id: variables.gameId,
      players: [
        { __typename: "Player", id: "Anne", name: "Anne" },
        { __typename: "Player", id: "Mary", name: "Mary" },
      ],
      me: { __typename: "Player", id: "Anne", name: "Anne" },
      currentRound: {
        __typename: "Round",
        id: 1,
        roundNumber: 1,
        phase: "trick_result",
        leader: "Mary",
        playerTurn: null,
        myBid: 0,
        cardsPlayed: [
          { __typename: "PlayedCard", id: "Anne-yellow-1", playerId: "Anne" },
          { __typename: "PlayedCard", id: "Mary-yellow-2", playerId: "Mary" },
        ],
      },
    },
  };

  expect(() =>
    client.cache.writeQuery({ query: GameStateDocument, variables, data })
  ).not.toThrow();
  expect(
    client.cache.readQuery<GameStateQuery>({ query: GameStateDocument, variables })
  ).toEqual(data);
});
