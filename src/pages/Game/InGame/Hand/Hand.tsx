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
  const gameId = useGameId() ?? ""; // TODO: hacky fallback
  const [justClicked, setJustClicked] = useState(false);

  // TODO: error handling
  const { data, loading } = useMyHandQuery({
    variables: { gameId, playerToken: playerToken! },
  });

  const [playSpecialCard] = usePlaySpecialCardMutation();
  const [playColoredCard] = usePlayColoredCardMutation();

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

  function debounceClick(fn: any) {
    setJustClicked(true);
    fn().then(() => setJustClicked(false));
  }

  if (loading) return <div>Loading...</div>;
  if (!playerToken) return <div>No player token</div>;

  const sortedHand = [...(me?.hand!)].sort((a, b) => {
    return getSortOrder(a) - getSortOrder(b);
  });

  return (
    <div className="Hand">
      {phase === "play" && <p>My hand (my bid: {currentRound?.myBid}):</p>}
      <ul className="Hand-playerHand">
        {sortedHand.map((card) => {
          if (isColoredCard(card)) {
            return (
              <Card
                key={card.id}
                disabled={!myTurn || !canPlayCard(card) || justClicked}
                card={card}
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
              <li key={card.id}>
                Tigress
                <button
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
                >
                  Escape
                </button>
                <button
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
                >
                  Pirate
                </button>
              </li>
            ) : (
              <Card
                disabled={!myTurn || !canPlayCard(card) || justClicked}
                card={card}
                onClick={() => {
                  debounceClick(() =>
                    playSpecialCard({
                      variables: { gameId, playerToken, cardId: card.id },
                    })
                  );
                }}
                key={card.id}
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
