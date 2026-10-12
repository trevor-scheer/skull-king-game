import { createBrowserRouter } from "react-router-dom";
import { Layout } from "./Layout";
import { Game } from "./pages/Game/Game";
import { Home } from './pages/Home/Home'

import { AccountPage } from "./pages/Account/AccountPage";
import { HistoryPage } from "./pages/Account/HistoryPage";
import { LeaderboardPage } from "./pages/Account/LeaderboardPage";

import { Tutorial } from "./pages/Tutorial/Tutorial";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { path: "learn", element: <Tutorial /> },
      { path: "account", element: <AccountPage /> },
      { path: "history", element: <HistoryPage /> },
      { path: "leaderboard", element: <LeaderboardPage /> },
      {
        index: true,
        element: <Home />,
      },
      {
        path: "game/:id",
        element: <Game />,
      },
    ],
  },
]);