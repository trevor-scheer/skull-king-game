import { ApolloProvider } from "@apollo/client";
import { RouterProvider } from "react-router-dom";
import "./App.css";
import { client } from "./client";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { router } from "./router";

function App() {
  return (
    <ErrorBoundary>
      <ApolloProvider client={client}>
        <RouterProvider router={router} />
      </ApolloProvider>
    </ErrorBoundary>
  );
}

export default App;
