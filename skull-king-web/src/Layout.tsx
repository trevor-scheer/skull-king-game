import { Link, Outlet } from "react-router-dom";
import { PlayerTokenProvider } from "./hooks/PlayerTokenContext";
import "./Layout.scss";

export function Layout() {
  return (
    <PlayerTokenProvider>
      <div className="App">
        <header className="Header">
          <nav>
            <Link to="/">Skull King</Link>
          </nav>
        </header>
        <div className="Layout">
          <Outlet />
        </div>
      </div>
    </PlayerTokenProvider>
  );
}
