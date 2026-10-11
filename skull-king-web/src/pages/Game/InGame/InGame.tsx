import { CannonLoad } from "./CannonLoad/CannonLoad";
import { usePlayerToken } from "../../../hooks/PlayerTokenContext";
import { useGameId } from "../../../hooks/useGameId";
import { useGameStateQuery } from "../../../types/graphqlTypes";
import { AwaitingBids } from "./AwaitingBids";
import { BidForm } from "./BidForm/BidForm";
import { GameTable } from "./GameTable/GameTable";
import { Hand } from "./Hand/Hand";
import { PlayedCards } from "./PlayedCards/PlayedCards";
import { Scorecard } from "./Scorecard/Scorecard";
import { TrickResult } from "./TrickResult/TrickResult";
import { PirateAbility } from "./PirateAbility/PirateAbility";
import "./InGame.scss";
import { PlankChoice } from "./PlankChoice/PlankChoice";

export const InGame: React.FunctionComponent = function () {
  const [playerToken] = usePlayerToken();
  const gameId = useGameId();

  // TODO: error handling
  const { data, loading } = useGameStateQuery({
    variables: { gameId: gameId!, playerToken: playerToken! },
    pollInterval: 10000,
  });

  if (loading) return <div className="InGame-loading">Loading...</div>;

  const players = data?.state?.players ?? [];
  const me = data?.state?.me;
  const currentRound = data?.state?.currentRound;

  const { phase, myBid, leader, playerTurn } = currentRound ?? {};
  return (
    <div className="InGame">
      <GameTable
        players={players}
        currentPlayerId={me?.id ?? ""}
        playerTurn={playerTurn ?? ""}
      >
        {phase === "load" && <CannonLoad />}
        {/* Center content based on game phase */}
        {phase === "play" && <PlayedCards />}
        {phase === "trick_result" && <TrickResult paused={Boolean(currentRound?.pirateAbility)} />}
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
      {currentRound?.pirateAbility && <PirateAbility />}
      <PlankChoice />

      {me && <p className="InGame-myStats">{me.bid == null ? "Your bid is hidden" : `Your bid: ${me.bid}`} · Won {me.tricksWon}</p>}

      {/* Player's hand at the bottom */}
      <Hand />

      {/* Scorecard */}
      <Scorecard />
    </div>
  );
};
