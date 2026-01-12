import { useParams } from "react-router-dom";

export function useGameId(): string | null {
  const { id: gameId } = useParams<{ id: string }>();
  return gameId ?? null;
}
