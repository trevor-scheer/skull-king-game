import { gql, useMutation } from "@apollo/client";
import { useState } from "react";
import { usePlayerToken } from "../../../hooks/PlayerTokenContext";
import { useGameId } from "../../../hooks/useGameId";
import { SubmitBidMutation } from "../../../types/graphqlTypes";

export const BidForm: React.FunctionComponent = function () {
  const [playerToken] = usePlayerToken();
  const gameId = useGameId();

  const [count, setCount] = useState<null | number>(null);
  const [submitted, setSubmitted] = useState<boolean>(false);

  const [submitBid] = useMutation<SubmitBidMutation>(
    gql`
      mutation SubmitBid(
        $gameId: String!
        $playerToken: String!
        $count: Int!
      ) {
        submitBid(gameId: $gameId, playerToken: $playerToken, count: $count)
      }
    `,
    {
      variables: {
        gameId,
        playerToken,
        count,
      },
    }
  );

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submitBid();
        setSubmitted(true);
      }}
    >
      <input onChange={(e) => setCount(Number(e.target.value))} />
      <button type="submit" disabled={submitted}>
        Submit Bid
      </button>
    </form>
  );
};
