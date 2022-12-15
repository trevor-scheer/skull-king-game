import { Card as CardType } from "../../../../types/graphqlTypes";
import "./Card.scss";

export const Card: React.FunctionComponent<{
  disabled: boolean;
  onClick?: Function;
  card: CardType;
  grayOut: boolean;
  index: number;
}> = function ({ disabled, onClick, card, grayOut, index }) {
  const altText = (() => {
    switch (card.__typename) {
      case "ColoredCard":
        return `${card.color.toLocaleUpperCase()} ${card.number}`;
      case "SpecialCard": {
        if (card.selection) {
          return `Tigress: ${card.selection}`;
        }
        return card.type;
      }
      default:
        return "";
    }
  })();
  return (
    <li
      className={`Card${grayOut ? " Card-disabled" : ""}`}
      style={{ zIndex: index }}
    >
      <button
        className="Card-content"
        disabled={disabled}
        onClick={() => onClick?.()}
      >
        <img
          className="Card-image"
          src={`/cards/${card.id}.jpg`}
          alt={altText}
        />
      </button>
    </li>
  );
};
