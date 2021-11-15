import { gql, useMutation, useQuery } from "@apollo/client";
import { useState } from "react";
import { usePlayerToken } from "../../../hooks/PlayerTokenContext";
import { useGameId } from "../../../hooks/useGameId";
import { Card, ColoredCard, MyHandQuery, SpecialCard } from "../../../types/graphqlTypes";

export const Hand: React.FunctionComponent = function () {
  const [playerToken] = usePlayerToken();
  const gameId = useGameId();
  const [justClicked, setJustClicked] = useState(false);

  // TODO: error handling
  const { data, loading } = useQuery<MyHandQuery>(
    gql`
      query MyHand($gameId: String!, $playerToken: String!) {
        state(gameId: $gameId, playerToken: $playerToken) {
          id
          me {
            id
            name
            hand {
              __typename
              ... on SpecialCard {
                id
                type
              }
              ... on ColoredCard {
                id
                color
                number
              }
            }
          }
          currentRound {
            id
            phase
            playerTurn
            trickColor
          }
        }
      }
    `,
    {
      variables: { gameId, playerToken },
      pollInterval: 2000,
    }
  );

  const [playSpecialCard] = useMutation(gql`
    mutation PlaySpecialCard(
      $gameId: String!
      $playerToken: String!
      $cardId: String!
      $selection: String
    ) {
      playSpecialCard(
        gameId: $gameId
        playerToken: $playerToken
        cardId: $cardId
        selection: $selection
      )
    }
  `);

  const [playColoredCard] = useMutation(gql`
    mutation PlayColoredCard(
      $gameId: String!
      $playerToken: String!
      $cardId: String!
    ) {
      playColoredCard(
        gameId: $gameId
        playerToken: $playerToken
        cardId: $cardId
      )
    }
  `);

  const currentRound = data?.state?.currentRound;
  const { phase, playerTurn, trickColor } = currentRound ?? {};
  const me = data?.state?.me;
  const myTurn = phase === "play" && playerTurn === me?.name;

  function canPlayCard(card: Card) {
    if (isSpecialCard(card)) return true;
    if (trickColor === null) return true;

    const noMatches = me?.hand.every((card) => {
      if (card.__typename === "SpecialCard") {
        return true;
      } else {
        return card.color !== trickColor;
      }
    });
    const matchesTrickColor = card.color === trickColor;
    return noMatches || matchesTrickColor;
  }

  function debounceClick(fn: any) {
    setJustClicked(true);
    fn().then(() => setJustClicked(false));
  }

  if (loading) return <div>Loading...</div>;
  return (
    <ul>
      {me?.hand.map((card) => {
        if (isColoredCard(card)) {
          return (
            <button
              key={card.color + card.number}
              disabled={!myTurn || !canPlayCard(card) || justClicked}
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
            >
              <li>
                {card.color} {card.number}
              </li>
            </button>
          );
        } else if (isSpecialCard(card)) {
          return (
            <button
              key={card.type}
              disabled={!myTurn || !canPlayCard(card) || justClicked}
              onClick={() => {
                debounceClick(() =>
                  playSpecialCard({
                    variables: { gameId, playerToken, cardId: card.id },
                  })
                );
              }}
            >
              <li>{card.type}</li>
            </button>
          );
        } else {
          throw Error("Unknown card type");
        }
      })}
    </ul>
  );
};

function isSpecialCard(card: Card) : card is SpecialCard {
  return card.__typename === "SpecialCard";
}

function isColoredCard(card: Card) : card is ColoredCard {
  return card.__typename === "ColoredCard";
}