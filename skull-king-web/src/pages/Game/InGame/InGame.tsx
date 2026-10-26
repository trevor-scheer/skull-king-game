import { ReactNode, useState } from "react";
import { Dialog } from "../../../components/Dialog";
import { CannonLoad } from "./CannonLoad/CannonLoad";
import { usePlayerToken } from "../../../hooks/PlayerTokenContext";
import { useGameId } from "../../../hooks/useGameId";
import { useGameStateQuery } from "../../../types/graphqlTypes";
import { BidRitual } from "./BidRitual/BidRitual";
import { AwaitingBids } from "./AwaitingBids";
import { BidForm } from "./BidForm/BidForm";
import { GameTable } from "./GameTable/GameTable";
import { Hand } from "./Hand/Hand";
import { PlayedCards } from "./PlayedCards/PlayedCards";
import { Scorecard } from "./Scorecard/Scorecard";
import { PirateAbility } from "./PirateAbility/PirateAbility";
import "./InGame.scss";
import { ReferenceCard } from "./TableHelp/ReferenceCard";
import { RulesReference } from "./TableHelp/RulesReference";
import { TableFeedback } from "./TableHelp/TableFeedback";
import "./TableHelp/TableHelp.scss";
import { TurnStatus } from "./TurnStatus/TurnStatus";
import { tableActivity } from "./TurnStatus/tableActivity";
import { PlankChoice } from "./PlankChoice/PlankChoice";

export const InGame: React.FunctionComponent<{
  spectator?: boolean;
  utilities?: ReactNode;
}> = function ({ spectator = false, utilities }) {
  const [panel, setPanel] = useState<"scores" | "tools" | "reference" | null>(
    null,
  );
  const [playerToken] = usePlayerToken();
  const gameId = useGameId();

  // TODO: error handling
  const { data, loading, error, refetch } = useGameStateQuery({
    variables: {
      gameId: gameId!,
      playerToken: spectator ? "" : (playerToken ?? ""),
    },
    pollInterval: 10000,
  });

  if (error && !data)
    return (
      <p role="alert">
        Couldn’t load the table.{" "}
        <button onClick={() => void refetch().catch(() => undefined)}>
          Retry
        </button>
      </p>
    );
  if (loading && !data) return <div className="InGame-loading">Loading...</div>;

  const scorecard = data?.state?.scorecard ?? [];
  const totals = new Map(
    scorecard[scorecard.length - 1]?.map(({ playerName, totalPoints }) => [
      playerName,
      totalPoints,
    ]),
  );
  const players = (data?.state?.players ?? []).map((player) => ({
    ...player,
    totalScore: player.isAutomated ? undefined : (totals.get(player.name) ?? 0),
  }));
  const me = data?.state?.me;
  const currentRound = data?.state?.currentRound;

  const { phase, myBid, leader } = currentRound ?? {};
  const activity = tableActivity(data?.state, spectator);
  return (
    <div
      className={`InGame${phase === "bid" ? " InGame--bidding" : ""}${activity.yourTurn ? " InGame--yourTurn" : ""}`}
    >
      <header className="TableStatus">
        <div className="TableStatus-heading">
          <h1>{spectator ? "Watching the table" : "Your table"}</h1>
          <div className="TableStatus-actions">
            <button
              onClick={() => setPanel("reference")}
              aria-haspopup="dialog"
            >
              Reference card
            </button>
            <button onClick={() => setPanel("scores")} aria-haspopup="dialog">
              Scorecard
            </button>
            <button onClick={() => setPanel("tools")} aria-haspopup="dialog">
              Table options
            </button>
          </div>
        </div>
        <p className="TableStatus-round">
          Round {currentRound?.roundNumber} · {currentRound?.cardsPerPlayer}{" "}
          cards each · Trick{" "}
          {(currentRound?.hands.length ?? 0) +
            (phase === "trick_result" ? 0 : 1)}
          {currentRound?.isTieBreaker ? " · Tie-breaker" : ""}
          {me ? ` · You’ve won ${me.tricksWon}` : ""}
        </p>
        <TurnStatus activity={activity} />
        {phase === "play" && (
          <p className="TableStatus-suit">
            {currentRound?.trickColor
              ? `Lead suit: ${currentRound.trickColor.toLowerCase()}. Follow it if you can, or play a special card.`
              : "No lead suit is set."}
          </p>
        )}
        {spectator && (
          <p>
            You can see public plays, revealed bids, and scores. Players’ hands
            and private choices stay hidden.
          </p>
        )}
      </header>
      <GameTable
        players={players}
        currentPlayerId={me?.id ?? ""}
        playerTurn={activity.actor ?? ""}
        activeLabel={activity.seatLabel}
      >
        {phase === "load" &&
          (spectator ? <p>Waiting for cannon loads.</p> : <CannonLoad />)}
        {/* Center content based on game phase */}
        <PlayedCards
          readOnly={spectator}
          paused={Boolean(currentRound?.pirateAbility)}
        />
        {phase === "bid" && (
          <div className="InGame-bidPhase">
            <p className="InGame-leaderInfo">
              {leader === me?.name
                ? "You lead this round"
                : `${leader} leads this round`}
            </p>
            {currentRound?.bidRevealEndsAt ? (
              <BidRitual endsAt={currentRound.bidRevealEndsAt} />
            ) : spectator ? (
              <p>Waiting for bids to be revealed.</p>
            ) : myBid !== null && myBid !== undefined ? (
              <AwaitingBids bid={myBid} />
            ) : (
              <BidForm />
            )}
          </div>
        )}
      </GameTable>
      {!spectator &&
        currentRound?.pirateAbility?.playerId === me?.id &&
        currentRound?.pirateAbility && (
          <Dialog
            open
            onClose={() => undefined}
            title="Pirate ability"
            dismissible={false}
          >
            <PirateAbility />
          </Dialog>
        )}
      {!spectator &&
        currentRound?.plankChoice?.playerId === me?.id &&
        currentRound?.plankChoice && (
          <Dialog
            open
            onClose={() => undefined}
            title="Walk the Plank"
            dismissible={false}
          >
            <PlankChoice />
          </Dialog>
        )}

      {/* Player's hand at the bottom */}
      {!spectator && (
        <Hand
          totalScore={totals.get(me?.name ?? "") ?? 0}
          tricksWon={me?.tricksWon ?? 0}
        />
      )}

      <Dialog
        open={panel === "tools"}
        onClose={() => setPanel(null)}
        title="Table options"
      >
        <div className="TableHelp-row">
          {data?.state && <RulesReference settings={data.state} />}
          {!spectator && (
            <TableFeedback
              yourTurn={Boolean(activity.yourTurn)}
              trickId={currentRound?.lastCompletedHand?.id}
              roundKey={
                currentRound ? `${gameId}:${currentRound.id}` : undefined
              }
              playedCardEvent={
                currentRound?.cardsPlayed.length
                  ? `${currentRound.id}:${currentRound.cardsPlayed.map((card) => card.id).join(",")}`
                  : undefined
              }
            />
          )}
        </div>

        {utilities}
      </Dialog>
      <Dialog
        open={panel === "reference"}
        onClose={() => setPanel(null)}
        title="Reference card"
        className="ReferenceDialog"
      >
        {data?.state && <ReferenceCard settings={data.state} />}
      </Dialog>
      <Dialog
        open={panel === "scores"}
        onClose={() => setPanel(null)}
        title="Scorecard"
        className="ScoreDialog"
      >
        <Scorecard />
      </Dialog>
    </div>
  );
};
