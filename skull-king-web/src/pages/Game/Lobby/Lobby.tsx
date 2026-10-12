import { LobbyBots } from "../Practice/PracticeControls";
import { useState } from "react";
import { usePlayerToken } from "../../../hooks/PlayerTokenContext";
import { useGameId } from "../../../hooks/useGameId";
import { useLobbyQueryQuery } from "../../../types/graphqlTypes";
import { JoinGame } from "../JoinGame/JoinGame";
import { StartGame } from "../StartGame/StartGame";
import "./Lobby.scss";

export const Lobby: React.FunctionComponent = function () {
  const gameId = useGameId() ?? "";
  const [playerToken, setToken] = usePlayerToken();
  const [copied, setCopied] = useState(false);
  const { data, loading, error } = useLobbyQueryQuery({
    variables: { gameId, playerToken },
    pollInterval: 10000,
  });
  function onJoin(token: string | null) {
    if (token) setToken(token, gameId);
  }
  if (error && !data)
    return <p role="alert">Couldn’t load the lobby. Reconnecting…</p>;
  if (loading)
    return <div className="Lobby-loading">Preparing your voyage…</div>;
  const state = data?.state;
  const host = state?.players.find((player) => !player.isBot);
  const cardRules = state
    ? ([
        ["Mermaids", state.deckConfig.includeMermaids],
        ["Kraken", state.deckConfig.includeKraken],
        ["White Whale", state.deckConfig.includeWhiteWhale],
        ["Loot", state.deckConfig.includeLoot],
        ["Expansion numbers & Mary", state.deckConfig.includeExpansion],
        ["First Mate", state.deckConfig.includeFirstMate],
        ["Spotted Stingray", state.deckConfig.includeStingray],
        ["Davy Jones", state.deckConfig.includeDavyJones],
        ["Walk the Plank", state.deckConfig.includeWalkThePlank],
        ["Last Volley", state.deckConfig.includeLastVolley],
      ] as const)
    : [];
  return (
    <div className="Lobby">
      <header className="Lobby-heading">
        <div>
          <p className="Lobby-eyebrow">The harbor</p>
          <h1>Gather your crew.</h1>
          <p>Invite your friends. Claim your seat. The sea is waiting.</p>
        </div>
        <span className="Lobby-status">
          <span aria-hidden="true" />
          Boarding open
        </span>
      </header>
      <div className="Lobby-layout">
        <div className="Lobby-main">
          <section className="Lobby-crew" aria-label="Players in lobby">
            <div className="Lobby-sectionHeading">
              <h2>Players in lobby</h2>
              <span>
                {state?.players.length ?? 0} / {state?.maxPlayers ?? 8} seats
              </span>
            </div>
            <ol className="Lobby-playerList">
              {state?.players.map((player, index) => (
                <li key={player.id}>
                  <span className="Lobby-avatar" aria-hidden="true">
                    {player.name.slice(0, 1).toUpperCase()}
                  </span>
                  <span className="Lobby-playerName">
                    {player.name}
                    <small>
                      {player.isBot
                        ? "Practice pirate"
                        : player.id === host?.id
                          ? "Captain · Host"
                          : "Crew member"}
                      {player.id === state.me?.id ? " · You" : ""}
                    </small>
                  </span>
                  <span className="Lobby-seatNumber">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </li>
              ))}
            </ol>
            {!state?.players.length && (
              <div className="Lobby-empty">
                <span aria-hidden="true">01</span>
                <p>
                  Every voyage starts with a captain.
                  <br />
                  <strong>Take the first seat.</strong>
                </p>
              </div>
            )}
            <div className="Lobby-boarding">
              {!state?.me ? (
                <JoinGame onJoin={onJoin} />
              ) : state.me.id === host?.id ? (
                <StartGame />
              ) : (
                <p className="Lobby-waiting">
                  Your seat is saved. Waiting for {host?.name} to set sail.
                </p>
              )}
            </div>
          </section>
          <LobbyBots />
        </div>
        <aside className="Lobby-sidebar">
          <section className="Lobby-invite" aria-label="Invite friends">
            <p className="Lobby-eyebrow">Better with your crew</p>
            <h2>Send an invitation</h2>
            <p>Share this link to bring everyone to the same table.</p>
            <label>
              Invite link
              <input
                aria-label="Invite link"
                value={window.location.href}
                readOnly
                onFocus={(event) => event.target.select()}
              />
            </label>
            <button
              onClick={() => {
                void navigator.clipboard
                  ?.writeText(window.location.href)
                  .then(() => setCopied(true))
                  .catch(() => setCopied(false));
              }}
            >
              {copied ? "Copied!" : "Copy invite link"}
              <span aria-hidden="true">↗</span>
            </button>
          </section>
          {state && (
            <section className="Lobby-rules" aria-label="Game rules">
              <div className="Lobby-sectionHeading">
                <h2>The voyage</h2>
                <span>Rules locked</span>
              </div>
              <div className="Lobby-ruleStats">
                <div>
                  <strong>{state.roundSchedule.length}</strong>
                  <span>Rounds</span>
                </div>
                <div>
                  <strong>
                    {state.scoringMode === "rascal" ? "Rascal" : "Classic"}
                  </strong>
                  <span>Scoring</span>
                </div>
                <div>
                  <strong>{state.pirateAbilities ? "On" : "Off"}</strong>
                  <span>Pirate powers</span>
                </div>
              </div>
              <p className="Lobby-ruleCards">
                {cardRules
                  .filter(([, enabled]) => enabled)
                  .map(([name]) => name)
                  .join(" · ") ||
                  "The essentials: numbered cards, Pirates & Tigress"}
              </p>
              <details>
                <summary>View full game rules</summary>
                <p>{state.roundSchedule.join(", ")} cards per round.</p>
                <ul>
                  {cardRules.map(([name, enabled]) => (
                    <li key={name}>
                      <span>{name}</span>
                      <span className={enabled ? "Lobby-ruleOn" : ""}>
                        {enabled ? "On" : "Off"}
                      </span>
                    </li>
                  ))}
                </ul>
                <p>
                  {state.tieBreakers
                    ? "Tied leaders play extra rounds."
                    : "Tied leaders share victory."}{" "}
                  {state.cannonball && "Cannonball choices enabled."}
                </p>
                <p>
                  Up to {state.maxPlayers} players. With two seats, Graybeard
                  joins automatically; Loot, Wild 15, Walk the Plank, and 0/14
                  cards are removed.
                </p>
                <p>These rules stay fixed for the game.</p>
              </details>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
};
