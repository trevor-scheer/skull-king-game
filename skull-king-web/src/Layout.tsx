import { Link, Outlet } from "react-router-dom";
import { PlayerTokenProvider } from "./hooks/PlayerTokenContext";
import "./Layout.scss";
import { AccountProvider } from "./pages/Account/AccountContext";
import { AccountNav } from "./pages/Account/AccountNav";
import "./pages/Account/Accounts.scss";

export function Layout() {
  return (
    <AccountProvider><PlayerTokenProvider>
      <div className="App">
        <header className="Header">
          <nav>
            <Link to="/">Skull King</Link>
            <AccountNav />
          </nav>
        </header>
        <div className="Layout">
          <Outlet />
        </div>
      </div>
    </PlayerTokenProvider></AccountProvider>
  );
}
