import { gql, useMutation } from "@apollo/client";
import { useState } from "react";
import { usePlayerToken } from "../../hooks/PlayerTokenContext";
import { useGameId } from "../../hooks/useGameId";
import { SubmitBidMutation } from "../../types/graphqlTypes";

export const BidForm: React.FunctionComponent = function () {
  const [playerToken] = usePlayerToken();
  const gameId = useGameId();

  const [count, setCount] = useState<null | number>(null);

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
      }}
    >
      <input onChange={(e) => setCount(Number(e.target.value))} />
      <button
        // onClick={(e) => {
        //   e.preventDefault();
        // }}
        type="submit"
      >
        Submit Bid
      </button>
    </form>
  );
};
