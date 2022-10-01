import { useParams } from "react-router-dom";

export function useGameId(): string {
  const { id: gameId = "" } = useParams<{ id: string }>();
  return gameId;
}
