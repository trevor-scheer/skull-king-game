import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useLocalStorage } from "./useLocalStorage";

export function usePlayerToken(): [string | null, (token: string) => void] {
  const { id: gameId } = useParams<{ id: string }>();
  const [skullKingTokens, setSkullKingTokens] = useLocalStorage(
    "skullKing",
    {}
    );
  
  const [token, setToken] = useState<null | string>(
    skullKingTokens[gameId] ?? null
  );

  useEffect(() => {
    if (token) return;
    setToken(skullKingTokens[gameId] ?? null);
  }, [token, setToken, skullKingTokens, gameId]);

  const setPlayerToken = (token: string) => {
    setSkullKingTokens({
      ...skullKingTokens,
      [gameId]: token,
    });
  };
  return [token, setPlayerToken];
}
