import { Link } from 'react-router-dom';
import { useAccount } from './AccountContext';
export function AccountNav() {
  const { account } = useAccount();
  return <span className="AccountNav"><Link to="/leaderboard">Leaderboard</Link><Link to="/history">History</Link><Link to="/account">{account?.username ?? 'Optional account'}</Link></span>;
}
