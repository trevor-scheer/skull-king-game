import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useGameId } from '../../../hooks/useGameId';
import { usePlayerToken } from '../../../hooks/PlayerTokenContext';
import { useFinalResultQuery, useRematchMutation } from '../../../types/graphqlTypes';
import { Scorecard } from '../InGame/Scorecard/Scorecard';
import './PostGame.scss';
export function PostGame() {
  const gameId = useGameId()!;
  const [playerToken,setToken] = usePlayerToken();
  const navigate = useNavigate();
  const [error,setError] = useState<string | null>(null);
  const {data} = useFinalResultQuery({variables:{gameId,playerToken},pollInterval: 10000});
  const [rematch,{loading}] = useRematchMutation();
  const rounds = data?.state?.scorecard ?? [];
  const final = rounds[rounds.length - 1] ?? [];
  const best = Math.max(...final.map(score => score.totalPoints));
  const winners = final.filter(score => score.totalPoints === best);
  async function again() {
    setError(null);
    try {
      const id = data?.state?.nextGameId ?? (await rematch({variables:{gameId,playerToken:playerToken!}})).data?.rematchGame;
      if (!id) throw new Error('Couldn’t create a rematch. Try again.');
      if (playerToken) setToken(playerToken,id);
      navigate(`/game/${id}`);
    } catch(error) { setError(error instanceof Error ? error.message : 'Please try again.'); }
  }
  return <div className="PostGame">
    <div className="PostGame-header"><h1 className="PostGame-title">Game Over!</h1>
      {winners.length > 0 && <p className="PostGame-subtitle">{winners.map(score => score.playerName).join(' and ')} {winners.length === 1 ? 'wins' : 'share victory'} with {best} points.</p>}
    </div>
    <Scorecard />
    {error && <p role="alert">{error}</p>}
    <div className="PostGame-footer">
      {(data?.state?.me || data?.state?.nextGameId) && <button disabled={loading} className="PostGame-button" onClick={() => void again()}>{data?.state?.nextGameId ? 'Join the rematch' : 'Rematch with this crew'}</button>}
      <Link to="/" className="PostGame-button">Return to Port</Link>
    </div>
  </div>;
}
