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
  setPlayerToken: (token: string, gameId: string | null) => void;
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

  const setPlayerToken = (token: string, gameId: string | null) => {
    if (!gameId) return; // TODO: throw error?
    setSkullKingTokens({
      ...skullKingTokens,
      [gameId]: token,
    });
  };

  return (
    <PlayerTokenContext.Provider value={{ playerToken, setPlayerToken }}>
      {children}
    </PlayerTokenContext.Provider>
  );
};

export function usePlayerToken(): [
  string | null,
  (token: string, gameId: string | null) => void
] {
  const { playerToken, setPlayerToken } = useContext(PlayerTokenContext);
  return [playerToken, setPlayerToken];
}
