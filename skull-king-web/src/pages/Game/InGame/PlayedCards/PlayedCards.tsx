import { useEffect, useLayoutEffect, useRef } from "react";
import { usePlayerToken } from "../../../../hooks/PlayerTokenContext";
import { useGameId } from "../../../../hooks/useGameId";
import { useCardsPlayedQuery } from "../../../../types/graphqlTypes";
import { Card } from "../Card/Card";
import { CardBack } from "../Card/CardBack";
import { TrickResult } from "../TrickResult/TrickResult";
import { cardMotionChanges, takeCardOrigin, TableMoment } from "./cardMotion";
import "./PlayedCards.scss";

type Snapshot = {
  moment: TableMoment;
  winner?: string | null;
  scrollX: number;
  scrollY: number;
  cards: { id: string; rect: DOMRect; clone: HTMLElement }[];
};

function playerSeat(player: string) {
  return [...document.querySelectorAll<HTMLElement>("[data-player-seat]")].find(
    (seat) => seat.dataset.playerSeat === player,
  );
}
function seatRect(player: string) {
  return playerSeat(player)?.getBoundingClientRect();
}
function opponentHandRect(player: string) {
  const hand = playerSeat(player)?.querySelector<HTMLElement>(
    ".GameTable-opponentHand",
  );
  if (!hand) return undefined;
  const back = hand.querySelector<HTMLElement>("span:last-child .Card");
  const handRect = hand.getBoundingClientRect();
  const width =
    Number.parseFloat(
      getComputedStyle(hand).getPropertyValue("--opponent-card-width"),
    ) || 38;
  const rect =
    back?.getBoundingClientRect() ??
    new DOMRect(
      handRect.left + (handRect.width - width) / 2,
      handRect.top,
      width,
      handRect.height,
    );
  const strip = hand.closest<HTMLElement>(".GameTable-opponents");
  if (!strip || strip.scrollWidth <= strip.clientWidth) return rect;
  const bounds = strip.getBoundingClientRect();
  return new DOMRect(
    Math.min(bounds.right - rect.width, Math.max(bounds.left, rect.left)),
    rect.top,
    rect.width,
    rect.height,
  );
}

