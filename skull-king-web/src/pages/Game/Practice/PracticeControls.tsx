import { gql, useApolloClient, useQuery } from "@apollo/client";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePlayerToken } from "../../../hooks/PlayerTokenContext";
import { useGameId } from "../../../hooks/useGameId";
import "./PracticeControls.scss";

const PRACTICE_STATE = gql`
  query PracticeState($gameId: String!, $playerToken: String) {
    state(gameId: $gameId, playerToken: $playerToken) {
      phase
      practice
      maxPlayers
      me {
        id
        isAutoplay
      }
      players {
        id
        name
        isBot
        isAutomated
        isAutoplay
        lastSeenAt
      }
    }
  }
`;
const ADD_BOT = gql`
  mutation AddPracticeBot($gameId: String!, $playerToken: String!) {
    addBot(gameId: $gameId, playerToken: $playerToken)
  }
`;
const REMOVE_BOT = gql`
  mutation RemovePracticeBot(
    $gameId: String!
    $playerToken: String!
    $playerId: String!
  ) {
    removeBot(gameId: $gameId, playerToken: $playerToken, playerId: $playerId)
  }
`;
const AUTOPLAY = gql`
  mutation SetSeatAutoplay(
    $gameId: String!
    $playerToken: String!
    $enabled: Boolean!
  ) {
    setAutoplay(gameId: $gameId, playerToken: $playerToken, enabled: $enabled)
  }
`;
const AWAY = gql`
  mutation HelpAbsentPlayer(
    $gameId: String!
    $playerToken: String!
    $playerId: String!
    $expectedLastSeenAt: Float!
  ) {
    enableAwayAutoplay(
      gameId: $gameId
      playerToken: $playerToken
      playerId: $playerId
      expectedLastSeenAt: $expectedLastSeenAt
    )
  }
`;
const LEAVE = gql`
  mutation LeaveSeat($gameId: String!, $playerToken: String!) {
    leaveGame(gameId: $gameId, playerToken: $playerToken)
  }
`;
type Player = {
  id: string;
  name: string;
  isBot: boolean;
  isAutomated: boolean;
  isAutoplay: boolean;
  lastSeenAt: number | null;
};
type State = {
  phase: string;
  practice: boolean;
  maxPlayers: number;
  me: { id: string; isAutoplay: boolean } | null;
  players: Player[];
};
function Controls({ lobby }: { lobby: boolean }) {
  const gameId = useGameId() ?? "";
  const [playerToken, setToken] = usePlayerToken();
  const client = useApolloClient();
  const navigate = useNavigate();
  const { data, refetch } = useQuery<{ state: State | null }>(PRACTICE_STATE, {
    variables: { gameId, playerToken },
    pollInterval: 10000,
  });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const state = data?.state;
  const me = state?.me;
  if (
    !state ||
    !me ||
    (lobby ? state.phase !== "setup" : state.phase !== "play")
  )
    return null;
  const host =
    state.players.find((player) => !player.isBot && !player.isAutomated)?.id ===
    me.id;
  async function run(
    mutation: typeof ADD_BOT,
    extras: Record<string, unknown> = {},
    leaving = false,
  ) {
    setBusy(true);
    setMessage("");
    try {
      const result = await client.mutate({
        mutation,
        variables: { gameId, playerToken, ...extras },
      });
      if (result.data?.enableAwayAutoplay === false)
        setMessage("That player reconnected or is already on autoplay.");
      await refetch();
      if (leaving) {
        if (lobby) setToken(null, gameId);
        navigate("/");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section
      className="PracticeControls"
      aria-label={lobby ? "Practice opponents" : "Seat controls"}
    >
      {state.practice && (
        <p className="PracticeControls-notice">
          Practice voyage · This match will appear in history but will not count
          toward the leaderboard.
        </p>
      )}
      {lobby ? (
        <>
          <h3>Practice opponents</h3>
          <p>
            Invite friends or add practice pirates. They only see their own
            cards and public play. With two seats, Graybeard also joins.
          </p>
          {host ? (
            <>
              <button
                disabled={busy || state.players.length >= state.maxPlayers}
                onClick={() => void run(ADD_BOT)}
              >
                Add practice pirate
              </button>
              {state.players
                .filter((player) => player.isBot)
                .map((player) => (
                  <p key={player.id}>
                    {player.name}{" "}
                    <button
                      disabled={busy}
                      onClick={() =>
                        void run(REMOVE_BOT, { playerId: player.id })
                      }
                    >
                      Remove {player.name}
                    </button>
                  </p>
                ))}
            </>
          ) : (
            <p>The host can add or remove practice pirates.</p>
          )}
          <button
            className="PracticeControls-leave"
            disabled={busy}
            onClick={() => void run(LEAVE, {}, true)}
          >
            Leave lobby
          </button>
        </>
      ) : (
        <>
          <h3>Your seat</h3>
          {me.isAutoplay ? (
            <>
              <p>
                Autoplay is taking your turns. Your seat and cards are still
                yours.
              </p>
              <button
                disabled={busy}
                onClick={() => void run(AUTOPLAY, { enabled: false })}
              >
                I’m back — take my seat
              </button>
            </>
          ) : (
            <>
              <p>
                Need a break? Autoplay makes your bids and plays until you
                return. Enabling it makes this entire match a practice voyage.
              </p>
              <button
                disabled={busy}
                onClick={() => void run(AUTOPLAY, { enabled: true })}
              >
                Let autoplay take my turns
              </button>
            </>
          )}
          <button
            className="PracticeControls-leave"
            disabled={busy}
            onClick={() => void run(LEAVE, {}, true)}
          >
            Leave with autoplay
          </button>
          {host &&
            state.players
              .filter(
                (player) =>
                  player.id !== me.id &&
                  !player.isBot &&
                  !player.isAutomated &&
                  !player.isAutoplay &&
                  player.lastSeenAt != null &&
                  Date.now() - player.lastSeenAt >= 90_000,
              )
              .map((player) => (
                <p key={player.id}>
                  {player.name} has not connected for at least 90 seconds.{" "}
                  <button
                    disabled={busy}
                    onClick={() =>
                      void run(AWAY, {
                        playerId: player.id,
                        expectedLastSeenAt: player.lastSeenAt,
                      })
                    }
                  >
                    Enable autoplay for {player.name}
                  </button>
                </p>
              ))}
        </>
      )}
      {message && <p role="status">{message}</p>}
    </section>
  );
}
export const LobbyBots = () => <Controls lobby />;
export const RoomControls = () => <Controls lobby={false} />;
