import { RecoveryPage } from "./components/ErrorBoundary";
import { createBrowserRouter } from "react-router-dom";
import { Layout } from "./Layout";
import { Home } from "./pages/Home/Home";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    errorElement: <RecoveryPage />,
    children: [
      { index: true, element: <Home /> },
      {
        path: "learn",
        lazy: async () => ({
          Component: (await import("./pages/Tutorial/Tutorial")).Tutorial,
        }),
      },
      {
        path: "account",
        lazy: async () => ({
          Component: (await import("./pages/Account/AccountPage")).AccountPage,
        }),
      },
      {
        path: "history",
        lazy: async () => ({
          Component: (await import("./pages/Account/HistoryPage")).HistoryPage,
        }),
      },
      {
        path: "leaderboard",
        lazy: async () => ({
          Component: (await import("./pages/Account/LeaderboardPage"))
            .LeaderboardPage,
        }),
      },
      {
        path: "game/:id",
        lazy: async () => ({
          Component: (await import("./pages/Game/Game")).Game,
        }),
      },
    ],
  },
]);
