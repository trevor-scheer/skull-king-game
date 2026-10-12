import { useState } from "react";
import "./SeatRecovery.scss";
import { usePlayerToken } from "../../../hooks/PlayerTokenContext";
import { useRecoverSeatLazyQuery } from "../../../types/graphqlTypes";
export function SeatRecovery({ gameId }: { gameId: string }) {
  const [token, setToken] = usePlayerToken();
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [check, { loading }] = useRecoverSeatLazyQuery({
    fetchPolicy: "network-only",
  });
  async function recover(event: React.FormEvent) {
    event.preventDefault();
    setMessage("");
    try {
      const result = await check({
        variables: { gameId, playerToken: code.trim() },
      });
      if (!result.data?.state?.me) {
        setMessage("That code does not belong to a seat in this room.");
        return;
      }
      setToken(code.trim(), gameId);
      setCode("");
      setMessage("Your seat is restored.");
    } catch {
      setMessage("Couldn’t check the code. Please try again.");
    }
  }
  return (
    <details className="SeatRecovery">
      <summary>Recover or save your seat</summary>
      {token && (
        <>
          <p>
            Keep this recovery code private. It lets you return to this seat on
            another device.
          </p>
          <input
            aria-label="Your seat recovery code"
            value={token}
            readOnly
            onFocus={(event) => event.target.select()}
          />
          <button
            onClick={() =>
              void navigator.clipboard
                ?.writeText(token)
                .then(() => setMessage("Recovery code copied."))
                .catch(() =>
                  setMessage("Select the code and copy it manually."),
                )
            }
          >
            Copy recovery code
          </button>
        </>
      )}
      <form onSubmit={(event) => void recover(event)}>
        <label>
          Seat recovery code
          <input
            type="password"
            autoComplete="off"
            value={code}
            onChange={(event) => setCode(event.target.value)}
          />
        </label>
        <button disabled={!code.trim() || loading}>Recover seat</button>
      </form>
      {token && (
        <button
          onClick={() => {
            setToken(null, gameId);
            setMessage("Saved seat removed from this device.");
          }}
        >
          Forget this saved seat
        </button>
      )}
      {message && <p role="status">{message}</p>}
    </details>
  );
}
