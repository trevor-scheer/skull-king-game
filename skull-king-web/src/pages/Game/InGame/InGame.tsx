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
import { RulesReference } from "./TableHelp/RulesReference";
import { TableFeedback } from "./TableHelp/TableFeedback";
import "./TableHelp/TableHelp.scss";
import { PlankChoice } from "./PlankChoice/PlankChoice";

export const InGame: React.FunctionComponent<{ spectator?: boolean }> =
  function ({ spectator = false }) {
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
    if (loading && !data)
      return <div className="InGame-loading">Loading...</div>;

    const players = data?.state?.players ?? [];
    const me = data?.state?.me;
    const currentRound = data?.state?.currentRound;

    const { phase, myBid, leader, playerTurn } = currentRound ?? {};
    return (
      <div className={`InGame${phase === "bid" ? " InGame--bidding" : ""}`}>
        <header className="TableStatus">
          <h1>{spectator ? "Watching the table" : "Your table"}</h1>
          <p>
            Round {currentRound?.roundNumber} · {currentRound?.cardsPerPlayer}{" "}
            cards each · Trick{" "}
            {(currentRound?.hands.length ?? 0) +
              (phase === "trick_result" ? 0 : 1)}
            {currentRound?.isTieBreaker ? " · Tie-breaker" : ""}
            {me ? ` · You’ve won ${me.tricksWon}` : ""}
          </p>
          <p role="status">
            {phase === "bid"
              ? "Players are choosing secret bids."
              : phase === "load"
                ? "Players are choosing secret cannon loads."
                : currentRound?.plankChoice
                  ? `${currentRound.plankChoice.playerId} is choosing a Pirate to remove.`
                  : currentRound?.pirateAbility
                    ? `${currentRound.pirateAbility.playerId} is choosing ${currentRound.pirateAbility.name}’s power.`
                    : playerTurn
                      ? `${playerTurn === me?.id && !spectator ? "Your" : `${playerTurn}’s`} turn.`
                      : "Trick complete."}
          </p>
          {phase === "play" && (
            <p className="TableStatus-suit">
              {currentRound?.trickColor
                ? `Lead suit: ${currentRound.trickColor.toLowerCase()}. Follow it if you can, or play a special card.`
                : "No lead suit is set."}
            </p>
          )}
          {spectator && (
            <p>
              You can see public plays, revealed bids, and scores. Players’
              hands and private choices stay hidden.
            </p>
          )}
        </header>
        <GameTable
          players={players}
          currentPlayerId={me?.id ?? ""}
          playerTurn={playerTurn ?? ""}
        >
          {phase === "load" &&
            (spectator ? <p>Waiting for cannon loads.</p> : <CannonLoad />)}
          {/* Center content based on game phase */}
          {phase === "play" && <PlayedCards />}
          {phase === "trick_result" && (
            <TrickResult
              readOnly={spectator}
              paused={Boolean(currentRound?.pirateAbility)}
            />
          )}
          {phase === "bid" && (
            <div className="InGame-bidPhase">
              <p className="InGame-leaderInfo">
                {leader === me?.name
                  ? "You lead this round"
                  : `${leader} leads this round`}
              </p>
              {spectator ? (
                <p>Waiting for bids to be revealed.</p>
              ) : myBid !== null && myBid !== undefined ? (
                <AwaitingBids bid={myBid} />
              ) : (
                <BidForm />
              )}
            </div>
          )}
        </GameTable>
        {!spectator && currentRound?.pirateAbility && <PirateAbility />}
        {!spectator && <PlankChoice />}

        {/* Player's hand at the bottom */}
        {!spectator && <Hand />}

        <div className="TableHelp-row">
          {data?.state && <RulesReference settings={data.state} />}
          {!spectator && (
            <TableFeedback
              yourTurn={playerTurn === me?.id}
              trickId={currentRound?.lastCompletedHand?.id}
            />
          )}
        </div>

        {/* Scorecard */}
        <Scorecard />
      </div>
    );
  };
