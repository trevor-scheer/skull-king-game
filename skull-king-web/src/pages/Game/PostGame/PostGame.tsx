import { Scorecard } from "../InGame/Scorecard/Scorecard";
import "./PostGame.scss";

export function PostGame() {
  return (
    <div className="PostGame">
      <div className="PostGame-header">
        <h1 className="PostGame-title">Game Over!</h1>
        <p className="PostGame-subtitle">The treasure has been divided...</p>
      </div>
      <Scorecard />
      <div className="PostGame-footer">
        <a href="/" className="PostGame-button">
          Return to Port
        </a>
      </div>
    </div>
  );
}
