import { useState } from "react";
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

export const Hand: React.FunctionComponent = function () {
  const [playerToken] = usePlayerToken();
  const gameId = useGameId() ?? ""; // TODO: hacky fallback
  const [justClicked, setJustClicked] = useState(false);

  const [actionError, setActionError] = useState<string | null>(null);
  const { data, loading, error, refetch } = useMyHandQuery({
    variables: { gameId, playerToken: playerToken! },
    pollInterval: 10000,
    skip: !gameId || !playerToken,
  });

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

  function canPlayCard(card: CardType) {
    if (currentRound?.myForcedCardId)
      return currentRound.myForcedCardId === card.id;
    if (isSpecialCard(card)) return true;
    if (card.wild && trickColor !== "BLACK") return true;
    if (trickColor === null) return true;

    const noMatches = me?.hand.every((card) => {
      if (card.__typename === "SpecialCard") {
        return true;
      } else if (card.__typename === "ColoredCard") {
        return (
          card.color !== trickColor && !(card.wild && trickColor !== "BLACK")
        );
      }
      return false;
    });
    const matchesTrickColor = card.color === trickColor;
    return noMatches || matchesTrickColor;
  }

  async function debounceClick(fn: () => Promise<unknown>) {
    if (justClicked) return;
    setJustClicked(true);
    setActionError(null);
    try {
      await fn();
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

  return (
    <div className={`Hand${myTurn ? " Hand--myTurn" : ""}`}>
      {phase === "play" && (
        <p className="Hand-label">
          {myTurn ? "Your Turn!" : "My Hand"} (Bid: {currentRound?.myBid})
        </p>
      )}
      {currentRound?.myForcedCardId && (
        <p role="status">
          Mary Thorne selected your next card. You must play the highlighted
          card.
        </p>
      )}
      {actionError && <p role="alert">{actionError}</p>}
      <ul className="Hand-playerHand">
        {sortedHand.map((card, index) => {
          const commonProps = {
            disabled: !myTurn || !canPlayCard(card) || justClicked,
            grayOut:
              phase === "play" &&
              (!myTurn || !canPlayCard(card) || justClicked),
            card,
            index,
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
                          void debounceClick(() =>
                            playColoredCard({
                              variables: {
                                gameId,
                                playerToken,
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
                  debounceClick(() =>
                    playColoredCard({
                      variables: {
                        gameId,
                        playerToken,
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
                      debounceClick(() =>
                        playSpecialCard({
                          variables: {
                            gameId,
                            playerToken,
                            cardId: card.id,
                            selection: "escape",
                          },
                        }),
                      );
                    }}
                    aria-label="Play as Escape"
                  />
                  <button
                    className="Card-tigress-btn Card-tigress-btn--pirate"
                    disabled={!myTurn || !canPlayCard(card) || justClicked}
                    onClick={() => {
                      debounceClick(() =>
                        playSpecialCard({
                          variables: {
                            gameId,
                            playerToken,
                            cardId: card.id,
                            selection: "pirate",
                          },
                        }),
                      );
                    }}
                    aria-label="Play as Pirate"
                  />
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
                  debounceClick(() =>
                    playSpecialCard({
                      variables: { gameId, playerToken, cardId: card.id },
                    }),
                  );
                }}
              />
            );
          } else {
            throw Error("Unknown card type");
          }
        })}
      </ul>
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
