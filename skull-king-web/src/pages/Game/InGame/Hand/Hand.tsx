import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { usePlayerToken } from "../../../../hooks/PlayerTokenContext";
import { useGameId } from "../../../../hooks/useGameId";
import {
  Card as CardType,
  ColoredCard,
  Color,
  SpecialCard,
  useMyHandQuery,
  usePlayColoredCardMutation,
  usePlaySpecialCardMutation,
} from "../../../../types/graphqlTypes";
import { isColoredCard, isSpecialCard } from "../../../../utils";
import { Card } from "../Card/Card";
import "./Hand.scss";
import { rememberCardOrigin } from "../PlayedCards/cardMotion";

export const Hand: React.FunctionComponent = function () {
  const [playerToken] = usePlayerToken();
  const gameId = useGameId() ?? ""; // TODO: hacky fallback
  const [justClicked, setJustClicked] = useState(false);
  const [compact, setCompact] = useState(() =>
    Boolean(window.matchMedia?.("(max-width: 600px)").matches),
  );
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const handRef = useRef<HTMLUListElement>(null);
  const inspectionRef = useRef<HTMLElement>(null);
  const previousPositions = useRef(new Map<string, number>());
  useEffect(() => {
    if (compact && selectedCardId)
      inspectionRef.current?.scrollIntoView?.({ block: "nearest" });
  }, [compact, selectedCardId]);
  useEffect(() => {
    if (!window.matchMedia) return;
    const media = window.matchMedia("(max-width: 600px)");
    const update = () => setCompact(media.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const [actionError, setActionError] = useState<string | null>(null);
  const { data, loading, error, refetch } = useMyHandQuery({
    variables: { gameId, playerToken: playerToken! },
    pollInterval: 10000,
    skip: !gameId || !playerToken,
  });

  const handKey = data?.state?.me?.hand
    .map((card) => card.id)
    .sort()
    .join(",");
  useLayoutEffect(() => {
    const cards =
      handRef.current?.querySelectorAll<HTMLElement>("[data-card-id]");
    if (!cards) return;
    const nextPositions = new Map<string, number>();
    cards.forEach((card) => {
      const id = card.dataset.cardId!;
      const left = card.offsetLeft;
      const previous = previousPositions.current.get(id);
      if (
        previous !== undefined &&
        previous !== left &&
        !window.matchMedia?.("(prefers-reduced-motion: reduce)").matches &&
        card.animate
      ) {
        const base = getComputedStyle(card).transform;
        card.animate(
          [
            {
              transform: `translateX(${previous - left}px) ${base === "none" ? "" : base}`,
            },
            { transform: base },
          ],
          { duration: 230, easing: "cubic-bezier(.2,.8,.2,1)" },
        );
      }
      nextPositions.set(id, left);
    });
    previousPositions.current = nextPositions;
  }, [handKey]);

  useEffect(() => {
    setSelectedCardId(null);
  }, [data?.state?.currentRound?.id]);

  const [playSpecialCard] = usePlaySpecialCardMutation();
  const [playColoredCard] = usePlayColoredCardMutation();

  if (error && !data)
    return (
      <p role="alert">
        Couldn’t load your hand.{" "}
        <button onClick={() => void refetch()}>Retry</button>
      </p>
    );
  if (loading && !data) return <div>Loading...</div>;
  if (!playerToken) return <div>No player token</div>;

  const currentRound = data?.state?.currentRound;
  const { phase, playerTurn, trickColor } = currentRound ?? {};
  const me = data?.state?.me;
  if (!me)
    return <p role="status">Your player seat is unavailable in this game.</p>;
  const myTurn = phase === "play" && playerTurn === me?.name;

  const legalCardIds = new Set(data?.state?.legalCardIds ?? []);
  const canPlayCard = (card: CardType) => legalCardIds.has(card.id);
  const disabledReason = !myTurn
    ? "Wait for your turn."
    : currentRound?.myForcedCardId
      ? "Mary selected a different card for this trick."
      : trickColor
        ? `Follow ${trickColor.toLowerCase()} while you hold that suit, or play a special card.`
        : "This card is unavailable while the table updates.";

  async function debounceClick(cardId: string, fn: () => Promise<unknown>) {
    if (justClicked) return;
    setJustClicked(true);
    setActionError(null);
    try {
      rememberCardOrigin(cardId);
      await fn();
      setSelectedCardId(null);
      void refetch?.();
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "Couldn’t play that card. Try again.",
      );
    } finally {
      setJustClicked(false);
    }
  }

  const sortedHand = [...me?.hand!].sort((a, b) => {
    return getSortOrder(a) - getSortOrder(b);
  });

  const seatToken = playerToken;
  function renderCard(
    card: ColoredCard | SpecialCard,
    index: number,
    preview = false,
  ) {
    const commonProps = {
      disabled: !myTurn || !canPlayCard(card) || justClicked,
      grayOut:
        phase === "play" && (!myTurn || !canPlayCard(card) || justClicked),
      card,
      index,
      onInspect:
        compact && !preview ? () => setSelectedCardId(card.id) : undefined,
      actionLabel:
        preview && myTurn && canPlayCard(card) ? "Play this card" : undefined,
      className: preview
        ? "Hand-previewCard"
        : selectedCardId === card.id
          ? "Hand-card--selected"
          : "",
      style: preview
        ? undefined
        : ({
            "--fan-angle": `${(index - (sortedHand.length - 1) / 2) * Math.min(2.1, 15 / Math.max(1, sortedHand.length))}deg`,
            "--fan-offset": `${Math.abs(index - (sortedHand.length - 1) / 2) * 1.5}px`,
          } as React.CSSProperties),
      disabledReason:
        !canPlayCard(card) || !myTurn ? disabledReason : undefined,
    };
    if (isColoredCard(card)) {
      const choices = card.choice
        ? [0, 14]
        : card.wild && !trickColor
          ? [Color.Yellow, Color.Green, Color.Purple]
          : [];
      if (choices.length)
        return (
          <Card key={card.id} {...commonProps}>
            <div className="Card-expansion Card-declaration">
              <strong>
                {card.choice ? `${card.color} 0 / 14` : "Wild Monkey 15"}
              </strong>
              <span>Play as</span>
              {choices.map((choice) => (
                <button
                  key={choice}
                  disabled={commonProps.disabled}
                  onClick={() =>
                    void debounceClick(card.id, () =>
                      playColoredCard({
                        variables: {
                          gameId,
                          playerToken: seatToken,
                          cardId: card.id,
                          ...(typeof choice === "number"
                            ? { numberChoice: choice }
                            : { colorChoice: choice }),
                        },
                      }),
                    )
                  }
                >
                  {choice}
                </button>
              ))}
            </div>
          </Card>
        );
      return (
        <Card
          key={card.id}
          {...commonProps}
          onClick={() => {
            debounceClick(card.id, () =>
              playColoredCard({
                variables: {
                  gameId,
                  playerToken: seatToken,
                  cardId: card.id,
                },
              }),
            );
          }}
        />
      );
    } else if (isSpecialCard(card)) {
      return card.type === "tigress" ? (
        <Card key={card.id} {...commonProps}>
          <div className="Card-content">
            <button
              className="Card-tigress-btn Card-tigress-btn--escape"
              disabled={!myTurn || !canPlayCard(card) || justClicked}
              onClick={() => {
                debounceClick(card.id, () =>
                  playSpecialCard({
                    variables: {
                      gameId,
                      playerToken: seatToken,
                      cardId: card.id,
                      selection: "escape",
                    },
                  }),
                );
              }}
              aria-label="Play as Escape"
            >
              Escape
            </button>
            <button
              className="Card-tigress-btn Card-tigress-btn--pirate"
              disabled={!myTurn || !canPlayCard(card) || justClicked}
              onClick={() => {
                debounceClick(card.id, () =>
                  playSpecialCard({
                    variables: {
                      gameId,
                      playerToken: seatToken,
                      cardId: card.id,
                      selection: "pirate",
                    },
                  }),
                );
              }}
              aria-label="Play as Pirate"
            >
              Pirate
            </button>
            <img
              className="Card-image"
              src={`/cards/${card.id}.jpg`}
              alt="Tigress"
            />
          </div>
        </Card>
      ) : (
        <Card
          key={card.id}
          {...commonProps}
          onClick={() => {
            debounceClick(card.id, () =>
              playSpecialCard({
                variables: { gameId, playerToken: seatToken, cardId: card.id },
              }),
            );
          }}
        />
      );
    } else {
      throw Error("Unknown card type");
    }
  }
  const selectedCard = sortedHand.find((card) => card.id === selectedCardId);

  return (
    <div
      className={`Hand${myTurn ? " Hand--myTurn" : ""}`}
      data-player-seat={me.name}
    >
      <p className="Hand-label">
        {myTurn ? "Your Turn!" : "My Hand"}
        {phase === "play" && ` · Bid: ${currentRound?.myBid}`}
      </p>
      {sortedHand.length > 3 && (
        <p className="Hand-scrollHint">
          Swipe to see all {sortedHand.length} cards →
        </p>
      )}
      {currentRound?.myForcedCardId && (
        <p role="status">
          Mary Thorne selected your next card. You must play the highlighted
          card.
        </p>
      )}
      {phase === "play" && (
        <p className="Hand-guidance">
          {myTurn
            ? currentRound?.myForcedCardId
              ? "Mary’s selected card must be played, even off suit."
              : trickColor
                ? `Follow ${trickColor.toLowerCase()} if you have it. Special cards are always allowed.`
                : "No lead suit yet. Choose a card to play."
            : playerTurn
              ? `Waiting for ${playerTurn}.`
              : "Resolving the trick’s choices."}{" "}
          {compact
            ? "Tap a card to inspect it, then choose Play."
            : "Use Tab to move between playable cards and Enter to play."}
        </p>
      )}
      {actionError && <p role="alert">{actionError}</p>}
      <ul
        ref={handRef}
        className="Hand-playerHand"
        style={
          {
            "--hand-card-count": Math.max(1, sortedHand.length),
          } as React.CSSProperties
        }
      >
        {sortedHand.map((card, index) => renderCard(card, index))}
      </ul>
      {compact && selectedCard && (
        <section
          ref={inspectionRef}
          className="Hand-inspection"
          aria-label="Selected card"
        >
          <div className="Hand-inspectionHeader">
            <p>
              {myTurn && canPlayCard(selectedCard)
                ? "Ready to play?"
                : "Inspect your card"}
            </p>
            <button
              onClick={() => setSelectedCardId(null)}
              aria-label="Close card preview"
            >
              Close
            </button>
          </div>
          <ul>{renderCard(selectedCard, 0, true)}</ul>
          {(!myTurn || !canPlayCard(selectedCard)) && (
            <p className="Hand-guidance">{disabledReason}</p>
          )}
        </section>
      )}
    </div>
  );
};

function getSortOrder(card: SpecialCard | ColoredCard) {
  const bases: Record<string, number> = {
    YELLOW: 0,
    GREEN: 20,
    PURPLE: 40,
    BLACK: 60,
    pirate: 80,
    maryThorne: 81,
    firstMate: 87,
    lastVolley: 93,
    walkThePlank: 94,
    stingray: 97,
    davyJones: 98,
    mermaid: 75,
    tigress: 85,
    skullKing: 90,
    escape: 91,
    loot: 92,
    whiteWhale: 95,
    kraken: 96,
  };

  if (isColoredCard(card)) {
    return bases[card.color] + card.number;
  } else {
    return bases[card.type] ?? 100;
  }
}
