import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { usePlayerToken } from '../../hooks/PlayerTokenContext';
import { accountRequest, useAccount } from './AccountContext';
export function AccountResume({ gameId, phase }: { gameId: string; phase?: string }) {
  const { account, csrf } = useAccount();
  const [token, setToken] = usePlayerToken();
  const attempted = useRef('');
  const [linked, setLinked] = useState(false); const [message, setMessage] = useState(''); const [busy, setBusy] = useState(false);
  useEffect(() => {
    setLinked(false); setMessage('');
    let active = true;
    if (account) void accountRequest<{ games: { gameId: string }[] }>('games').then(data => { if (active) setLinked(data.games.some(game => game.gameId === gameId)); }).catch(() => {});
    return () => { active = false; };
  }, [account, gameId]);
  useEffect(() => {
    if (!account || !csrf || !token || linked || phase === 'postgame') return;
    const key = `${account.id}:${gameId}:${token}`;
    if (attempted.current === key) return;
    attempted.current = key;
    let active = true;
    void accountRequest(`seats/${encodeURIComponent(gameId)}`, { playerToken: token }, csrf).then(() => {
      if (active) { setLinked(true); setMessage('Seat saved to your account.'); }
    }).catch(error => { if (active) setMessage(error instanceof Error ? error.message : 'Couldn’t save your seat. Try again.'); });
    return () => { active = false; };
  }, [account, csrf, token, linked, gameId, phase]);
  if (!account) return <p className="AccountResume"><Link to="/account">Optional account</Link> saves your seat across devices and tracks finished matches.</p>;
  async function connect() {
    setBusy(true); setMessage('');
    try {
      if (linked) {
        const result = await accountRequest<{ playerToken: string }>(`resume/${encodeURIComponent(gameId)}`, {}, csrf);
        setToken(result.playerToken, gameId); setMessage('Your seat is ready.');
      } else {
        await accountRequest(`seats/${encodeURIComponent(gameId)}`, { playerToken: token }, csrf); setLinked(true); setMessage('Seat saved to your account.');
      }
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Please try again.'); }
    finally { setBusy(false); }
  }
  if ((!token && !linked) || (!linked && phase === 'postgame')) return null;
  return <div className="AccountResume">{linked && <span>Seat saved to {account.username}. </span>}<button disabled={busy || !csrf} onClick={() => void connect()}>{busy ? 'Connecting…' : linked ? 'Resume my saved seat' : 'Save this seat to my account'}</button><p role="status">{message}</p></div>;
}
