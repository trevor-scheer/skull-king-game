import { ApolloClient, ApolloLink, HttpLink, InMemoryCache } from "@apollo/client";

import { BatchHttpLink } from "@apollo/client/link/batch-http";
import { getMainDefinition } from "@apollo/client/utilities";

declare const __API_URL__: string | undefined;
export const API_URL = typeof __API_URL__ === "string" && __API_URL__ ? __API_URL__ : "/graphql";
const options = { uri: API_URL, credentials: "include" };
const link = ApolloLink.split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return definition.kind === "OperationDefinition" && definition.operation === "query";
  },
  new BatchHttpLink({ ...options, batchMax: 10, batchInterval: 20 }),
  new HttpLink(options),
);

export const client = new ApolloClient({
  link,
  cache: new InMemoryCache({
    typePolicies: {
      PlayedCard: {
        // Played cards are trick snapshots; summary queries omit their card details.
        keyFields: false,
      },
      SpecialCard: { keyFields: false },
      ColoredCard: { keyFields: false },
      Player: {
        keyFields: false,
        fields: {
          hand: {
            merge(_existing, incoming) {
              return incoming;
            },
          },
        },
      },
      Round: {
        keyFields: false,
        fields: {
          cardsPlayed: {
            merge(_existing, incoming) {
              return incoming;
            },
          },
        },
      },
    },
    possibleTypes: {
      Card: ["SpecialCard", "ColoredCard"],
    },
  }),
});
