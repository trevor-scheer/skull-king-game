import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { usePlayerToken } from "../../hooks/PlayerTokenContext";
import { accountRequest, useAccount } from "./AccountContext";
import "./Accounts.scss";

export function AccountPage() {
  const { account, csrf, loading, error: serviceError, refresh } = useAccount();
  const [mode, setMode] = useState<"login" | "signup" | "recover">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [newCode, setNewCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [deleteConfirmed, setDeleteConfirmed] = useState(false);
  const [games, setGames] = useState<
    { gameId: string; playerName: string; phase: string }[]
  >([]);
  const [, setToken] = usePlayerToken();
  const navigate = useNavigate();
  useEffect(() => {
    if (account)
      void accountRequest<{ games: typeof games }>("games")
        .then((data) => setGames(data.games))
        .catch(() => setError("Saved games could not be loaded."));
    else setGames([]);
  }, [account]);
  async function run(work: () => Promise<void>) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await work();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    await run(async () => {
      const result = await accountRequest<{ recoveryCode?: string }>(
        mode,
        { username, password, recoveryCode },
        csrf,
      );
      setNewCode(result.recoveryCode ?? "");
      setPassword("");
      setRecoveryCode("");
      await refresh();
    });
  }
  async function exportData() {
    await run(async () => {
      const data = await accountRequest("export");
      const url = URL.createObjectURL(
        new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
      );
      const link = document.createElement("a");
      link.href = url;
      link.download = "skull-king-account.json";
      link.click();
      URL.revokeObjectURL(url);
    });
  }
  return (
    <section className="AccountPage">
      <p className="AccountPage-eyebrow">Your place at the table</p>
      <h1>{account ? `Welcome, ${account.username}` : "Keep your seat"}</h1>
      <p>
        Play as a guest whenever you like. An account keeps your linked seats
        and match history across devices. Your username appears on the casual
        leaderboard.
      </p>
      {(serviceError || error) && <p role="alert">{error || serviceError}</p>}
      {message && <p role="status">{message}</p>}
      {loading ? (
        <p>Loading account…</p>
      ) : !account ? (
        <>
          <div className="AccountActions AccountActions--tabs">
            {(["login", "signup", "recover"] as const).map((value) => (
              <button
                key={value}
                aria-pressed={mode === value}
                onClick={() => {
                  setMode(value);
                  setError("");
                }}
              >
                {value === "login"
                  ? "Sign in"
                  : value === "signup"
                    ? "Create account"
                    : "Recover account"}
              </button>
            ))}
          </div>
          <form onSubmit={submit}>
            <label>
              Username
              <input
                required
                autoComplete="username"
                value={username}
                minLength={3}
                maxLength={24}
                pattern="[a-zA-Z0-9_-]+"
                onChange={(event) => setUsername(event.target.value)}
              />
            </label>
            {mode === "recover" && (
              <label>
                Recovery code
                <input
                  required
                  value={recoveryCode}
                  autoComplete="off"
                  onChange={(event) =>
                    setRecoveryCode(event.target.value.trim())
                  }
                />
              </label>
            )}
            <label>
              {mode === "recover" ? "New password" : "Password"}
              <input
                type="password"
                required
                minLength={mode === "login" ? undefined : 10}
                maxLength={128}
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>
            {mode !== "login" && (
              <p>
                Use at least 10 characters. Recovery uses your saved code; no
                email address is collected.
              </p>
            )}
            <button disabled={busy || !csrf}>
              {busy
                ? "Please wait…"
                : mode === "login"
                  ? "Sign in"
                  : mode === "signup"
                    ? "Create account"
                    : "Reset password"}
            </button>
          </form>
        </>
      ) : (
        <>
          {newCode && (
            <div className="RecoveryCode">
              <h2>Save your recovery code</h2>
              <p>
                This code is shown once. Keep it in your password manager. Using
                it replaces your password and gives you a new code.
              </p>
              <code>{newCode}</code>
              <button
                onClick={() => {
                  setNewCode("");
                  setMessage("Recovery code hidden.");
                }}
              >
                I saved it
              </button>
            </div>
          )}
          <h2>Saved games</h2>
          {games.length ? (
            <ul className="AccountSavedGames">
              {games.map((game) => (
                <li key={game.gameId}>
                  {game.playerName} ·{" "}
                  {game.phase === "setup"
                    ? "Lobby"
                    : game.phase === "postgame"
                      ? "Finished"
                      : "Playing"}{" "}
                  <button
                    disabled={busy}
                    onClick={() =>
                      void run(async () => {
                        const result = await accountRequest<{
                          playerToken: string;
                        }>(
                          `resume/${encodeURIComponent(game.gameId)}`,
                          {},
                          csrf,
                        );
                        setToken(result.playerToken, game.gameId);
                        navigate(`/game/${game.gameId}`);
                      })
                    }
                  >
                    Resume game
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p>
              No active seats saved yet. Use “Save this seat to my account” in a
              game.
            </p>
          )}
          <div className="AccountActions">
            <Link to="/history">Match history</Link>
            <button disabled={busy} onClick={() => void exportData()}>
              Export my account data
            </button>
            <button
              disabled={busy}
              onClick={() =>
                void run(async () => {
                  await accountRequest("logout", {}, csrf);
                  setNewCode("");
                  await refresh();
                })
              }
            >
              Sign out
            </button>
            <button
              disabled={busy}
              onClick={() =>
                void run(async () => {
                  await accountRequest("logout-all", {}, csrf);
                  setNewCode("");
                  await refresh();
                })
              }
            >
              Sign out on all devices
            </button>
          </div>
          <p>
            Signing out ends your account session. Guest seat tokens already
            saved on this device remain available.
          </p>
          <details>
            <summary>Change password</summary>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void run(async () => {
                  const result = await accountRequest<{ recoveryCode: string }>(
                    "password",
                    { currentPassword, password },
                    csrf,
                  );
                  setNewCode(result.recoveryCode);
                  setCurrentPassword("");
                  setPassword("");
                  setMessage(
                    "Password changed. Other devices have been signed out.",
                  );
                });
              }}
            >
              <label>
                Current password
                <input
                  required
                  type="password"
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                />
              </label>
              <label>
                New password
                <input
                  required
                  minLength={10}
                  maxLength={128}
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </label>
              <button disabled={busy}>Change password</button>
            </form>
          </details>
          <details>
            <summary>Delete account</summary>
            <p>
              This removes your account, saved seats, match history, and
              leaderboard entry. Games on this device can continue as guest
              seats.
            </p>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void run(async () => {
                  await accountRequest(
                    "delete",
                    { password: currentPassword },
                    csrf,
                  );
                  setCurrentPassword("");
                  setNewCode("");
                  await refresh();
                });
              }}
            >
              <label>
                Password
                <input
                  required
                  type="password"
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                />
              </label>
              <label>
                <input
                  type="checkbox"
                  required
                  checked={deleteConfirmed}
                  onChange={(event) => setDeleteConfirmed(event.target.checked)}
                />{" "}
                Delete my account permanently
              </label>
              <button disabled={busy || !deleteConfirmed}>
                Delete account
              </button>
            </form>
          </details>
        </>
      )}
    </section>
  );
}
