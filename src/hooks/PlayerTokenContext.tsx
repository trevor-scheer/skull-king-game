import {
  createContext,
  FunctionComponent,
  useContext,
  useEffect,
  useState,
} from "react";
import { useParams } from "react-router-dom";
import { useLocalStorage } from "./useLocalStorage";

const PlayerTokenContext = createContext<{
  playerToken: string | null;
  setPlayerToken: (token: string) => void;
}>({ playerToken: null, setPlayerToken: () => {} });

export const PlayerTokenProvider: FunctionComponent = ({ children }) => {
  const { id: gameId } = useParams<{ id: string }>();
  const [skullKingTokens, setSkullKingTokens] = useLocalStorage(
    "skullKing",
    {}
  );

  const [playerToken, setToken] = useState<null | string>(
    skullKingTokens[gameId] ?? null
  );

  useEffect(() => {
    if (playerToken) return;
    setToken(skullKingTokens[gameId] ?? null);
  }, [playerToken, setToken, skullKingTokens, gameId]);

  const setPlayerToken = (token: string) => {
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

export function usePlayerToken(): [string | null, (token: string) => void] {
  const { playerToken, setPlayerToken } = useContext(PlayerTokenContext);
  return [playerToken, setPlayerToken];
}
