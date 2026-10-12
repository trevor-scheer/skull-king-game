import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { PlayerTokenProvider } from "./hooks/PlayerTokenContext";
import { AccountProvider } from "./pages/Account/AccountContext";
import { AccountNav } from "./pages/Account/AccountNav";
import { Crest } from "./components/Crest";
import "./Layout.scss";
import "./pages/Account/Accounts.scss";

export function Layout() {
  const inRoom = useLocation().pathname.startsWith("/game/");
  return (
    <AccountProvider>
      <PlayerTokenProvider>
        <div className={`App${inRoom ? " App-inRoom" : ""}`}>
          <a className="SkipLink" href="#main-content">
            Skip to content
          </a>
          <header className="Header">
            <nav aria-label="Main navigation">
              <Link
                className="Header-brand"
                to="/"
                aria-label="Skull King home"
              >
                <Crest />
                <span>
                  Skull King<small>The digital card table</small>
                </span>
              </Link>
              <div className="Header-links">
                <NavLink to="/learn">Learn to play</NavLink>
                <AccountNav />
              </div>
            </nav>
          </header>
          <main className="Layout" id="main-content" tabIndex={-1}>
            <Outlet />
          </main>
          <footer className="Footer">
            <span>
              <Crest /> A little strategy. A lot of treachery.
            </span>
            <span>Skull King · Digital adaptation concept</span>
          </footer>
        </div>
      </PlayerTokenProvider>
    </AccountProvider>
  );
}
