import "./AwaitingBids.scss";

export const AwaitingBids: React.FunctionComponent<{ bid: number }> = function ({
  bid,
}) {
  return (
    <div className="AwaitingBids">
      <div className="AwaitingBids-spinner" />
      <p className="AwaitingBids-text">Awaiting other bids...</p>
      <div className="AwaitingBids-bid">
        <span className="AwaitingBids-bidLabel">Your bid:</span>
        <span className="AwaitingBids-bidValue">{bid}</span>
      </div>
    </div>
  );
};
