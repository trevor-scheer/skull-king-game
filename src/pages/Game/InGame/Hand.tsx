import { gql, useMutation, useQuery } from "@apollo/client";
import { usePlayerToken } from "../../../hooks/PlayerTokenContext";
import { useGameId } from "../../../hooks/useGameId";
import { MyHandQuery } from "../../../types/graphqlTypes";

export const Hand: React.FunctionComponent = function () {
  const [playerToken] = usePlayerToken();
  const gameId = useGameId();

  const { data, loading, error } = useQuery<MyHandQuery>(
    gql`
      query MyHand($gameId: String!, $playerToken: String!) {
        state(gameId: $gameId, playerToken: $playerToken) {
          id
          me {
            id
            name
            hand {
              __typename
              ... on SpecialCard {
                type
              }
              ... on ColoredCard {
                color
                number
              }
            }
          }
          currentRound {
            phase
            playerTurn
          }
        }
      }
    `,
    {
      variables: { gameId, playerToken },
      pollInterval: 2000,
    }
  );

  const [playSpecialCard] = useMutation(gql`
    mutation PlaySpecialCard(
      $gameId: String!
      $playerToken: String!
      $card: String!
    ) {
      playSpecialCard(gameId: $gameId, playerToken: $playerToken, card: $card)
    }
  `);

  const [playColoredCard] = useMutation(gql`
    mutation PlayColoredCard(
      $gameId: String!
      $playerToken: String!
      $color: String!
      $number: Int!
    ) {
      playColoredCard(
        gameId: $gameId
        playerToken: $playerToken
        color: $color
        number: $number
      )
    }
  `);

  const phase = data?.state?.currentRound?.phase;
  const playerTurn = data?.state?.currentRound?.playerTurn;
  const me = data?.state?.me?.name;
  const canPlay = phase === "play" && playerTurn === me;

  if (loading) return <div>Loading...</div>;
  return (
    <ul>
      {data?.state?.me?.hand.map((card) => {
        if (card.__typename === "ColoredCard") {
          return (
            <button
              key={card.color + card.number}
              disabled={!canPlay}
              onClick={() =>
                playColoredCard({
                  variables: {
                    gameId,
                    playerToken,
                    color: card.color,
                    number: card.number,
                  },
                })
              }
            >
              <li>
                {card.color} {card.number}
              </li>
            </button>
          );
        } else if (card.__typename === "SpecialCard") {
          return (
            <button
              key={card.type}
              disabled={!canPlay}
              onClick={() =>
                playSpecialCard({
                  variables: { gameId, playerToken, card: card.type },
                })
              }
            >
              <li>{card.type}</li>
            </button>
          );
        } else {
          throw Error("Unknown card type");
        }
      })}
    </ul>
  );
};
