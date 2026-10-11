import {
  createContext,
  FunctionComponent,
  ReactNode,
  useContext,
} from "react";
import { useGameId } from "./useGameId";
import { useLocalStorage } from "./useLocalStorage";

const PlayerTokenContext = createContext<{
  playerToken: string | null;
  setPlayerToken: (token: string | null, gameId: string | null) => void;
}>({ playerToken: null, setPlayerToken: () => {} });

export const PlayerTokenProvider: FunctionComponent<{
  children: ReactNode;
}> = ({ children }) => {
  const gameId = useGameId();
  const [skullKingTokens, setSkullKingTokens] = useLocalStorage(
    "skullKing",
    {} as Record<string, string>
  );

  const playerToken = gameId ? skullKingTokens[gameId] ?? null : null;

  const setPlayerToken = (token: string | null, gameId: string | null) => {
    if (!gameId) return; // TODO: throw error?
    const updated = { ...skullKingTokens };
    if (token) updated[gameId] = token;
    else delete updated[gameId];
    setSkullKingTokens(updated);
  };

  return (
    <PlayerTokenContext.Provider value={{ playerToken, setPlayerToken }}>
      {children}
    </PlayerTokenContext.Provider>
  );
};

export function usePlayerToken(): [
  string | null,
  (token: string | null, gameId: string | null) => void
] {
  const { playerToken, setPlayerToken } = useContext(PlayerTokenContext);
  return [playerToken, setPlayerToken];
}
