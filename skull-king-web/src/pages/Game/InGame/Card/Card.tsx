import { useId, useState } from "react";
import { Card as CardType } from "../../../../types/graphqlTypes";
import { PIRATE_NAMES } from "../../../../utils/pirateNames";
import "./Card.scss";
import { CardEmblem } from "./CardEmblem";
import { expansionCardDescription } from "../../../../utils/expansionCards";

export const Card: React.FunctionComponent<{
  disabled: boolean;
  disabledReason?: string;
  playability?: string;
  as?: "li" | "div";
  onClick?: Function;
  card: CardType;
  grayOut: boolean;
  index: number;
  children?: React.ReactNode;
  onInspect?: () => void;
  actionLabel?: string;
  className?: string;
  style?: React.CSSProperties;
  interactive?: boolean;
}> = function ({
  disabled,
  disabledReason,
  playability,
  as: Tag = "li",
  onClick,
  card,
  grayOut,
  index,
  children,
  onInspect,
  actionLabel,
  className = "",
  style,
  interactive = false,
}) {
  const descriptionId = useId();
  const [descriptionDismissed, setDescriptionDismissed] = useState(false);
  const description = disabledReason;
  const expansion = expansionCardDescription(
    card.id,
    card.__typename === "ColoredCard" ? card.color : undefined,
    card.__typename === "ColoredCard" ? card.number : undefined,
  );
  const altText =
    expansion?.name ??
    (() => {
      switch (card.__typename) {
        case "ColoredCard":
          return `${card.color.toLocaleUpperCase()} ${card.number}`;
        case "SpecialCard": {
          if (card.selection) {
            return `Tigress: ${card.selection}`;
          }
          if (card.type === "pirate") return PIRATE_NAMES[card.id] ?? "Pirate";
          return card.type === "whiteWhale"
            ? "White Whale"
            : card.type === "loot"
              ? "Loot"
              : ({
                  skullKing: "Skull King",
                  escape: "Escape",
                  mermaid: "Mermaid",
                  kraken: "Kraken",
                  tigress: "Tigress",
                }[card.type] ?? card.type);
        }
        default:
          return "";
      }
    })();

  const contents = (
    <>
      {children && !onInspect ? (
        children
      ) : (
        <button
          className="Card-content"
          disabled={disabled && !onInspect}
          onClick={() => (onInspect ? onInspect() : onClick?.())}
          aria-describedby={description ? descriptionId : undefined}
          aria-label={
            onInspect
              ? `Inspect ${altText}`
              : disabledReason
                ? `${altText}. ${disabledReason}`
                : actionLabel
                  ? `${actionLabel}: ${altText}`
                  : altText
          }
        >
          {expansion ? (
            <span
              className={`Card-expansion Card-expansion--${card.__typename === "ColoredCard" ? card.color.toLowerCase() : "special"}`}
            >
              <strong>{expansion.name}</strong>
              <CardEmblem
                id={card.id}
                number={
                  card.__typename === "ColoredCard" ? card.number : undefined
                }
              />
              <small>{expansion.rule}</small>
            </span>
          ) : card.__typename === "SpecialCard" && card.type === "loot" ? (
            <span className="Card-loot">
              <span className="Card-lootTitle">Loot</span>
              <span className="Card-lootCoin" aria-hidden="true">
                <CardEmblem id="loot" />
              </span>
              <span>Form an alliance</span>
              <span className="Card-lootBonus">+20 each</span>
              <span className="Card-lootRule">
                Both partners must bid exactly
              </span>
            </span>
          ) : (
            <img
              className="Card-image"
              src={`/cards/${card.id}${
                "selection" in card && card.selection
                  ? "-" + card.selection
                  : ""
              }.jpg`}
              alt={altText}
            />
          )}
          {actionLabel && <span className="Card-playLabel">{actionLabel}</span>}
        </button>
      )}
      {playability && (
        <span
          className={`Card-playability${disabled ? "" : " Card-playability--ready"}`}
        >
          <span aria-hidden="true">{disabled ? "−" : "✓"} </span>
          {playability}
        </span>
      )}
      <span className="Card-name">{altText}</span>
    </>
  );

  return (
    <Tag
      className={`Card${grayOut ? " Card-disabled" : ""}${interactive ? " Card--interactive" : ""} ${className}`}
      data-card-id={card.id}
      tabIndex={interactive && disabled && !onInspect ? 0 : undefined}
      aria-label={interactive && disabled && !onInspect ? altText : undefined}
      aria-describedby={interactive && description ? descriptionId : undefined}
      onFocus={() => setDescriptionDismissed(false)}
      onPointerEnter={() => setDescriptionDismissed(false)}
      onKeyDown={(event) => {
        if (event.key === "Escape") setDescriptionDismissed(true);
      }}
      style={{ zIndex: index, ...style }}
      onPointerMove={
        interactive
          ? (event) => {
              if (
                event.pointerType !== "mouse" ||
                window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
              )
                return;
              const rect = event.currentTarget.getBoundingClientRect();
              event.currentTarget.style.setProperty(
                "--pointer-tilt-y",
                `${Math.max(-0.5, Math.min(0.5, (event.clientX - rect.left) / rect.width - 0.5)) * 12}deg`,
              );
              event.currentTarget.style.setProperty(
                "--pointer-tilt-x",
                `${Math.max(-0.5, Math.min(0.5, (event.clientY - rect.top) / rect.height - 0.5)) * -8}deg`,
              );
            }
          : undefined
      }
      onPointerLeave={
        interactive
          ? (event) => {
              event.currentTarget.style.removeProperty("--pointer-tilt-x");
              event.currentTarget.style.removeProperty("--pointer-tilt-y");
            }
          : undefined
      }
      title={description ? undefined : altText}
    >
      {interactive ? (
        <div className="Card-motion">
          <div className="Card-surface">{contents}</div>
          {description && (
            <span
              id={descriptionId}
              role="tooltip"
              className={`Card-reason${descriptionDismissed ? " Card-reason--dismissed" : ""}`}
            >
              {description}
            </span>
          )}
        </div>
      ) : (
        <>
          {contents}
          {description && (
            <span id={descriptionId} className="Card-description">
              {description}
            </span>
          )}
        </>
      )}
    </Tag>
  );
};
