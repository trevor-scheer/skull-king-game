import { ApolloClient, HttpLink, InMemoryCache } from "@apollo/client";

// const httpLink = new HttpLink({
//   uri: "https://skull-king-graphql.herokuapp.com/"
// });

const devLink = new HttpLink({
  uri: "http://localhost:4000/"
});

export const client = new ApolloClient({
  link: devLink,
  cache: new InMemoryCache({
    typePolicies: {
      PlayedCard: {
        keyFields: ["card", ["id"]],
      },
      Player: {
        fields: {
          hand: {
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
