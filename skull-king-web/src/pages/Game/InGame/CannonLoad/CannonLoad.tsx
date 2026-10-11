import { useState } from 'react';
import { useGameId } from '../../../../hooks/useGameId';
import { usePlayerToken } from '../../../../hooks/PlayerTokenContext';
import { CannonLoad as Load, useCannonChoiceQuery, useLoadCannonMutation } from '../../../../types/graphqlTypes';
export function CannonLoad() {
  const gameId = useGameId()!;
  const [playerToken] = usePlayerToken();
  const { data, refetch } = useCannonChoiceQuery({variables:{gameId,playerToken:playerToken!},pollInterval: 10000});
  const [choose, {loading}] = useLoadCannonMutation();
  const [error,setError] = useState<string | null>(null);
  const round = data?.state?.currentRound;
  async function load(value:Load) {
    setError(null);
    try { await choose({variables:{gameId,playerToken:playerToken!,load:value,expectedRoundNumber:round!.roundNumber}}); await refetch(); }
    catch (error) { setError(error instanceof Error ? error.message : 'Please try again.'); }
  }
  return <section aria-label="Cannon choice"><h2>Choose your shot</h2>
    <p>Your bid is locked in. Loads are revealed together.</p>
    {round?.myCannonLoad ? <p role="status">{round.myCannonLoad} chosen. Waiting for the crew…</p> : <>
      <button disabled={loading || !round} onClick={() => void load(Load.Grapeshot)}>Grapeshot · 10 per card, half if off by one</button>
      <button disabled={loading || !round} onClick={() => void load(Load.Cannonball)}>Cannonball · 15 per card, exact bid only</button>
    </>}{error && <p role="alert">{error}</p>}</section>;
}
