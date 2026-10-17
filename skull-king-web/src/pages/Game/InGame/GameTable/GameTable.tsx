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
}

interface GameTableProps {
  players: PlayerInfo[];
  currentPlayerId: string;
  playerTurn: string;
  children: React.ReactNode;
}

export const GameTable: React.FunctionComponent<GameTableProps> = ({
  players,
  currentPlayerId,
  playerTurn,
  children,
}) => {
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

  const topCount =
    opponents.length <= 3 ? opponents.length : opponents.length % 2 ? 3 : 2;
  const sideRows = Math.ceil((opponents.length - topCount) / 2);

  return (
    <section
      className="GameTable"
      aria-label="Game table"
      style={{ "--side-rows": Math.max(1, sideRows) } as React.CSSProperties}
    >
      <div
        className="GameTable-opponents"
        style={{ "--seat-count": opponents.length } as React.CSSProperties}
      >
        {opponents.map((opponent, index) => {
          const isTheirTurn = opponent.name === playerTurn;
          const topIndex = index - sideRows;
          const onLeft = index < sideRows;
          const onTop = topIndex >= 0 && topIndex < topCount;
          const seatStyle = {
            "--seat-column": onLeft
              ? "1"
              : onTop
                ? `${topCount === 1 ? 3 : topCount === 2 ? 2 + topIndex * 2 : topIndex + 2}`
                : "5",
            "--seat-row": onLeft
              ? `${sideRows - index + 1}`
              : onTop
                ? "1"
                : `${index - sideRows - topCount + 2}`,
          } as React.CSSProperties;
          return (
            <div
              key={opponent.id}
              data-player-seat={opponent.name}
              style={seatStyle}
              className={`GameTable-opponent${isTheirTurn ? " GameTable-opponent--active" : ""}`}
            >
              <div className="GameTable-opponentHand" aria-hidden="true">
                {Array.from(
                  { length: Math.min(opponent.handCount, 7) },
                  (_, cardIndex) => (
                    <span
                      key={cardIndex}
                      style={
                        {
                          "--back-angle": `${(cardIndex - (Math.min(opponent.handCount, 7) - 1) / 2) * 9}deg`,
                        } as React.CSSProperties
                      }
                    >
                      <CardBack size="small" />
                    </span>
                  ),
                )}
              </div>
              <span className="GameTable-avatar" aria-hidden="true">
                {opponent.name.charAt(0).toUpperCase()}
              </span>
              <div className="GameTable-opponentIdentity">
                <div className="GameTable-opponentName" title={opponent.name}>
                  {opponent.name}
                </div>
                <span className="GameTable-opponentStatus">
                  {isTheirTurn
                    ? "Playing"
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
