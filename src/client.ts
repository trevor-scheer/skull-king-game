import {
  ApolloClient,
  HttpLink,
  InMemoryCache,
  // split
} from "@apollo/client";
// import { WebSocketLink } from "@apollo/client/link/ws";
// import { getMainDefinition } from "@apollo/client/utilities";

// const wsLink = new WebSocketLink({
//   uri: "ws://localhost:4000/graphql",
//   options: {
//     reconnect: true,
//   },
// });

const httpLink = new HttpLink({
  uri: "http://localhost:4000/graphql",
});

// const splitLink = split(
//   ({ query }) => {
//     const definition = getMainDefinition(query);
//     return (
//       definition.kind === "OperationDefinition" &&
//       definition.operation === "subscription"
//     );
//   },
//   wsLink,
//   httpLink
// );

export const client = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
});
