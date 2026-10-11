import { usePlayerToken } from "../../../hooks/PlayerTokenContext";
import { useGameId } from "../../../hooks/useGameId";
import { useLobbyQueryQuery } from "../../../types/graphqlTypes";
import { JoinGame } from "../JoinGame/JoinGame";
import { StartGame } from "../StartGame/StartGame";
import "./Lobby.scss";

export const Lobby: React.FunctionComponent = function () {
  const gameId = useGameId() ?? ""; // TODO: hacky fallback
  const [playerToken, setToken] = usePlayerToken();
  const variables = { gameId, playerToken };

  const { data, loading, error } = useLobbyQueryQuery({
    variables,
    pollInterval: 2000,
  });

  function onJoin(playerToken: string | null) {
    if (!playerToken) return; // TODO: throw error?
    setToken(playerToken, gameId);
  }

  if (error) console.error(error);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="Lobby">
      <p className="Lobby-header">Players in lobby</p>
      <ol className="Lobby-playerList">
        {data?.state?.players.map((player) => (
          <li key={player.name}>{player.name}</li>
        ))}
      </ol>
      {data?.state && (
        <section className="Lobby-rules" aria-label="Game rules">
          <h2>Rules for this voyage</h2>
          <p>
            {data.state.scoringMode === "rascal" ? "Rascal" : "Classic"} scoring
            · Ten rounds
          </p>
          <p>Pirate abilities: {data.state.pirateAbilities ? "On" : "Off"}</p>
          <ul>
            <li>
              Mermaids: {data.state.deckConfig.includeMermaids ? "On" : "Off"}
            </li>
            <li>
              Kraken: {data.state.deckConfig.includeKraken ? "On" : "Off"}
            </li>
            <li>
              White Whale:{" "}
              {data.state.deckConfig.includeWhiteWhale ? "On" : "Off"}
            </li>
            <li>Loot: {data.state.deckConfig.includeLoot ? "On" : "Off"}</li>
          </ul>
          <p>These rules stay fixed for the game.</p>
          <p>Two-player games omit Graybeard. Ties end after ten rounds without a tiebreaker.</p>
        </section>
      )}
      {playerToken ? <StartGame /> : <JoinGame onJoin={onJoin} />}
    </div>
  );
};
