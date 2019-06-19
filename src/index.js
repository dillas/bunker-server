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
            ru: "Новость №1",
            en: "News №1"
          },
          createdAt: date.setSeconds(date.getSeconds() + 1)
        },
        {
          text: {
            ru: "Новость №2",
            en: "News №2"
          },
          createdAt: date.setSeconds(date.getSeconds() + 1)
        },
        {
          text: {
            ru: "Новость №3",
            en: "News №3"
          },
          createdAt: date.setSeconds(date.getSeconds() + 1)
        },
        {
          text: {
            ru: "Новость №4",
            en: "News №4"
          },
          createdAt: date.setSeconds(date.getSeconds() + 1)
        },
        {
          text: {
            ru: "Новость №5",
            en: "News №5"
          },
          createdAt: date.setSeconds(date.getSeconds() + 1)
        }
      ],
      messages: [
        {
          text: "Сообщение №1",
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
            ru: "Новость №6",
            en: "News №6"
          },
          createdAt: date.setSeconds(date.getSeconds() + 1)
        },
        {
          text: {
            ru: "Новость №7",
            en: "News №7"
          },
          createdAt: date.setSeconds(date.getSeconds() + 1)
        },
        {
          text: {
            ru: "Новость №8",
            en: "News №8"
          },
          createdAt: date.setSeconds(date.getSeconds() + 1)
        }
      ],
      messages: [
        {
          text: "Сообщение №2",
          createdAt: date.setSeconds(date.getSeconds() + 1)
        },
        {
          text: "Сообщение №3",
          createdAt: date.setSeconds(date.getSeconds() + 1)
        }
      ]
    },
    {
      include: [models.Message, models.Post]
    }
  );
};
