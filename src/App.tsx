import { RouterProvider } from "react-router-dom";
import { ApolloProvider } from "@apollo/client";
import "./App.css";
import { client } from "./client";
import { PlayerTokenProvider } from "./hooks/PlayerTokenContext";
import { router } from "./router";

function App() {
  return (
    <ApolloProvider client={client}>
      <PlayerTokenProvider>
        <RouterProvider router={router} />
      </PlayerTokenProvider>
    </ApolloProvider>
  );
}

export default App;
