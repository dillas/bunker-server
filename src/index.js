import http from 'http';
import express from 'express';
import {
    ApolloServer,
    gql
} from 'apollo-server-express';

// const http = require('http');
// const express = require('express');
// const { ApolloServer, gql } = require('apollo-server-express');

// import schema from './schema';
// import resolvers from './resolvers';

const app = express();
const typeDefs = gql`
  type Book {
    title: String
    author: String
  }

  type Query {
    books: [Book]
  }
`;

const resolvers = {
    Query: {
        books: () => books,
    },
};

const server = new ApolloServer({
    introspection: true,
    playground: true,
    typeDefs,
    resolvers
});

server.applyMiddleware({app, path: '/graphql'});

const httpServer = http.createServer(app);
server.installSubscriptionHandlers(httpServer);

const port = process.env.PORT || 8000;

httpServer.listen({port}, () => {
    console.log(`Apollo Server on http://localhost:${port}/graphql`);
});


