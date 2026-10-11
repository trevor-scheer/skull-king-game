import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { accountRequest, useAccount } from './AccountContext';
import './Accounts.scss';
type Match = { gameId: string; finished: number; scoring: string; schedule: string; eligible: number; points: number; won: number };
export function HistoryPage() {
  const { account, loading } = useAccount();
  const [matches, setMatches] = useState<Match[]>([]); const [error, setError] = useState('');
  useEffect(() => { if (account) void accountRequest<{ matches: Match[] }>('history').then(data => setMatches(data.matches)).catch(error => setError(error.message)); else setMatches([]); }, [account]);
  return <section className="AccountPage"><h1>Match history</h1><p>Finished matches from seats linked before the game ended. The most recent 200 matches appear here.</p>{error && <p role="alert">{error}</p>}{loading ? <p>Loading…</p> : !account ? <p><Link to="/account">Sign in</Link> to see your matches.</p> : matches.length ? <div className="AccountTable"><table><thead><tr><th>Finished</th><th>Rules</th><th>Result</th><th>Score</th></tr></thead><tbody>{matches.map(match => <tr key={match.gameId}><td>{new Date(match.finished).toLocaleDateString()}</td><td>{match.scoring} · {JSON.parse(match.schedule).join(', ')} cards{!match.eligible && ' · Practice'}</td><td>{match.won ? 'Won' : 'Played'}</td><td>{match.points}</td></tr>)}</tbody></table></div> : <p>No completed matches yet.</p>}</section>;
}
