import { gql, useMutation, useQuery } from "@apollo/client";
import { useParams } from "react-router-dom";

export const StartGame: React.FunctionComponent = function () {
  const params = useParams<{ id: string }>();

  const { loading, data } = useQuery(
    gql`
      query Players($gameId: String!) {
        state(gameId: $gameId) {
          players {
            name
          }
        }
      }
    `,
    {
      variables: {
        gameId: params.id,
      },
    }
  );

  const [startGame] = useMutation(
    gql`
      mutation StartGame($gameId: String!) {
        startGame(gameId: $gameId)
      }
    `,
    {
      variables: {
        gameId: params.id,
      },
    }
  );

  return (
    <button
      onClick={() => startGame()}
      disabled={loading || data.state.players.length < 2}
    >
      Start Game
    </button>
  );
};
