import { useEffect, useRef, useState } from "react";
import { usePlayerToken } from "../../../../hooks/PlayerTokenContext";
import { useGameId } from "../../../../hooks/useGameId";
import {
  CardsPlayedQuery,
  useAdvanceTrickMutation,
} from "../../../../types/graphqlTypes";
import "./TrickResult.scss";
import { explainTrick } from "../../../../utils/trickExplanation";

const TRANSITION_DELAY_MS = 2500;

type CompletedTrick = NonNullable<
  NonNullable<
    NonNullable<CardsPlayedQuery["state"]>["currentRound"]
  >["lastCompletedHand"]
>;

export const TrickResult: React.FunctionComponent<{
  paused?: boolean;
  readOnly?: boolean;
  hand: CompletedTrick;
  refetch: () => Promise<unknown>;
}> = function ({
  paused = false,
  readOnly = false,
  hand: lastCompletedHand,
  refetch,
}) {
  const [playerToken] = usePlayerToken();
  const gameId = useGameId();
  const retryAdvanceRef = useRef<(() => void) | null>(null);
  const [advanceFailed, setAdvanceFailed] = useState(false);
  const [advancing, setAdvancing] = useState(false);

  const [advanceTrick] = useAdvanceTrickMutation();
  const handId = lastCompletedHand.id;
  const winningCard = lastCompletedHand.winningCard;

  useEffect(() => {
    setAdvanceFailed(false);
    setAdvancing(false);
    if (readOnly || paused || !handId || !gameId || !playerToken) {
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
        await advanceTrick({
          variables: {
            gameId,
            playerToken: playerToken!,
            expectedHandId: handId,
          },
        });
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
  }, [readOnly, paused, handId, gameId, playerToken, advanceTrick, refetch]);

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
      <p className="TrickResult-explanation">
        {explainTrick(lastCompletedHand)}
      </p>
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
          {readOnly
            ? "Watching the next trick..."
            : paused
              ? "Waiting for the pirate ability..."
              : advancing
                ? "Continuing the game..."
                : "Next trick starting soon..."}
        </div>
      )}
    </div>
  );
};
