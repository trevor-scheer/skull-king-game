import { gql, useMutation } from "@apollo/client";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { usePlayerToken } from "../../hooks/usePlayerToken";

export const JoinGame: React.FunctionComponent<{ onJoin: Function }> =
  function ({ onJoin }) {
    const params = useParams<{ id: string }>();
    const [token, setToken] = usePlayerToken();
    const [name, updateName] = useState<string | undefined>(undefined);

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
      if (result.data?.addPlayer && !token) {
        setToken(result.data.addPlayer);
        onJoin(result.data.addPlayer);
      }
    }, [result.data?.addPlayer, token, setToken, params.id, onJoin]);

    return (
      <>
        <input onChange={(e) => updateName(e.target.value)} value={name} />
        <button onClick={() => createPlayer()}>Join Game</button>
      </>
    );
  };
