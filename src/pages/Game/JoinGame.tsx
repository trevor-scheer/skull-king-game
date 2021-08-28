import { gql, useMutation } from "@apollo/client";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

export const JoinGame: React.FunctionComponent<{ onJoin: Function }> =
  function ({ onJoin }) {
    const params = useParams<{ id: string }>();
    const [name, updateName] = useState<string | undefined>("");

    const [createPlayer, result] = useMutation(
      gql`
        mutation AddPlayer($gameId: String!, $name: String!) {
          addPlayer(gameId: $gameId, name: $name)
        }
      `,
      {
        variables: {
          gameId: params.id,
          name,
        },
        onError: console.error,
      }
    );

    useEffect(() => {
      if (result.data?.addPlayer) {
        onJoin(result.data.addPlayer);
      }
    }, [result.data?.addPlayer, params.id, onJoin]);

    return (
      <>
        <input onChange={(e) => updateName(e.target.value)} value={name} />
        <button onClick={() => createPlayer()}>Join Game</button>
      </>
    );
  };
