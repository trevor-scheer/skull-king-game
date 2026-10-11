import { ApolloClient, HttpLink, InMemoryCache } from "@apollo/client";

declare const __API_URL__: string | undefined;
export const API_URL = typeof __API_URL__ === "string" && __API_URL__ ? __API_URL__ : "/graphql";
const devLink = new HttpLink({ uri: API_URL, credentials: "include" });

export const client = new ApolloClient({
  link: devLink,
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
