import { gql, useMutation, useQuery } from "@apollo/client";
import { usePlayerToken } from "../../hooks/PlayerTokenContext";
import { useGameId } from "../../hooks/useGameId";
import { MyHandQuery } from "../../types/graphqlTypes";

export const Hand: React.FunctionComponent<{ canPlay: boolean }> = function ({
  canPlay,
}) {
  const [playerToken] = usePlayerToken();
  const gameId = useGameId();

  const { data, loading, error } = useQuery<MyHandQuery>(
    gql`
      query MyHand($gameId: String!, $playerToken: String!) {
        state(gameId: $gameId, playerToken: $playerToken) {
          id
          me {
            id
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

  if (loading) return <div>Loading...</div>;
  return (
    <ul>
      {data?.state?.me?.hand.map((card) => {
        if (card.__typename === "ColoredCard") {
          return (
            <button
              key={card.color + card.number}
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
              disabled={!canPlay}
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
