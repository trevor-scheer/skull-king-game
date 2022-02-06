import { Card as CardType } from "../../../types/graphqlTypes";
import { isSpecialCard } from "../../../utils";
import "./Card.scss";

export const Card: React.FunctionComponent<{
  disabled: boolean;
  onClick?: Function;
  card: CardType;
}> = function ({ disabled, onClick, card }) {
  return (
    <li className="Card">
      <button
        className="Card-content"
        disabled={disabled}
        onClick={() => onClick?.()}
      >
        <div>
          {isSpecialCard(card) ? (
            <p>{card.type}</p>
          ) : (
            <p>
              {card.color} {card.number}
            </p>
          )}
        </div>
      </button>
    </li>
  );
};
