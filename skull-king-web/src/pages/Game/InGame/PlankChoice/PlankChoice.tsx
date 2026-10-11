import { useState } from "react";
import { useGameId } from "../../../../hooks/useGameId";
import { usePlayerToken } from "../../../../hooks/PlayerTokenContext";
import {
  useChoosePlankTargetMutation,
  usePlankChoiceStateQuery,
} from "../../../../types/graphqlTypes";
import { PIRATE_NAMES } from "../../../../utils/pirateNames";

export function PlankChoice() {
  const gameId = useGameId() ?? "";
  const [token] = usePlayerToken();
  const playerToken = token ?? "";
  const { data, refetch } = usePlankChoiceStateQuery({
    variables: { gameId, playerToken },
    skip: !gameId || !playerToken,
    pollInterval: 10000,
  });
  const [choose, { loading }] = useChoosePlankTargetMutation();
  const [error, setError] = useState<string | null>(null);
  const choice = data?.state?.currentRound?.plankChoice;
  if (!choice) return null;
  if (choice.playerId !== data?.state?.me?.id)
    return (
      <p role="status">
        Waiting for {choice.playerId} to choose a Pirate to walk the plank.
      </p>
    );
  return (
    <section className="PirateAbility" aria-label="Walk the Plank choice">
      <h2>Walk the Plank</h2>
      <p>
        Remove one Pirate from this trick. It cannot win or earn capture points.
      </p>
      {error && <p role="alert">{error}</p>}
      {choice.cardIds.map((cardId) => (
        <button
          key={cardId}
          disabled={loading}
          onClick={async () => {
            setError(null);
            try {
              await choose({
                variables: {
                  gameId,
                  playerToken,
                  expectedChoiceId: choice.id,
                  cardId,
                },
              });
              await refetch();
            } catch {
              setError("Couldn’t save that choice. Please try again.");
            }
          }}
        >
          {PIRATE_NAMES[cardId] ?? "Mary Thorne"}
        </button>
      ))}
    </section>
  );
}
