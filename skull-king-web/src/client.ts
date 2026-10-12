import { ApolloClient, ApolloLink, HttpLink, InMemoryCache } from "@apollo/client";
import type { StoreObject } from "@apollo/client";
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
      GameState: {
        // State includes private fields, so each query's room/token pair owns its snapshot.
        keyFields: false,
        merge: true,
        fields: {
          players: {
            merge(existing: StoreObject[] = [], incoming: StoreObject[], { readField, mergeObjects }) {
              const previous = new Map(existing.map(player => [readField("id", player), player]));
              // Seat summaries omit table stats; incoming seats and order remain authoritative.
              return incoming.map(player => {
                const match = previous.get(readField("id", player));
                return match ? mergeObjects(match, player) : player;
              });
            },
          },
          me: {
            merge(existing, incoming, { readField, mergeObjects }) {
              return existing && incoming && readField("id", existing) === readField("id", incoming)
                ? mergeObjects(existing, incoming)
                : incoming;
            },
          },
          currentRound: {
            merge(existing, incoming, { readField, mergeObjects }) {
              if (!existing || !incoming) return incoming;
              const previousId = readField<number>("id", existing);
              const nextId = readField<number>("id", incoming);
              // Round IDs increase for a room, including tie-breaker rounds.
              if (previousId !== undefined && nextId !== undefined && nextId < previousId) return existing;
              if (previousId === undefined || previousId !== nextId) return incoming;
              const cards = readField<StoreObject[]>("cardsPlayed", incoming);
              if (!cards) return mergeObjects(existing, incoming);
              const previous = new Map(
                (readField<StoreObject[]>("cardsPlayed", existing) ?? [])
                  .map(card => [readField("id", card), card]),
              );
              // Only preserve faces within this round; a later Tigress can choose again.
              return mergeObjects(existing, {
                ...incoming,
                cardsPlayed: cards.map(card => {
                  const match = previous.get(readField("id", card));
                  return match ? mergeObjects(match, card) : card;
                }),
              });
            },
          },
        },
      },
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
