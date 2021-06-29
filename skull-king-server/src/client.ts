import { createClient } from "graphql-ws";
import WebSocket from "ws";

const client = createClient({
  url: "ws://localhost:4001",
  webSocketImpl: WebSocket,
});

// subscription
(async () => {
  const onNext = (incoming: any) => {
    if (incoming.errors) {
      console.log(JSON.stringify(incoming.errors));
    }
    console.log(incoming);
  };

  let unsubscribe = () => {
    /* complete the subscription */
  };

  await new Promise((resolve: any, reject) => {
    unsubscribe = client.subscribe(
      {
        query: `#graphql
          subscription State {
            state(id: 0) {
              phase
              players {
                name
                # hand {
                #   ... on SpecialCard {
                #     type
                #     selection
                #   }
                #   ... on ColoredCard {
                #     color
                #     number
                #   }
                # }
              }
              currentRound {
                roundNumber
              }
            }
          }
        `,
      },
      {
        next: onNext,
        error: reject,
        complete: resolve,
      }
    );
  }).catch((e) => {
    console.log(e);
    // throw e;
  });

  await new Promise(() => {});
})();
