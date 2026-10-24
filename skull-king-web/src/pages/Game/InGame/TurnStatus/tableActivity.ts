import { GameStateQuery } from "../../../../types/graphqlTypes";

type State = NonNullable<GameStateQuery["state"]>;

export function tableActivity(
  state: State | null | undefined,
  spectator: boolean,
) {
  const round = state?.currentRound;
  const me = spectator ? null : state?.me;
  const choice = round?.plankChoice ?? round?.pirateAbility;
  const actor =
    choice?.playerId ?? (round?.phase === "play" ? round.playerTurn : null);
  const name =
    state?.players.find((player) => player.id === actor)?.name ?? actor;
  const ownAction = Boolean(actor && actor === me?.id && !me?.isAutoplay);
  const turnKey = `${round?.id}:${round?.hands.length}:${round?.cardsPlayed?.map((card) => card.id).join(",")}:${actor}:${choice?.id ?? "play"}`;

  if (round?.phase === "bid")
    return {
      title: round.bidRevealEndsAt ? "Bids locked" : "Secret bidding",
      detail: round.bidRevealEndsAt
        ? "All together now — bids are about to be revealed."
        : round.myBid != null && me
          ? "Your bid is in. Waiting for the other players."
          : me && !me.isAutoplay
            ? "Choose how many tricks you will win."
            : "Players are choosing their bids.",
    };
  if (round?.phase === "load")
    return {
      title: "Secret cannon loads",
      detail: "Players are choosing their cannon loads.",
    };
  if (choice) {
    const detail = round?.plankChoice
      ? "Choose a Pirate to remove."
      : `Choose ${round?.pirateAbility?.name}’s power.`;
    return {
      title: ownAction ? "Your choice" : `${name} is choosing`,
      detail: ownAction ? detail : "Play resumes after this choice.",
      actor,
      seatLabel: "Choosing",
      ownAction,
      turnKey,
    };
  }
  if (actor)
    return {
      title: ownAction ? "Your turn" : `${name}’s turn`,
      detail: ownAction
        ? "Play a highlighted card from your hand."
        : actor === me?.id && me.isAutoplay
          ? "Autoplay is playing for you. Manage it in Table options."
          : `Waiting for ${name} to play a card.`,
      actor,
      seatLabel: "Playing now",
      ownAction,
      yourTurn: ownAction,
      turnKey,
    };
  return {
    title: "Trick complete",
    detail: "Review the result. The next trick will begin shortly.",
  };
}
