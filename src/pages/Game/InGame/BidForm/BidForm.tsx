import { useState } from "react";
import { usePlayerToken } from "../../../../hooks/PlayerTokenContext";
import { useGameId } from "../../../../hooks/useGameId";
import {
  useSubmitBidMutation,
  useRoundNumberQuery,
} from "../../../../types/graphqlTypes";
import "./BidForm.scss";

export const BidForm: React.FunctionComponent = function () {
  const [playerToken] = usePlayerToken();
  const gameId = useGameId() ?? ""; // TODO: hacky fallback

  const [submitted, setSubmitted] = useState<boolean>(false);
  const [selectedBid, setSelectedBid] = useState<number | null>(null);

  const [submitBid] = useSubmitBidMutation();

  const { data, loading } = useRoundNumberQuery({
    variables: { gameId, playerToken: playerToken! },
    pollInterval: 2000,
  });

  function handleSubmit(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    const count = parseInt(event.currentTarget.id);
    setSelectedBid(count);
    setSubmitted(true);
    submitBid({
      variables: { gameId, playerToken: playerToken!, count },
    });
  }

  if (loading) {
    return (
      <div className="BidForm BidForm--loading">
        <p className="BidForm-loadingText">Loading bids...</p>
      </div>
    );
  }

  const roundNumber = data?.state?.currentRound?.roundNumber ?? 0;
  const bidOptions = Array.from({ length: roundNumber + 1 }, (_, i) => i);

  return (
    <div className="BidForm">
      <h3 className="BidForm-title">Place Your Bid</h3>
      <p className="BidForm-subtitle">
        How many tricks will ye win this round?
      </p>
      <div className="BidForm-buttons">
        {bidOptions.map((count) => (
          <button
            className={`BidForm-button ${
              selectedBid === count ? "BidForm-button--selected" : ""
            }`}
            id={String(count)}
            key={count}
            onClick={handleSubmit}
            disabled={submitted}
          >
            {count}
          </button>
        ))}
      </div>
      {submitted && selectedBid !== null && (
        <p className="BidForm-confirmation">
          Bid placed: <strong>{selectedBid}</strong>
        </p>
      )}
    </div>
  );
};
