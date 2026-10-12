import { useEffect, useState } from "react";
import { accountRequest } from "./AccountContext";
import "./Accounts.scss";
type Ranking = {
  username: string;
  games: number;
  wins: number;
  winRate: number;
};
export function LeaderboardPage() {
  const [players, setPlayers] = useState<Ranking[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    void accountRequest<{ players: Ranking[] }>("leaderboard")
      .then((data) => setPlayers(data.players))
      .catch((error) => setError(error.message))
      .finally(() => setLoading(false));
  }, []);
  return (
    <section className="AccountPage">
      <p className="AccountPage-eyebrow">Around the table</p>
      <h1>Casual leaderboard</h1>
      <p>
        Wins and games across scoring modes, ordered by wins. Raw points from
        different rules are never compared. Practice bots are excluded; official
        two-human games with Graybeard count. These are friendly results, not
        competitive ratings.
      </p>
      {error && <p role="alert">{error}</p>}
      {loading ? (
        <p>Loading…</p>
      ) : players.length ? (
        <div className="AccountTable">
          <table>
            <thead>
              <tr>
                <th>Player</th>
                <th>Wins</th>
                <th>Games</th>
                <th>Win rate</th>
              </tr>
            </thead>
            <tbody>
              {players.map((player) => (
                <tr key={player.username}>
                  <td>{player.username}</td>
                  <td>{player.wins}</td>
                  <td>{player.games}</td>
                  <td>{player.winRate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p>Finish a human match with a linked account to join the board.</p>
      )}
    </section>
  );
}
