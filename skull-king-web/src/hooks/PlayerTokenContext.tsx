import {
  createContext,
  FunctionComponent,
  ReactNode,
  useContext,
  useEffect,
  useState,
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
  const [skullKingTokens, setSkullKingTokens] = useLocalStorage<Record<string, string>>(
    "skullKing",
    {}
  );

  const token = gameId ? skullKingTokens[gameId] : null;
  const [playerToken, setToken] = useState<null | string>(token);
  
  useEffect(() => {
    if (playerToken) return;
    setToken(token);
  }, [playerToken, setToken, token, gameId, skullKingTokens]);

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
