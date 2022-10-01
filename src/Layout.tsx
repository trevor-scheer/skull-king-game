import { Link, Outlet } from "react-router-dom";

export function Layout() {
  return (
    <>
      <header>
        <nav>
          <Link to="/">Home</Link>
        </nav>
      </header>
      <Outlet />
    </>
  );
}
