import { Link, Outlet } from "react-router-dom";
import { PlayerTokenProvider } from "./hooks/PlayerTokenContext";
import "./Layout.scss";

export function Layout() {
  return (
    <PlayerTokenProvider>
      <header className="Header">
        <nav>
          <Link to="/">Home</Link>
        </nav>
      </header>
      <div className="Layout">
        <Outlet />
      </div>
    </PlayerTokenProvider>
  );
}
