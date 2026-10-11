import { LobbyBots } from "../Practice/PracticeControls";
import { useState } from "react";
import { usePlayerToken } from "../../../hooks/PlayerTokenContext";
import { useGameId } from "../../../hooks/useGameId";
import { useLobbyQueryQuery } from "../../../types/graphqlTypes";
import { JoinGame } from "../JoinGame/JoinGame";
import { StartGame } from "../StartGame/StartGame";
import "./Lobby.scss";

export const Lobby: React.FunctionComponent = function () {
  const gameId = useGameId() ?? ""; // TODO: hacky fallback
  const [playerToken, setToken] = usePlayerToken();
  const [copied, setCopied] = useState(false);
  const variables = { gameId, playerToken };

  const { data, loading, error } = useLobbyQueryQuery({
    variables,
    pollInterval: 2000,
  });

  function onJoin(playerToken: string | null) {
    if (!playerToken) return; // TODO: throw error?
    setToken(playerToken, gameId);
  }

  if (error && !data) return <p role="alert">Couldn’t load the lobby. Reconnecting…</p>;

  if (loading) return <div>Loading...</div>;

  return (
    <div className="Lobby">
      <section aria-label="Invite friends">
        <label>Invite link<input aria-label="Invite link" value={window.location.href} readOnly onFocus={event => event.target.select()} /></label>
        <button onClick={() => { void navigator.clipboard?.writeText(window.location.href).then(() => setCopied(true)).catch(() => setCopied(false)); }}>{copied ? "Copied!" : "Copy invite link"}</button>
      </section>
      <LobbyBots />
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
            · {data.state.roundSchedule.length} rounds ({data.state.roundSchedule.join(", ")} cards)
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
            <li>Expansion numbers & Mary: {data.state.deckConfig.includeExpansion ? "On" : "Off"}</li>
            <li>First Mate: {data.state.deckConfig.includeFirstMate ? "On" : "Off"}</li>
            <li>Spotted Stingray: {data.state.deckConfig.includeStingray ? "On" : "Off"}</li>
            <li>Davy Jones: {data.state.deckConfig.includeDavyJones ? "On" : "Off"}</li>
            <li>Walk the Plank: {data.state.deckConfig.includeWalkThePlank ? "On" : "Off"}</li>
            <li>Last Volley: {data.state.deckConfig.includeLastVolley ? "On" : "Off"}</li>
            <li>Loot: {data.state.deckConfig.includeLoot ? "On" : "Off"}</li>
          </ul>
          <p>These rules stay fixed for the game.</p>
          <p>{data.state.tieBreakers ? "Tied leaders play extra rounds." : "Tied leaders share victory."} {data.state.cannonball && "Cannonball choices enabled."}</p>
          <p>Up to {data.state.maxPlayers} players. With two humans, Graybeard joins automatically; Loot, Wild 15, Walk the Plank, and 0/14 cards are removed.</p>
        </section>
      )}
      {!data?.state?.me ? <JoinGame onJoin={onJoin} /> : data.state.me.id === data.state.players.find(player => !player.isBot)?.id ? <StartGame /> : <p>Waiting for {data.state.players.find(player => !player.isBot)?.name} to set sail.</p>}
    </div>
  );
};
