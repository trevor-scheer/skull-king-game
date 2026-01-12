import { usePlayerToken } from "../../../hooks/PlayerTokenContext";
import { useGameId } from "../../../hooks/useGameId";
import { useGameStateQuery } from "../../../types/graphqlTypes";
import { AwaitingBids } from "./AwaitingBids";
import { BidForm } from "./BidForm/BidForm";
import { GameTable } from "./GameTable/GameTable";
import { Hand } from "./Hand/Hand";
import { PlayedCards } from "./PlayedCards/PlayedCards";
import { Scorecard } from "./Scorecard/Scorecard";
import "./InGame.scss";

// Extended type for currentRound with fields that may not be in generated types yet
interface ExtendedRound {
  roundNumber?: number;
  cardsPlayed?: { id: string }[];
}

export const InGame: React.FunctionComponent = function () {
  const [playerToken] = usePlayerToken();
  const gameId = useGameId();

  // TODO: error handling
  const { data, loading } = useGameStateQuery({
    variables: { gameId: gameId!, playerToken: playerToken! },
    pollInterval: 2000,
  });

  if (loading) return <div className="InGame-loading">Loading...</div>;

  const players = data?.state?.players ?? [];
  const me = data?.state?.me;
  const currentRound = data?.state?.currentRound;
  const extendedRound = currentRound as typeof currentRound & ExtendedRound;

  const { phase, myBid, leader, playerTurn } = currentRound ?? {};
  const roundNumber = extendedRound?.roundNumber ?? 1;

  // Count cards played in current trick
  const cardsPlayedCount = extendedRound?.cardsPlayed?.length ?? 0;

  return (
    <div className="InGame">
      <GameTable
        players={players}
        currentPlayerId={me?.id ?? ""}
        playerTurn={playerTurn ?? ""}
        roundNumber={roundNumber}
        cardsPlayedCount={cardsPlayedCount}
      >
        {/* Center content based on game phase */}
        {phase === "play" && <PlayedCards />}
        {phase === "bid" && (
          <div className="InGame-bidPhase">
            <p className="InGame-leaderInfo">
              {leader === me?.name
                ? "You lead this round"
                : `${leader} leads this round`}
            </p>
            {myBid !== null && myBid !== undefined ? (
              <AwaitingBids bid={myBid} />
            ) : (
              <BidForm />
            )}
          </div>
        )}
      </GameTable>

      {/* Player's hand at the bottom */}
      <Hand />

      {/* Scorecard */}
      <Scorecard />
    </div>
  );
};
