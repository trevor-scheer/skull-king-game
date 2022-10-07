import { Link, Outlet } from "react-router-dom";
import { PlayerTokenProvider } from "./hooks/PlayerTokenContext";

export function Layout() {
  return (
    <PlayerTokenProvider>
      <header>
        <nav>
          <Link to="/">Home</Link>
        </nav>
      </header>
      <Outlet />
    </PlayerTokenProvider>
  );
}
