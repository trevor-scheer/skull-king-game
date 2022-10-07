import { ApolloProvider } from "@apollo/client";
import { RouterProvider } from "react-router-dom";
import "./App.css";
import { client } from "./client";
import { router } from "./router";

function App() {
  return (
    <ApolloProvider client={client}>
      <RouterProvider router={router} />
    </ApolloProvider>
  );
}

export default App;
