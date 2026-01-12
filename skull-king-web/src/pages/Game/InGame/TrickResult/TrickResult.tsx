import { useEffect, useRef } from "react";
import { usePlayerToken } from "../../../../hooks/PlayerTokenContext";
import { useGameId } from "../../../../hooks/useGameId";
import {
  useTrickResultDataQuery,
  useAdvanceTrickMutation,
} from "../../../../types/graphqlTypes";
import { Card } from "../Card/Card";
import "./TrickResult.scss";

const TRANSITION_DELAY_MS = 2500;

export const TrickResult: React.FunctionComponent = function () {
  const [playerToken] = usePlayerToken();
  const gameId = useGameId();
  const advanceCalledRef = useRef(false);

  const { data, loading } = useTrickResultDataQuery({
    variables: { gameId: gameId!, playerToken: playerToken! },
    pollInterval: 1000,
  });

  const [advanceTrick] = useAdvanceTrickMutation();

  const lastCompletedHand = data?.state?.currentRound?.lastCompletedHand;
  const phase = data?.state?.currentRound?.phase;
  const cardsPlayed = lastCompletedHand?.cardsPlayed ?? [];
  const winningCard = lastCompletedHand?.winningCard;

  // Auto-advance after delay
  useEffect(() => {
    if (phase !== "trick_result" || !lastCompletedHand || advanceCalledRef.current) {
      return;
    }

    const timer = setTimeout(async () => {
      if (advanceCalledRef.current) return;
      advanceCalledRef.current = true;
      try {
        await advanceTrick({ variables: { gameId: gameId! } });
      } catch (error) {
        // Another player may have already advanced, which is fine
        console.log("Trick already advanced");
      }
    }, TRANSITION_DELAY_MS);

    return () => clearTimeout(timer);
  }, [phase, lastCompletedHand, gameId, advanceTrick]);

  // Reset the ref when phase changes away from trick_result
  useEffect(() => {
    if (phase !== "trick_result") {
      advanceCalledRef.current = false;
    }
  }, [phase]);

  if (loading || !lastCompletedHand) {
    return (
      <div className="TrickResult TrickResult--loading">
        <div className="TrickResult-loadingText">Revealing winner...</div>
      </div>
    );
  }

  return (
    <div className="TrickResult">
      <div className="TrickResult-header">
        <span className="TrickResult-title">Trick Complete!</span>
        {winningCard && (
          <span className="TrickResult-winner">
            {winningCard.playerId} wins!
          </span>
        )}
      </div>
      <ol className="TrickResult-cards">
        {cardsPlayed.map((playedCard, index: number) => {
          const { playerId, card } = playedCard;
          const isWinner = winningCard?.id === `${playerId}-${card.id}`;
          return (
            <li
              key={playerId}
              className={`TrickResult-cardWrapper${isWinner ? " TrickResult-cardWrapper--winner" : ""}`}
            >
              <Card
                card={card}
                disabled={true}
                grayOut={false}
                index={index}
              />
              <span className="TrickResult-playerLabel">{playerId}</span>
            </li>
          );
        })}
      </ol>
      <div className="TrickResult-countdown">
        Next trick starting soon...
      </div>
    </div>
  );
};
