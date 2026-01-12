import { useEffect, useState } from "react";
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
    onError: console.error,
  });

  useEffect(() => {
    if (result.data?.addPlayer) {
      onJoin(result.data.addPlayer);
    }
  }, [result.data?.addPlayer, onJoin]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      createPlayer();
      setDefaultName(name);
    }
  };

  return (
    <form className="JoinGame" onSubmit={handleSubmit}>
      <label className="JoinGame-label">
        Enter yer name, sailor:
        <input
          className="JoinGame-input"
          onChange={(e) => updateName(e.target.value)}
          value={name}
          placeholder="Captain Jack..."
          autoFocus
        />
      </label>
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
