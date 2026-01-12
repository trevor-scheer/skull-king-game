import "./Card.scss";

interface CardBackProps {
  size?: "small" | "normal" | "large";
  className?: string;
}

export const CardBack: React.FunctionComponent<CardBackProps> = ({
  size = "normal",
  className = "",
}) => {
  const sizeClass = size === "small" ? "Card--small" : size === "large" ? "Card--large" : "";

  return (
    <div className={`Card ${sizeClass} ${className}`.trim()}>
      <div className="Card-back" />
    </div>
  );
};
