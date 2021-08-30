import { gql, useMutation } from "@apollo/client";
import { useEffect, useState } from "react";
import { useGameId } from "../../hooks/useGameId";

export const JoinGame: React.FunctionComponent<{ onJoin: Function }> =
  function ({ onJoin }) {
    const gameId = useGameId();
    const [name, updateName] = useState<string | undefined>("");

    const [createPlayer, result] = useMutation(
      gql`
        mutation AddPlayer($gameId: String!, $name: String!) {
          addPlayer(gameId: $gameId, name: $name)
        }
      `,
      {
        variables: { gameId, name },
        onError: console.error,
      }
    );

    useEffect(() => {
      console.log(result.data?.addPlayer);
      if (result.data?.addPlayer) {
        onJoin(result.data.addPlayer);
      }
    }, [result.data?.addPlayer, gameId, onJoin]);

    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          createPlayer();
        }}
      >
        <input onChange={(e) => updateName(e.target.value)} value={name} />
        <button
          onClick={(e) => {
            e.preventDefault();
            createPlayer();
          }}
          type="submit"
        >
          Join Game
        </button>
      </form>
    );
  };
