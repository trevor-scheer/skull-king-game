import { usePlayerToken } from "../../../../hooks/PlayerTokenContext";
import { useGameId } from "../../../../hooks/useGameId";
import { usePreviousHandQuery } from "../../../../types/graphqlTypes";

export const PreviousHand: React.FunctionComponent = function () {
  const [playerToken] = usePlayerToken();
  const gameId = useGameId() ?? ""; // TODO: hacky fallback

  const { data, loading } = usePreviousHandQuery({
    variables: {
      gameId,
      playerToken: playerToken!,
    },
  });

  if (loading) return null;
  // console.log(data?.state?.currentRound.hands[0]?.winningCard);

  const card = data?.state?.currentRound.hands[0]?.winningCard?.card;
  if (card?.__typename === "ColoredCard") {
    console.log(card);
  } else if (card?.__typename === "SpecialCard") {
    console.log(card);
  }
  return null;
}