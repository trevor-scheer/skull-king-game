import { NavLink } from "react-router-dom";
import { useAccount } from "./AccountContext";
export function AccountNav() {
  const { account } = useAccount();
  return (
    <span className="AccountNav">
      <NavLink to="/leaderboard">Leaderboard</NavLink>
      <NavLink to="/history">History</NavLink>
      <NavLink to="/account">{account?.username ?? "Account"}</NavLink>
    </span>
  );
}
