import { gql, useQuery } from "@apollo/client";
import { usePlayerToken } from "../../hooks/PlayerTokenContext";
import { useGameId } from "../../hooks/useGameId";
import { GameStateQuery } from "../../types/graphqlTypes";
import { BidForm } from './InGame/BidForm';
import { Hand } from "./InGame/Hand";

export const InGame: React.FunctionComponent = function () {
  const [playerToken] = usePlayerToken();
  const gameId = useGameId();

  const { data, loading, error } = useQuery<GameStateQuery>(
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
            phase
            playerTurn
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

  const phase = data?.state?.currentRound.phase;
  return (
    <div>
      In Game: {playerToken}
      <Hand />
      {phase === "bid" && <BidForm />}
    </div>
  );
};
