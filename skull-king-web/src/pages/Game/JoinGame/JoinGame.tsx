import { useState } from "react";
import { useGameId } from "../../../hooks/useGameId";
import { useLocalStorage } from "../../../hooks/useLocalStorage";
import { useAddPlayerMutation } from "../../../types/graphqlTypes";
import "./JoinGame.scss";

export const JoinGame: React.FunctionComponent<{
  onJoin: (playerToken: string | null) => void;
}> = function ({ onJoin }) {
  const gameId = useGameId();
  const [defaultName, setDefaultName] = useLocalStorage(
    "skullKing-defaultName",
    ""
  );
  const [name, updateName] = useState<string>(defaultName);

  const [createPlayer, result] = useAddPlayerMutation({
    variables: { gameId: gameId!, name },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || result.loading) return;
    try {
      const response = await createPlayer();
      if (response.data?.addPlayer) {
        setDefaultName(name);
        onJoin(response.data.addPlayer);
      }
    } catch { /* Mutation error is displayed below. */ }
  };

  return (
    <form className="JoinGame" onSubmit={handleSubmit}>
      <label className="JoinGame-label">
        Enter yer name, sailor:
        <input
          className="JoinGame-input"
          onChange={(e) => updateName(e.target.value)}
          value={name}
          maxLength={32}
          autoComplete="nickname"
          placeholder="Captain Jack..."
          autoFocus
        />
      </label>
      {result.error && <p role="alert">{result.error.message}</p>}
      <button
        className="JoinGame-button"
        type="submit"
        disabled={!name.trim() || result.loading}
      >
        {result.loading ? "Joining..." : "Board the Ship"}
      </button>
    </form>
  );
};
