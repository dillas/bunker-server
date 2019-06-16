import "dotenv/config";
import http from "http";
import cors from "cors";
import morgan from "morgan";
import express from "express";
import jwt from "jsonwebtoken";
import DataLoader from "dataloader";
import { ApolloServer, AuthenticationError } from "apollo-server-express";

import resolvers from "./resolvers";
import schema from "./schema";
import models, { sequelize } from "./models";
import loaders from "./loaders";

const app = express();

app.use(cors());

app.use(morgan("dev"));

const getMe = async req => {
  const token = req.headers["x-token"];

  if (token) {
    try {
      return await jwt.verify(token, process.env.SECRET);
    } catch (e) {
      throw new AuthenticationError("Your session expired. Sign in again.");
    }
  }
};

const server = new ApolloServer({
  introspection: true,
  playground: true,
  typeDefs: schema,
  resolvers,
  formatError: error => {
    // remove the internal sequelize error message
    // leave only the important validation error
    const message = error.message
      .replace("SequelizeValidationError: ", "")
      .replace("Validation error: ", "");

    return {
      ...error,
      message
    };
  },
  context: async ({ req, connection }) => {
    if (connection) {
      return {
        models,
        local: "ru",
        loaders: {
          user: new DataLoader(keys => loaders.user.batchUsers(keys, models))
        }
      };
    }

    if (req) {
      const me = await getMe(req);

      return {
        models,
        local: "ru",
        me,
        secret: process.env.SECRET,
        loaders: {
          user: new DataLoader(keys => loaders.user.batchUsers(keys, models))
        }
      };
    }
  }
});

server.applyMiddleware({ app, path: "/graphql" });

const httpServer = http.createServer(app);
server.installSubscriptionHandlers(httpServer);

const isTest = !!process.env.TEST_DATABASE;
const isProduction = !!process.env.DATABASE_URL;
const port = process.env.PORT || 8000;

sequelize.sync({ force: isTest || isProduction }).then(async () => {
  if (isTest || isProduction) {
    createUsersWithMessages(new Date());
  }

  httpServer.listen({ port }, () => {
    console.log(`Apollo Server on http://localhost:${port}/graphql`);
  });
});

function setDate(date) {
  date.setSeconds(date.getSeconds() + 1);
}

const createUsersWithMessages = async date => {
  await models.User.create(
    {
      username: "dillas",
      email: "hello@robin.com",
      password: "huikt0uznaet",
      role: "ADMIN",
      posts: [
        {
          text: {
            ru: '!!!!POST 1 РУССКИЙ "dillas" Published the Road to learn React',
            en: '!!!!POST 1 "dillas" Published the Road to learn React'
          },
          createdAt: setDate(date)
        },
        {
          text: {
            ru: '!!!!POST 2 РУССКИЙ "dillas" Published the Road to learn React',
            en: '!!!!POST 2 "dillas" Published the Road to learn React'
          },
          createdAt: setDate(date)
        },
        {
          text: {
            ru: '!!!!POST 3 РУССКИЙ "dillas" Published the Road to learn React',
            en: '!!!!POST 3 "dillas" Published the Road to learn React'
          },
          createdAt: setDate(date)
        },
        {
          text: {
            ru: '!!!!POST 4 РУССКИЙ "dillas" Published the Road to learn React',
            en: '!!!!POST 4 "dillas" Published the Road to learn React'
          },
          createdAt: setDate(date)
        },
        {
          text: {
            ru: '!!!!POST 5 РУССКИЙ "dillas" Published the Road to learn React',
            en: '!!!!POST 5 "dillas" Published the Road to learn React'
          },
          createdAt: setDate(date)
        }
      ],
      messages: [
        {
          text: "Published the Road to learn React",
          createdAt: date.setSeconds(date.getSeconds() + 1)
        }
      ]
    },
    {
      include: [models.Message, models.Post]
    }
  );

  await models.User.create(
    {
      username: "jonohn",
      email: "hello@david.com",
      password: "349761",
      posts: [
        {
          text: {
            ru: '!!!!POST 1 РУССКИЙ "jonohn" Published the Road to learn React',
            en: '!!!!POST 1 "jonohn" Published the Road to learn React'
          },
          createdAt: setDate(date)
        },
        {
          text: {
            ru: '!!!!POST 2 РУССКИЙ "jonohn" Published the Road to learn React',
            en: '!!!!POST 2 "jonohn" Published the Road to learn React'
          },
          createdAt: setDate(date)
        },
        {
          text: {
            ru: '!!!!POST 3 РУССКИЙ "jonohn" Published the Road to learn React',
            en: '!!!!POST 3 "jonohn" Published the Road to learn React'
          },
          createdAt: setDate(date)
        }
      ],
      messages: [
        {
          text: "Happy to release ...",
          createdAt: date.setSeconds(date.getSeconds() + 1)
        },
        {
          text: "Published a complete ...",
          createdAt: date.setSeconds(date.getSeconds() + 1)
        }
      ]
    },
    {
      include: [models.Message, models.Post]
    }
  );
};
