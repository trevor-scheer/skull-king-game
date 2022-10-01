import { gql, useQuery } from "@apollo/client";
import { usePlayerToken } from "../../../hooks/PlayerTokenContext";
import { useGameId } from "../../../hooks/useGameId";
import { GameStateQuery } from "../../../types/graphqlTypes";
import { AwaitingBids } from "./AwaitingBids";
import { BidForm } from './BidForm/BidForm';
import { Hand } from "./Hand";
import { PlayedCards } from "./PlayedCards";
import { Scorecard } from "./Scorecard/Scorecard";
import "./InGame.scss";
import { PreviousHand } from "./PreviousHand/PreviousHand";

export const InGame: React.FunctionComponent = function () {
  const [playerToken] = usePlayerToken();
  const gameId = useGameId();

  // TODO: error handling
  const { data, loading } = useQuery<GameStateQuery>(
    gql`
      query GameState($gameId: String!, $playerToken: String!) {
        state(gameId: $gameId, playerToken: $playerToken) {
          id
          players {
            id
            name
          }
          me {
            id
            name
          }
          currentRound {
            id
            phase
            leader
            playerTurn
            myBid
          }
        }
      }
    `,
    {
      variables: { gameId, playerToken },
      pollInterval: 2000,
    }
  );

  if (loading) return <div>Loading...</div>;

  const me = data?.state?.me;
  const { phase, myBid, leader } = data?.state?.currentRound ?? {};
  return (
    <div className="InGame">
      <PlayedCards />
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
