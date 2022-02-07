import { gql, useQuery } from "@apollo/client";
import { usePlayerToken } from "../../../hooks/PlayerTokenContext";
import { useGameId } from "../../../hooks/useGameId";
import { ScorecardQuery } from "../../../types/graphqlTypes";
import { JollyRogerSvg } from "./JollyRogerSvg";
import "./Scorecard.scss";

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
    <div className="Scorecard">
      <p className="Scorecard-header">Scorecard</p>
      <table>
        <thead>
          <tr>
            <th className="Scorecard-tableHeader">
              <JollyRogerSvg size={25} />
            </th>
            {scorecard[0].map((block) => (
              <th className="Scorecard-tableHeader" key={block.playerName}>
                <p className="Scorecard-tableHeader-content">
                  {block.playerName}
                </p>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {scorecard.map((round, index) => {
            return (
              <tr key={index}>
                <td className="Scorecard-roundNumberCell">{index + 1}</td>
                {round.map((block) => (
                  <td className="Scorecard-scoreCell" key={block.playerName}>
                    <div className="Scorecard-scoreCell-row">
                      <p className="Scorecard-scoreCell-entry">
                        {block.tricksBid} / {block.tricksWon}
                      </p>
                      <p className="Scorecard-scoreCell-entry">
                        {block.bonusPoints}
                      </p>
                      <p className="Scorecard-scoreCell-entry">
                        {block.bidPoints}
                      </p>
                    </div>
                    <div className="Scorecard-scoreCell-row">
                      <p className="Scorecard-scoreCell-entry">
                        {block.bonusPoints + block.bidPoints}
                      </p>
                      <p className="Scorecard-scoreCell-entry">
                        {block.totalPoints}
                      </p>
                    </div>
                    {/* <table>
                      <tbody>
                        <tr>
                          <td>
                            <p>
                              {block.tricksBid} / {block.tricksWon}
                            </p>
                          </td>
                          <td>{block.bonusPoints}</td>
                          <td>{block.bonusPoints}</td>
                        </tr>
                        <tr>
                          <td>{block.bonusPoints + block.bonusPoints}</td>
                          <td>{block.totalPoints}</td>
                        </tr>
                      </tbody>
                    </table> */}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
