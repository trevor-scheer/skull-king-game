import { gql, useQuery } from "@apollo/client";
import { usePlayerToken } from "../../../hooks/PlayerTokenContext";
import { useGameId } from "../../../hooks/useGameId";
import { CardsPlayedQuery } from "../../../types/graphqlTypes";
import { Card } from "./Card";

export const PlayedCards: React.FunctionComponent = function () {
  const [playerToken] = usePlayerToken();
  const gameId = useGameId();

  // TODO: error handling
  const { data, loading } = useQuery<CardsPlayedQuery>(
    gql`
      query CardsPlayed($gameId: String!, $playerToken: String!) {
        state(gameId: $gameId, playerToken: $playerToken) {
          id
          currentRound {
            id
            cardsPlayed {
              playerId
              card {
                __typename
                ... on SpecialCard {
                  id
                  type
                  selection
                }
                ... on ColoredCard {
                  id
                  color
                  number
                }
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

  const cardsPlayed = data?.state?.currentRound?.cardsPlayed;

  if (loading) return <div>Loading...</div>;
  if (!cardsPlayed) return null;

  return (
    <>
      <p>Cards played</p>
      <ol>
        {cardsPlayed.map(({ playerId, card }) => (
          <li key={playerId}>
            <Card card={card} disabled={true} />
          </li>
        ))}
      </ol>
    </>
  );
};
