import { Card as CardType } from "../../../types/graphqlTypes";
import { isSpecialCard } from "../../../utils";

export const Card: React.FunctionComponent<{
  disabled: boolean;
  onClick?: Function;
  card: CardType;
}> = function ({ disabled, onClick, card }) {
  return (
    <button className="Card" disabled={disabled} onClick={() => onClick?.()}>
      <div className="Card-content">
        {isSpecialCard(card) ? (
          <p>{card.type}</p>
        ) : (
          <p>
            {card.color} {card.number}
          </p>
        )}
      </div>
    </button>
  );
};
