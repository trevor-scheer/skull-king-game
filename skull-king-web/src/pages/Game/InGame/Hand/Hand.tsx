import { useState } from "react";
import { usePlayerToken } from "../../../../hooks/PlayerTokenContext";
import { useGameId } from "../../../../hooks/useGameId";
import {
  Card as CardType,
  ColoredCard,
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
  const gameId = useGameId();
  const [justClicked, setJustClicked] = useState(false);

  const { data, loading } = useMyHandQuery({
    variables: { gameId: gameId ?? "", playerToken: playerToken ?? "" },
    pollInterval: 2000,
    skip: !gameId || !playerToken,
  });

  const [playSpecialCard] = usePlaySpecialCardMutation();
  const [playColoredCard] = usePlayColoredCardMutation();

  if (!playerToken) return <div>No player token</div>;
  if (!gameId) return <div>No game ID</div>;
  if (loading) return <div>Loading...</div>;

  const currentRound = data?.state?.currentRound;
  const { phase, playerTurn, trickColor } = currentRound ?? {};
  const me = data?.state?.me;
  const myTurn = phase === "play" && playerTurn === me?.name;

  // useEffect(() => {
  //   if (myTurn) {
  //     const audio = new Audio("/audio/smb3_coin.wav");
  //     try {
  //       audio.play();
  //     } catch (e) {
  //       console.error(e);
  //     }
  //   }
  // }, [myTurn]);

  function canPlayCard(card: CardType) {
    if (isSpecialCard(card)) return true;
    if (trickColor === null) return true;

    const noMatches = me?.hand.every((card) => {
      if (card.__typename === "SpecialCard") {
        return true;
      } else if (card.__typename === "ColoredCard") {
        return card.color !== trickColor;
      }
      return false;
    });
    const matchesTrickColor = card.color === trickColor;
    return noMatches || matchesTrickColor;
  }

  function debounceClick(fn: () => Promise<unknown>) {
    setJustClicked(true);
    fn().finally(() => setJustClicked(false));
  }

  if (!me?.hand) {
    return <div>Loading hand...</div>;
  }

  const sortedHand = [...me.hand].sort((a, b) => {
    return getSortOrder(a) - getSortOrder(b);
  });

  return (
    <div className={`Hand${myTurn ? " Hand--myTurn" : ""}`}>
      {phase === "play" && (
        <p className="Hand-label">
          {myTurn ? "Your Turn!" : "My Hand"} (Bid: {currentRound?.myBid})
        </p>
      )}
      <ul className="Hand-playerHand">
        {sortedHand.map((card, index) => {
          const commonProps = {
            key: card.id,
            disabled: !myTurn || !canPlayCard(card) || justClicked,
            grayOut:
              phase === "play" &&
              (!myTurn || !canPlayCard(card) || justClicked),
            card,
            index,
          };
          if (isColoredCard(card)) {
            return (
              <Card
                {...commonProps}
                onClick={() => {
                  debounceClick(() =>
                    playColoredCard({
                      variables: {
                        gameId,
                        playerToken,
                        cardId: card.id,
                      },
                    })
                  );
                }}
              />
            );
          } else if (isSpecialCard(card)) {
            return card.type === "tigress" ? (
              <Card {...commonProps}>
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
                        })
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
                        })
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
                {...commonProps}
                onClick={() => {
                  debounceClick(() =>
                    playSpecialCard({
                      variables: { gameId, playerToken, cardId: card.id },
                    })
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
    tigress: 85,
    skullKing: 90,
    escape: 91,
  };

  if (isColoredCard(card)) {
    return bases[card.color] + card.number;
  } else {
    return bases[card.type];
  }
}
