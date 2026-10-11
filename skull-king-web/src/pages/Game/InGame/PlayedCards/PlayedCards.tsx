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
    variables: { gameId: gameId!, playerToken: playerToken ?? "" },
    pollInterval: 10000,
  });

  const { phase, cardsPlayed } = data?.state?.currentRound ?? {};

  if (loading && !data) {
    return (
      <div className="PlayedCards PlayedCards--loading">
        <div className="PlayedCards-loadingText">Waiting for plays...</div>
      </div>
    );
  }

  if (!cardsPlayed || cardsPlayed.length === 0) {
    return (
      <div className="PlayedCards PlayedCards--empty">
        <div className="PlayedCards-emptyText">
          {phase === "play" ? "Play a card to begin the trick" : ""}
        </div>
      </div>
    );
  }

  return (
    <div className="PlayedCards">
      <div className="PlayedCards-header">
        <span className="PlayedCards-title">Current Trick</span>
        <span className="PlayedCards-count">
          {cardsPlayed.length} card{cardsPlayed.length !== 1 ? "s" : ""} played
        </span>
      </div>
      {phase === "play" && (
        <ol className="PlayedCards-cards">
          {cardsPlayed.map(({ playerId, card }, index) => (
            <li key={`${playerId}-${card.id}`} className="PlayedCards-cardWrapper">
              <Card
                as="div"
                card={card}
                disabled={true}
                grayOut={false}
                index={index}
              />
              <span className="PlayedCards-playerLabel">{playerId}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
};
