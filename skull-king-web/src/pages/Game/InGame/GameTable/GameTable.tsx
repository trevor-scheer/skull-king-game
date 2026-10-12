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

  return (
    <section className="GameTable" aria-label="Game table">
      <div
        className="GameTable-opponents"
        style={{ "--seat-count": opponents.length } as React.CSSProperties}
      >
        {opponents.map((opponent) => {
          const isTheirTurn = opponent.name === playerTurn;
          return (
            <div
              key={opponent.id}
              className={`GameTable-opponent${isTheirTurn ? " GameTable-opponent--active" : ""}`}
            >
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
                  {opponent.isAutomated
                    ? "Automatic hand"
                    : opponent.bid == null
                      ? "Bid hidden"
                      : `Bid ${opponent.bid}`}
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
