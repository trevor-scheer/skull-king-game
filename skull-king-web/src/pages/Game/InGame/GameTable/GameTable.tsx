import { CardBack } from "../Card/CardBack";
import "./GameTable.scss";

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
  children: React.ReactNode; // The center content (played cards, bid form, etc.)
}

// Calculate positions for players around the table
function getPlayerPositions(playerCount: number) {
  // Positions go from top-left, around to top-right
  // Current player is always at the bottom (not included in this array)
  const positions: { angle: number; position: string }[] = [];

  // Calculate how many opponents we have
  const opponentCount = playerCount - 1;

  if (opponentCount === 0) return positions;

  // Distribute opponents evenly in a semicircle above the current player
  // Starting from left side, going to right side
  // 180 degrees = straight across, we use ~200 degrees arc
  const startAngle = 200; // degrees from right (pointing up-left)
  const endAngle = 340; // degrees from right (pointing up-right)
  const arcSpan = endAngle - startAngle;

  for (let i = 0; i < opponentCount; i++) {
    // Spread opponents evenly across the arc
    const angle = startAngle + (arcSpan / (opponentCount + 1)) * (i + 1);
    positions.push({
      angle,
      position: getPositionName(opponentCount, i),
    });
  }

  return positions;
}

function getPositionName(count: number, index: number): string {
  // Helper to generate readable position names for styling
  if (count === 1) return "top";
  if (count === 2) return index === 0 ? "top-left" : "top-right";
  if (count <= 4) {
    const names = ["left", "top-left", "top-right", "right"];
    return names[index] || `position-${index}`;
  }
  // For more players, just use angle-based positioning
  return `position-${index}`;
}

export const GameTable: React.FunctionComponent<GameTableProps> = ({
  players,
  currentPlayerId,
  playerTurn,
  children,
}) => {
  // Filter out current player and get opponent order
  const currentPlayerIndex = players.findIndex((p) => p.id === currentPlayerId);

  // Reorder opponents to maintain consistent relative positions
  const reorderedOpponents = currentPlayerIndex < 0 ? players : [
    ...players.slice(currentPlayerIndex + 1),
    ...players.slice(0, currentPlayerIndex),
  ].filter((p) => p.id !== currentPlayerId);

  const positions = getPlayerPositions(currentPlayerIndex < 0 ? players.length + 1 : players.length);

  return (
    <div className="GameTable">
      {/* Opponents around the table */}
      <div className="GameTable-opponents">
        {reorderedOpponents.map((opponent, index) => {
          const isTheirTurn = opponent.name === playerTurn;
          const position = positions[index];

          // Calculate position on the ellipse
          // Using CSS custom properties for positioning
          const style = {
            "--angle": `${position?.angle ?? 270}deg`,
            "--index": index,
          } as React.CSSProperties;

          return (
            <div
              key={opponent.id}
              className={`GameTable-opponent ${isTheirTurn ? "GameTable-opponent--active" : ""}`}
              style={style}
              data-position={position?.position}
            >
              <div className="GameTable-opponentName">{opponent.name}</div>
              <div className="GameTable-opponentStats">
                {opponent.isAutomated ? "Automatic hand" : opponent.bid == null ? "Bid hidden" : `Bid ${opponent.bid}`}
                {` · Won ${opponent.tricksWon} · ${opponent.handCount} cards`}
              </div>
              <div className="GameTable-opponentHand">
                {Array.from({ length: opponent.handCount }).map((_, i) => (
                  <CardBack key={i} size="small" className="GameTable-opponentCard" />
                ))}
              </div>
              {isTheirTurn && <div className="GameTable-turnIndicator" />}
            </div>
          );
        })}
      </div>

      {/* Center play area */}
      <div className="GameTable-center">{children}</div>
    </div>
  );
};
