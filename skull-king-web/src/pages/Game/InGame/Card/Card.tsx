import { Card as CardType } from "../../../../types/graphqlTypes";
import { PIRATE_NAMES } from "../../../../utils/pirateNames";
import "./Card.scss";
import { CardEmblem } from "./CardEmblem";
import { expansionCardDescription } from "../../../../utils/expansionCards";

export const Card: React.FunctionComponent<{
  disabled: boolean;
  disabledReason?: string;
  as?: "li" | "div";
  onClick?: Function;
  card: CardType;
  grayOut: boolean;
  index: number;
  children?: React.ReactNode;
}> = function ({
  disabled,
  disabledReason,
  as: Tag = "li",
  onClick,
  card,
  grayOut,
  index,
  children,
}) {
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

  return (
    <Tag
      className={`Card${grayOut ? " Card-disabled" : ""}`}
      style={{ zIndex: index }}
      title={disabledReason ? `${altText}: ${disabledReason}` : altText}
    >
      {children ?? (
        <button
          className="Card-content"
          disabled={disabled}
          onClick={() => onClick?.()}
          aria-label={
            disabledReason ? `${altText}. ${disabledReason}` : altText
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
        </button>
      )}
      <span className="Card-name">{altText}</span>
    </Tag>
  );
};
