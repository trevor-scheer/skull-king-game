import { useEffect, useRef, useState } from "react";
import { usePlayerToken } from "../../../../hooks/PlayerTokenContext";
import { useGameId } from "../../../../hooks/useGameId";
import {
  useTrickResultDataQuery,
  useAdvanceTrickMutation,
} from "../../../../types/graphqlTypes";
import { Card } from "../Card/Card";
import "./TrickResult.scss";

const TRANSITION_DELAY_MS = 2500;

export const TrickResult: React.FunctionComponent<{ paused?: boolean }> = function ({ paused = false }) {
  const [playerToken] = usePlayerToken();
  const gameId = useGameId();
  const retryAdvanceRef = useRef<(() => void) | null>(null);
  const [advanceFailed, setAdvanceFailed] = useState(false);
  const [advancing, setAdvancing] = useState(false);

  const { data, loading, error, refetch } = useTrickResultDataQuery({
    variables: { gameId: gameId!, playerToken: playerToken! },
    pollInterval: 10000,
    skip: !gameId || !playerToken,
  });

  const [advanceTrick] = useAdvanceTrickMutation();

  const lastCompletedHand = data?.state?.currentRound?.lastCompletedHand;
  const handId = lastCompletedHand?.id;
  const phase = data?.state?.currentRound?.phase;
  const cardsPlayed = lastCompletedHand?.cardsPlayed ?? [];
  const winningCard = lastCompletedHand?.winningCard;

  useEffect(() => {
    setAdvanceFailed(false);
    setAdvancing(false);
    if (paused || phase !== "trick_result" || !handId || !gameId || !playerToken) {
      return;
    }

    let active = true;
    let pending = false;
    const advance = async () => {
      if (!active || pending) return;
      pending = true;
      setAdvancing(true);
      setAdvanceFailed(false);
      try {
        await advanceTrick({ variables: { gameId, playerToken: playerToken!, expectedHandId: handId } });
        // Both a successful advance and an already-advanced result need fresh state.
        if (active) await refetch();
      } catch {
        if (active) setAdvanceFailed(true);
      } finally {
        pending = false;
        if (active) setAdvancing(false);
      }
    };

    retryAdvanceRef.current = () => void advance();
    const timer = setTimeout(() => void advance(), TRANSITION_DELAY_MS);

    return () => {
      active = false;
      clearTimeout(timer);
      retryAdvanceRef.current = null;
    };
  }, [paused, phase, handId, gameId, playerToken, advanceTrick, refetch]);

  if (error && !lastCompletedHand) {
    return (
      <div className="TrickResult TrickResult--loading">
        <p role="alert">Couldn’t load the trick result.</p>
        <button
          className="TrickResult-retry"
          onClick={() => void refetch().catch(() => undefined)}
          disabled={loading}
        >
          Retry
        </button>
      </div>
    );
  }

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
      {advanceFailed ? (
        <div className="TrickResult-recovery">
          <p role="alert">Couldn’t continue the game. Please try again.</p>
          <button
            className="TrickResult-retry"
            onClick={() => retryAdvanceRef.current?.()}
            disabled={advancing}
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="TrickResult-countdown" role="status">
          {paused ? "Waiting for the pirate ability..." : advancing ? "Continuing the game..." : "Next trick starting soon..."}
        </div>
      )}
    </div>
  );
};
