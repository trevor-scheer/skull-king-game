import { gql } from "@apollo/client";
import { usePlayerToken } from "../../../../hooks/PlayerTokenContext";
import { useGameId } from "../../../../hooks/useGameId";
import { useScorecardQuery } from "../../../../types/graphqlTypes";
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
  const { data, loading, error, refetch } = useScorecardQuery({
    variables: { gameId, playerToken: playerToken ?? "" },
    pollInterval: 10000,
  });

  if (error && !data)
    return (
      <p role="alert">
        Couldn’t load scores.{" "}
        <button onClick={() => void refetch().catch(() => undefined)}>
          Retry
        </button>
      </p>
    );
  if (loading && !data) return <div>Loading...</div>;

  const scorecard = data?.state?.scorecard;
  if (!scorecard?.[0]) return <p>Scores appear here after the first round. Your bids and tricks won are shown at the table.</p>;

  return (
    <div className="Scorecard">
      <p className="Scorecard-header">Scorecard</p>
      <table>
        <caption>
          Each round: bid / tricks won, bid points, bonuses, round change, and
          running total.
        </caption>
        <thead>
          <tr>
            <th className="Scorecard-tableHeader">Round</th>
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
                    <dl>
                      <dt>Bid / won</dt>
                      <dd>
                        {block.tricksBid} / {block.tricksWon}
                      </dd>
                      <dt>Bid points</dt>
                      <dd>{showPlusIfPositive(block.bidPoints)}</dd>
                      <dt>Bonuses</dt>
                      <dd>{showPlusIfPositive(block.bonusPoints)}</dd>
                      <dt>Round</dt>
                      <dd>
                        {showPlusIfPositive(
                          block.bidPoints + block.bonusPoints,
                        )}
                      </dd>
                      <dt>Total</dt>
                      <dd>
                        <strong>{block.totalPoints}</strong>
                      </dd>
                    </dl>
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
