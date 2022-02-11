import { Card as CardType } from "../../../types/graphqlTypes";
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
        <img className="Card-image" src={`/cards/${card.id}.jpg`} />
      </button>
    </li>
  );
};
