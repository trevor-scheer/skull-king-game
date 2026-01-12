export const AwaitingBids: React.FunctionComponent<{ bid: number }> =
  function ({ bid }) {
    return <p>{`Awaiting other bids. Your bid: ${bid}`}</p>;
  };