export function PlayedCards({
  readOnly = false,
  paused = false,
}: {
  readOnly?: boolean;
  paused?: boolean;
}) {
  const [playerToken] = usePlayerToken();
  const gameId = useGameId();
  const list = useRef<HTMLOListElement>(null);
  const previous = useRef<Snapshot>();
  const animations = useRef(new Set<Animation>());
  const cardAnimations = useRef(new Map<HTMLElement, Animation>());
  const flights = useRef(new Set<HTMLElement>());
  const enteringFlights = useRef(new Map<HTMLElement, () => void>());
  const { data, error, refetch } = useCardsPlayedQuery({
    variables: {
      gameId: gameId!,
      playerToken: readOnly ? "" : (playerToken ?? ""),
    },
    pollInterval: 10000,
  });
  const round = data?.state?.currentRound;
  const result =
    round?.phase === "trick_result" ? round.lastCompletedHand : null;
  const cards =
    result?.cardsPlayed ??
    (round?.phase === "play" ? round.cardsPlayed : []) ??
    [];

  useEffect(() => {
    const reset = () => {
      previous.current = undefined;
      enteringFlights.current.forEach((finish) => finish());
    };
    window.addEventListener("resize", reset);
    window.addEventListener("offline", reset);
    window.addEventListener("online", reset);
    document.addEventListener("visibilitychange", reset);
    return () => {
      window.removeEventListener("resize", reset);
      window.removeEventListener("offline", reset);
      window.removeEventListener("online", reset);
      document.removeEventListener("visibilitychange", reset);
      enteringFlights.current.forEach((finish) => finish());
      animations.current.forEach((animation) => animation.cancel());
      flights.current.forEach((flight) => flight.remove());
    };
  }, []);

  const cardSignature = JSON.stringify(cards);
  const removedSignature = result?.removedCardIds?.join(",");
  useLayoutEffect(() => {
    enteringFlights.current.forEach((finish) => finish());
    if (!round || error) {
      previous.current = undefined;
      return;
    }
    const moment: TableMoment = {
      roundId: round.id,
      phase: round.phase,
      resultId: result?.id,
      cardIds: cards.map((card) => card.id),
    };
    const changes = cardMotionChanges(previous.current?.moment, moment);
    const nodes = [
      ...(list.current?.querySelectorAll<HTMLElement>("[data-play-id]") ?? []),
    ];
    cardAnimations.current.forEach((animation) => animation.finish());
    cardAnimations.current.clear();
    const restingCards = nodes.map((node) => ({
      id: node.dataset.playId!,
      rect: node.getBoundingClientRect(),
      clone: node.cloneNode(true) as HTMLElement,
    }));
    const reduced = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const canAnimate =
      !reduced &&
      !document.hidden &&
      typeof Element.prototype.animate === "function";
    function animate(
      node: HTMLElement,
      frames: Keyframe[],
      options: KeyframeAnimationOptions,
      done?: () => void,
    ) {
      const animation = node.animate(frames, options);
      animations.current.add(animation);
      if (nodes.includes(node)) cardAnimations.current.set(node, animation);
      void animation.finished
        .catch(() => undefined)
        .finally(() => {
          animations.current.delete(animation);
          if (cardAnimations.current.get(node) === animation)
            cardAnimations.current.delete(node);
          done?.();
        });
      return animation;
    }
    if (canAnimate && changes.collecting && previous.current) {
      const target = previous.current.winner
        ? seatRect(previous.current.winner)
        : undefined;
      for (const old of previous.current.cards) {
        const left = old.rect.left + previous.current.scrollX - window.scrollX;
        const top = old.rect.top + previous.current.scrollY - window.scrollY;
        const flight = document.createElement("div");
        flight.className = "PlayedCards TrickFlight";
        flight.setAttribute("aria-hidden", "true");
        flight.inert = true;
        Object.assign(flight.style, {
          position: "fixed",
          left: `${left}px`,
          top: `${top}px`,
          width: `${old.rect.width}px`,
          height: `${old.rect.height}px`,
        });
        old.clone.style.transform = "none";
        flight.append(old.clone);
        document.body.append(flight);
        flights.current.add(flight);
        const x = target
          ? target.left + target.width / 2 - left - old.rect.width / 2
          : 0;
        const y = target
          ? target.top + target.height / 2 - top - old.rect.height / 2
          : -35;
        animate(
          flight,
          [
            { transform: "translate(0, 0) scale(1)", opacity: 1 },
            {
              transform: `translate(${x}px, ${y}px) scale(.22) rotate(12deg)`,
              opacity: 0,
            },
          ],
          {
            duration: 540,
            easing: "cubic-bezier(.45,0,.25,1)",
            fill: "forwards",
          },
          () => {
            flight.remove();
            flights.current.delete(flight);
          },
        );
      }
    }
    if (canAnimate)
      for (const node of nodes) {
        const play = cards.find((card) => card.id === node.dataset.playId)!;
        const rect = node.getBoundingClientRect();
        const tilt = node.style.getPropertyValue("--card-tilt");
        if (changes.entering.includes(play.id)) {
          const opponent = play.playerId !== data?.state?.me?.name;
          const origin =
            (opponent
              ? opponentHandRect(play.playerId)
              : takeCardOrigin(play.card.id)) ?? seatRect(play.playerId);
          const initialScale = origin
            ? Math.min(1.5, Math.max(0.3, origin.width / rect.width))
            : 0.65;
          const x = origin
            ? origin.left + origin.width / 2 - rect.left - rect.width / 2
            : 0;
          const y = origin
            ? origin.top + origin.height / 2 - rect.top - rect.height / 2
            : -70;
          const flight = document.createElement("div");
          flight.className = "PlayedCards TrickFlight CardFlight";
          flight.setAttribute("aria-hidden", "true");
          flight.inert = true;
          const clone = node.cloneNode(true) as HTMLElement;
          // The overlay escapes scroll containers; match its untransformed layout
          // so the final frame lines up with the card in the table.
          const width = node.offsetWidth || rect.width;
          const height = node.offsetHeight || rect.height;
          Object.assign(flight.style, {
            position: "fixed",
            left: `${rect.left + (rect.width - width) / 2}px`,
            top: `${rect.top + (rect.height - height) / 2}px`,
            width: `${width}px`,
            height: `${height}px`,
          });
          clone.style.visibility = "visible";
          flight.append(clone);
          document.body.append(flight);
          flights.current.add(flight);
          node.style.visibility = "hidden";
          const flightAnimations: Animation[] = [];
          let finished = false;
          const finishFlight = () => {
            if (finished) return;
            finished = true;
            node.style.removeProperty("visibility");
            flight.remove();
            flights.current.delete(flight);
            enteringFlights.current.delete(node);
            flightAnimations.forEach((animation) => animation.cancel());
          };
          enteringFlights.current.set(node, finishFlight);
          function animateFlight(
            target: HTMLElement,
            frames: Keyframe[],
            options: KeyframeAnimationOptions,
            done?: () => void,
          ) {
            flightAnimations.push(animate(target, frames, options, done));
          }
          animateFlight(
            clone,
            [
              {
                transform: `translate(${x}px, ${y}px) rotate(-12deg) scale(${initialScale})`,
                opacity: 1,
              },
              {
                transform: `translate(${x * 0.35}px, ${y * 0.35 - 24}px) rotate(7deg) scale(1.12)`,
                offset: 0.5,
              },
              {
                transform: `translate(0, -5px) rotate(${tilt}) scale(1.035)`,
                opacity: 1,
                offset: 0.8,
              },
              {
                transform: `translate(0, 0) rotate(${tilt}) scale(1)`,
                opacity: 1,
              },
            ],
            { duration: 720, easing: "cubic-bezier(.22,.7,.3,1)" },
            finishFlight,
          );
          if (opponent) {
            const face = clone.querySelector<HTMLElement>(
              ".PlayedCards-cardFace > .Card:not(.PlayedCards-flightBack)",
            );
            const back = clone.querySelector<HTMLElement>(
              ".PlayedCards-flightBack",
            );
            if (face && back) {
              animateFlight(
                face,
                [
                  { transform: "rotateY(180deg)", offset: 0 },
                  { transform: "rotateY(180deg)", offset: 0.12 },
                  { transform: "rotateY(0deg)", offset: 0.7 },
                  { transform: "rotateY(0deg)" },
                ],
                { duration: 720, easing: "ease-in-out" },
              );
              animateFlight(
                back,
                [
                  { transform: "rotateY(0deg)", opacity: 1, offset: 0 },
                  { transform: "rotateY(0deg)", opacity: 1, offset: 0.12 },
                  { transform: "rotateY(-180deg)", opacity: 1, offset: 0.7 },
                  { transform: "rotateY(-180deg)", opacity: 0 },
                ],
                { duration: 720, easing: "ease-in-out" },
              );
            }
          }
          const label = clone.querySelector<HTMLElement>(
            ".PlayedCards-playerLabel",
          );
          if (label)
            animateFlight(
              label,
              [{ opacity: 0 }, { opacity: 0, offset: 0.65 }, { opacity: 1 }],
              { duration: 720 },
            );
        } else {
          const old = previous.current?.cards.find(
            (card) => card.id === play.id,
          );
          const dx = old
            ? old.rect.left +
              previous.current!.scrollX -
              window.scrollX -
              rect.left
            : 0;
          const dy = old
            ? old.rect.top +
              previous.current!.scrollY -
              window.scrollY -
              rect.top
            : 0;
          if (old && (Math.abs(dx) > 1 || Math.abs(dy) > 1)) {
            animate(
              node,
              [
                {
                  transform: `translate(${dx}px, ${dy}px) rotate(${tilt})`,
                },
                { transform: `translate(0, 0) rotate(${tilt})` },
              ],
              { duration: 240, easing: "ease-out" },
            );
          }
        }
      }
    previous.current = {
      moment,
      scrollX: window.scrollX,
      scrollY: window.scrollY,
      winner: result?.winningCard?.playerId,
      cards: restingCards,
    };
  }, [
    round?.id,
    round?.phase,
    cardSignature,
    result?.id,
    result?.winningCard?.playerId,
    removedSignature,
    error,
    data?.state?.me?.name,
  ]);

  if (error && !data)
    return (
      <p role="alert">
        Couldn’t load the trick.{" "}
        <button onClick={() => void refetch().catch(() => undefined)}>
          Retry
        </button>
      </p>
    );
  if (!round || !["play", "trick_result"].includes(round.phase)) return null;
  return (
    <div className={`PlayedCards${result ? " PlayedCards--result" : ""}`}>
      {result ? (
        <TrickResult
          readOnly={readOnly}
          paused={paused}
          hand={result}
          refetch={refetch}
        />
      ) : (
        <div className="PlayedCards-header">
          <span className="PlayedCards-title">Current Trick</span>
          <span className="PlayedCards-count">
            {cards.length} card{cards.length !== 1 ? "s" : ""} played
          </span>
        </div>
      )}
      {cards.length === 0 && (
        <div className="PlayedCards-emptyText">
          Play a card to begin the trick
        </div>
      )}
      <ol
        className="PlayedCards-cards"
        ref={list}
        aria-label="Cards on the table"
      >
        {cards.map(({ id, playerId, card }, index) => (
          <li
            key={`${round.id}-${id}`}
            data-play-id={id}
            className={`PlayedCards-cardWrapper${result?.winningCard?.id === id ? " PlayedCards-cardWrapper--winner" : ""}${result?.removedCardIds?.includes(card.id) ? " PlayedCards-cardWrapper--removed" : ""}`}
            style={
              {
                "--card-tilt": `${[-5, 4, -2, 6, -4, 2, -6, 3, 0][index % 9]}deg`,
              } as React.CSSProperties
            }
          >
            <div className="PlayedCards-cardFace">
              <Card
                as="div"
                card={card}
                disabled
                grayOut={false}
                index={index}
              />
              <div aria-hidden="true" className="PlayedCards-backFace">
                <CardBack className="PlayedCards-flightBack" />
              </div>
            </div>
            <span className="PlayedCards-playerLabel">
              {playerId}
              {result?.removedCardIds?.includes(card.id) ? " · Removed" : ""}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
