import { ErrorBoundary } from "./components/ErrorBoundary";
import { ApolloProvider } from "@apollo/client";
import { RouterProvider } from "react-router-dom";
import "./App.css";
import { client } from "./client";
import { router } from "./router";

function App() {
  return (
    <ApolloProvider client={client}>
      <ErrorBoundary><RouterProvider router={router} /></ErrorBoundary>
    </ApolloProvider>
  );
}

export default App;
