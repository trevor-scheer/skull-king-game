import { gql, useQuery } from "@apollo/client";
import { usePlayerToken } from "../../../hooks/PlayerTokenContext";
import { useGameId } from "../../../hooks/useGameId";
import { ScorecardQuery } from "../../../types/graphqlTypes";
import "./Scorecard.css";

export const Scorecard: React.FunctionComponent = function () {
  const [playerToken] = usePlayerToken();
  const gameId = useGameId();

  // TODO: error handling
  const { data, loading } = useQuery<ScorecardQuery>(
    gql`
      query Scorecard($gameId: String!, $playerToken: String!) {
        state(gameId: $gameId, playerToken: $playerToken) {
          id
          me {
            id
            name
          }
          scorecard {
            playerName
            tricksBid
            tricksWon
            bidPoints
            bonusPoints
            totalPoints
          }
        }
      }
    `,
    {
      variables: { gameId, playerToken },
      pollInterval: 2000,
    }
  );

  if (loading) return <div>Loading...</div>;

  const scorecard = data?.state?.scorecard;
  if (!scorecard?.[0]) return null;

  return (
    <table>
      <thead>
        <tr>
          <th></th>
          {scorecard[0].map((block) => (
            <th key={block.playerName}>{block.playerName}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {scorecard.map((round, index) => {
          return (
            <tr key={index}>
              <td>{index + 1}</td>
              {round.map((block) => (
                <td key={block.playerName}>
                  {block.tricksBid}, {block.tricksWon}, {block.bidPoints},{" "}
                  {block.bonusPoints}, {block.totalPoints}
                </td>
              ))}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};
