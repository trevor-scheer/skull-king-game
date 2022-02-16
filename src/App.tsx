import { BrowserRouter as Router, Switch, Route, Link } from "react-router-dom";
import { ApolloProvider } from "@apollo/client";
import "./App.css";
import { Home } from "./pages/Home";
import { Game } from "./pages/Game/Game";
import { client } from "./client";
import { PlayerTokenProvider } from "./hooks/PlayerTokenContext";

function App() {
  return (
    <ApolloProvider client={client}>
      <Router>
        <Header />
        <Switch>
          <Route path="/game/:id">
            <PlayerTokenProvider>
              <Game />
            </PlayerTokenProvider>
          </Route>
          <Route path="/">
            <Home />
          </Route>
        </Switch>
      </Router>
    </ApolloProvider>
  );
}

function Header() {
  return (
    <header>
      <nav>
        <Link to="/">Home</Link>
      </nav>
    </header>
  );
}

export default App;
