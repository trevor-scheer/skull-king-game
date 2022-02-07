import { gql, useQuery } from "@apollo/client";
import { usePlayerToken } from "../../../hooks/PlayerTokenContext";
import { useGameId } from "../../../hooks/useGameId";
import { CardsPlayedQuery } from "../../../types/graphqlTypes";
import { Card } from "./Card";
import "./PlayedCards.scss";

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
            phase
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

  const { phase, cardsPlayed } = data?.state?.currentRound ?? {};

  if (loading) return <div>Loading...</div>;
  if (!cardsPlayed) return null;

  return (
    <div className="PlayedCards">
      <p>Cards played:</p>
      {phase === "play" && (
        <ol>
          {cardsPlayed.map(({ playerId, card }) => (
            <Card card={card} disabled={true} key={playerId} />
          ))}
        </ol>
      )}
    </div>
  );
};
