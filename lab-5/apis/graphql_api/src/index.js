const { ApolloServer, gql } = require("apollo-server-express");
const express = require("express");
const cors = require("cors");

const users = [
    { id: 1, name: "João", email: "joao@gmail.com" },
    { id: 2, name: "Maria", email: "maria@gmail.com" },
    { id: 3, name: "Carlos", email: "carlos@gmail.com" },
    { id: 4, name: "Ana", email: "ana@gmail.com" },
];

const typeDefs = gql`
  type User {
    id: ID!
    name: String!
    email: String!
  }

  type Query {
    users: [User]
  }
`;

const resolvers = {
  Query: {
    users: () => users,
  },
};

async function startServer() {
  const app = express();
  app.use(cors());

  const server = new ApolloServer({ typeDefs, resolvers });
  await server.start();
  server.applyMiddleware({ app });

  const PORT = 3001;
  app.listen(PORT, () =>
    console.log(`GraphQL API rodando em http://localhost:${PORT}${server.graphqlPath}`)
  );
}

startServer();