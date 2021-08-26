import { gql, useQuery, useSubscription } from "@apollo/client";
import { useState } from "react";
import { useParams } from "react-router-dom";
import { usePlayerToken } from "../hooks/usePlayerToken";
import { JoinGame } from "./Game/JoinGame";

export function Game() {
  const { id: gameId } = useParams<{ id: string }>();
  const [token, setToken] = usePlayerToken();
  const variables = { gameId };

  useSubscription(gameStateQuery(true), {
    variables,
  });
  const { data, loading, error } = useQuery(gameStateQuery(), {
    variables,
  });

  return loading ? (
    <p>Loading...</p>
  ) : (
    <div>
      {JSON.stringify(data)}
      {token ? <div>In game</div> : <JoinGame onJoin={setToken} />}
    </div>
  );
}

function gameStateQuery(isSubscription: boolean = false) {
  return gql`
  ${isSubscription ? "subscription" : "query"} GameState${
    isSubscription ? "Subscription" : "Query"
  }($gameId: String!) {
    state(gameId: $gameId) {
      id
      phase
      players {
        name
      }
      currentRound {
        roundNumber
      }
    }
  }
  `;
}
