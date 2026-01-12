import { usePlayerToken } from "../../../../hooks/PlayerTokenContext";
import { useGameId } from "../../../../hooks/useGameId";
import { useCardsPlayedQuery } from "../../../../types/graphqlTypes";
import { Card } from "../Card/Card";
import "./PlayedCards.scss";

export const PlayedCards: React.FunctionComponent = function () {
  const [playerToken] = usePlayerToken();
  const gameId = useGameId();

  // TODO: error handling
  const { data, loading } = useCardsPlayedQuery({
    variables: { gameId: gameId!, playerToken: playerToken! },
    pollInterval: 2000,

  });

  const { phase, cardsPlayed } = data?.state?.currentRound ?? {};

  if (loading) return <div>Loading...</div>;
  if (!cardsPlayed) return null;

  return (
    <div className="PlayedCards">
      <p>Cards played:</p>
      {phase === "play" && (
        <ol className="PlayedCards-cards">
          {cardsPlayed.map(({ playerId, card }, index) => (
            <Card
              card={card}
              disabled={true}
              grayOut={false}
              key={playerId}
              index={index}
            />
          ))}
        </ol>
      )}
    </div>
  );
};
