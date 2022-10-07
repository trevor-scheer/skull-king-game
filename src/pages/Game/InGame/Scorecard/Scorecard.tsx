import { gql } from "@apollo/client";
import { usePlayerToken } from "../../../../hooks/PlayerTokenContext";
import { useGameId } from "../../../../hooks/useGameId";
import { useScorecardQuery } from "../../../../types/graphqlTypes";
import { JollyRogerSvg } from "./JollyRogerSvg";
import "./Scorecard.scss";

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
`;

export const Scorecard: React.FunctionComponent = function () {
  const [playerToken] = usePlayerToken();
  const gameId = useGameId() ?? ""; // TODO: hacky fallback

  // TODO: error handling
  const { data, loading } = useScorecardQuery({
    variables: { gameId, playerToken: playerToken! },
    pollInterval: 2000,
  });

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
                        {showPlusIfPositive(block.bidPoints)}
                      </p>
                    </div>
                    <div className="Scorecard-scoreCell-row">
                      <p className="Scorecard-scoreCell-entry">
                        {showPlusIfPositive(block.bonusPoints + block.bidPoints)}
                      </p>
                      <p className="Scorecard-scoreCell-entry Scorecard-scoreCell-totalScore">
                        {showPlusIfPositive(block.totalPoints)}
                      </p>
                    </div>
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

function showPlusIfPositive(value: number) {
  return value > 0 ? "+" + value : value;
}