import { useEffect, useRef, useState } from "react";
import "./GameTable.scss";
import { CardBack } from "../Card/CardBack";

interface PlayerInfo {
  id: string;
  name: string;
  handCount: number;
  isAutomated: boolean;
  bid?: number | null;
  tricksWon: number;
  totalScore?: number;
}

interface GameTableProps {
  players: PlayerInfo[];
  currentPlayerId: string;
  playerTurn: string;
  activeLabel?: string;
  children: React.ReactNode;
}

export const GameTable: React.FunctionComponent<GameTableProps> = ({
  players,
  currentPlayerId,
  playerTurn,
  activeLabel = "Playing now",
  children,
}) => {
  const opponentsRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const strip = opponentsRef.current;
    const active = strip?.querySelector<HTMLElement>(
      ".GameTable-opponent--active",
    );
    if (!strip || !active || strip.scrollWidth <= strip.clientWidth) return;
    const stripRect = strip.getBoundingClientRect();
    const activeRect = active.getBoundingClientRect();
    const reduced = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    strip.scrollTo({
      left:
        strip.scrollLeft +
        activeRect.left -
        stripRect.left -
        (stripRect.width - activeRect.width) / 2,
      behavior: reduced ? "auto" : "smooth",
    });
  }, [playerTurn]);
  const currentPlayerIndex = players.findIndex(
    (player) => player.id === currentPlayerId,
  );
  const opponents =
    currentPlayerIndex < 0
      ? players
      : [
          ...players.slice(currentPlayerIndex + 1),
          ...players.slice(0, currentPlayerIndex),
        ];

  const sideRows = Math.max(1, Math.ceil(opponents.length / 2));

  return (
    <section
      className={`GameTable${opponents.length > 4 ? " GameTable--largeCrew" : ""}`}
      aria-label="Game table"
      style={{ "--side-rows": Math.max(1, sideRows) } as React.CSSProperties}
    >
      <div
        className="GameTable-opponents"
        ref={opponentsRef}
        style={{ "--seat-count": opponents.length } as React.CSSProperties}
      >
        {opponents.map((opponent, index) => {
          const isTheirTurn = opponent.id === playerTurn;
          const onLeft = index < sideRows;
          const seatStyle = {
            "--seat-column": onLeft ? "1" : "5",
            "--seat-row": onLeft
              ? `${sideRows - index}`
              : `${index - sideRows + 1}`,
          } as React.CSSProperties;
          return (
            <div
              key={opponent.id}
              data-player-seat={opponent.name}
              aria-current={isTheirTurn ? "true" : undefined}
              style={seatStyle}
              className={`GameTable-opponent${isTheirTurn ? " GameTable-opponent--active" : ""}`}
            >
              <div className="GameTable-opponentHand" aria-hidden="true">
                {Array.from({ length: opponent.handCount }, (_, cardIndex) => (
                  <span
                    key={cardIndex}
                    style={
                      {
                        "--back-angle": `${(cardIndex - (opponent.handCount - 1) / 2) * Math.min(7, 45 / Math.max(1, opponent.handCount))}deg`,
                        "--back-offset": `${(cardIndex - (opponent.handCount - 1) / 2) * Math.min(10, 70 / Math.max(1, opponent.handCount - 1))}px`,
                      } as React.CSSProperties
                    }
                  >
                    <CardBack />
                  </span>
                ))}
              </div>
              <span className="GameTable-avatar" aria-hidden="true">
                {opponent.name.charAt(0).toUpperCase()}
              </span>
              <div className="GameTable-opponentIdentity">
                <div className="GameTable-opponentName" title={opponent.name}>
                  {opponent.name}
                </div>
                {opponent.totalScore !== undefined && (
                  <span className="GameTable-opponentScore">
                    Total <strong>{opponent.totalScore}</strong> pts
                  </span>
                )}
                <span className="GameTable-opponentStatus">
                  {isTheirTurn
                    ? `▶ ${activeLabel}`
                    : `${opponent.handCount} cards in hand`}
                </span>
              </div>
              <div className="GameTable-opponentStats">
                <span>
                  {opponent.isAutomated ? (
                    "Automatic hand"
                  ) : (
                    <BidToken bid={opponent.bid} />
                  )}
                </span>
                <span>
                  Won <strong>{opponent.tricksWon}</strong>
                </span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="GameTable-center">{children}</div>
    </section>
  );
};

function BidToken({ bid }: { bid?: number | null }) {
  const previousBid = useRef(bid);
  const [revealing, setRevealing] = useState(false);
  useEffect(() => {
    const justRevealed = previousBid.current == null && bid != null;
    previousBid.current = bid;
    setRevealing(justRevealed);
    if (!justRevealed) return;
    const timer = window.setTimeout(() => setRevealing(false), 500);
    return () => window.clearTimeout(timer);
  }, [bid]);
  if (bid == null) return <>Bid hidden</>;
  return (
    <span
      className={`GameTable-bidToken${revealing ? " GameTable-bidToken--revealing" : ""}`}
    >
      <span>Bid </span>
      <strong>{bid}</strong>
    </span>
  );
}
