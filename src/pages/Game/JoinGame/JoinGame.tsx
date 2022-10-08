import { useEffect, useState } from "react";
import { useGameId } from "../../../hooks/useGameId";
import { useLocalStorage } from "../../../hooks/useLocalStorage";
import { useAddPlayerMutation } from "../../../types/graphqlTypes";

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

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        createPlayer();
        setDefaultName(name);
      }}
    >
      <input onChange={(e) => updateName(e.target.value)} value={name} />
      <button
        onClick={(e) => {
          e.preventDefault();
          createPlayer();
          setDefaultName(name);
        }}
        type="submit"
      >
        Join Game
      </button>
    </form>
  );
};
