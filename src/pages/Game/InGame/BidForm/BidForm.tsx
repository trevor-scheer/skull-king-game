import { useEffect, useState } from "react";
import { usePlayerToken } from "../../../../hooks/PlayerTokenContext";
import { useGameId } from "../../../../hooks/useGameId";
import { useSubmitBidMutation, useRoundNumberQuery } from "../../../../types/graphqlTypes";

export const BidForm: React.FunctionComponent = function () {
  const [playerToken] = usePlayerToken();
  const gameId = useGameId() ?? ""; // TODO: hacky fallback

  const [submitted, setSubmitted] = useState<boolean>(false);

  const [submitBid] = useSubmitBidMutation();

  const { data, loading } = useRoundNumberQuery({
    variables: { gameId, playerToken: playerToken! },
    pollInterval: 2000,
  })

  function handleSubmit(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    const count = parseInt(event.currentTarget.id);
    console.log(count);
    setSubmitted(true);
    submitBid({
      variables: { gameId, playerToken: playerToken!, count },
    });
  }

  useEffect(() => {
    const audio = new Audio("/audio/smb3_coin.wav");
    try {
      audio.play();
    } catch (e) {
      console.error(e);
    }
  }, []);

  if (loading) {
    return <p>Loading...</p>;
  }

  const roundNumber = Array.from([
    ...new Array(data?.state?.currentRound?.roundNumber! + 1),
  ]).map((_, i) => i);


  return (
    <div style={{display: "flex"}}>
      {roundNumber.map((count) => (
        <button
          id={String(count)}
          key={count}
          onClick={handleSubmit}
          disabled={submitted}
        >
          {count}
        </button>
      ))}
    </div>
  );
};
