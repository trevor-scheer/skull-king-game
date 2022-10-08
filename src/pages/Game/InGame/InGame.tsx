import { usePlayerToken } from "../../../hooks/PlayerTokenContext";
import { useGameId } from "../../../hooks/useGameId";
import { useGameStateQuery } from "../../../types/graphqlTypes";
import { AwaitingBids } from "./AwaitingBids";
import { BidForm } from "./BidForm/BidForm";
import { Hand } from "./Hand/Hand";
import { PlayedCards } from "./PlayedCards/PlayedCards";
import { Scorecard } from "./Scorecard/Scorecard";
import { PreviousHand } from "./PreviousHand/PreviousHand";
import "./InGame.scss";

export const InGame: React.FunctionComponent = function () {
  const [playerToken] = usePlayerToken();
  const gameId = useGameId();

  // TODO: error handling
  const { data, loading } = useGameStateQuery({
    variables: { gameId: gameId!, playerToken: playerToken! },
  });

  if (loading) return <div>Loading...</div>;

  const me = data?.state?.me;
  const { phase, myBid, leader } = data?.state?.currentRound ?? {};
  return (
    <div className="InGame">
      {phase === "play" && <PlayedCards />}
      <Hand />
      {phase === "bid" && (
        <>
          {leader === me?.name ? (
            <p>You lead this round</p>
          ) : (
            <p>{`${leader} leads this round`}</p>
          )}
          {myBid ? <AwaitingBids bid={myBid} /> : <BidForm />}
        </>
      )}
      <Scorecard />
      <PreviousHand />
    </div>
  );
};
