import { ApolloClient, HttpLink, InMemoryCache } from "@apollo/client";

const httpLink = new HttpLink({
  uri:
    process.env.NODE_ENV === "production"
      ? "https://skull-king-graphql.herokuapp.com/"
      : "http://localhost:4000/graphql",
});

export const client = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
});
