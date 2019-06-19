const Sequelize = require("sequelize");
import { combineResolvers } from "graphql-resolvers";

import pubsub, { EVENTS } from "../subscription";
import { isAuthenticated, isPostOwner } from "./authorization";

const toCursorHash = string => Buffer.from(string).toString("base64");

const fromCursorHash = string =>
  Buffer.from(string, "base64").toString("ascii");

export default {
  Query: {
    posts: async (parent, { cursor, limit = 3 }, { models }) => {
      const cursorOptions = cursor
        ? {
            where: {
              createdAt: {
                [Sequelize.Op.gt]: fromCursorHash(cursor)
              }
            }
          }
        : {};

      const posts = await models.Post.findAll({
        order: [["createdAt", "ASC"]],
        limit: limit + 1,
        ...cursorOptions
      });

      const hasNextPage = posts.length > limit;
      console.log(posts);
      const edges = hasNextPage ? posts.slice(0, -1) : posts;
      return {
        edges,
        pageInfo: {
          hasNextPage,
          endCursor: toCursorHash(posts[posts.length - 1].createdAt.toString())
        }
      };
    },
    post: async (parent, { id }, { models }) => {
      return await models.Post.findByPk(id);
    }
  },

  Mutation: {
    createPost: combineResolvers(
      isAuthenticated,
      async (parent, { text }, { models, me }) => {
        const post = await models.Post.create({
          text,
          userId: me.id
        });

        pubsub.publish(EVENTS.POST.POST_CREATED, {
          postCreated: { post }
        });

        return post;
      }
    ),

    deletePost: combineResolvers(
      isAuthenticated,
      isPostOwner,
      async (parent, { id }, { models }) => {
        return await models.Post.destroy({ where: { id } });
      }
    )
  },

  Post: {
    user: async (post, args, { loaders }) => {
      return await loaders.user.load(post.userId);
    }
  },

  Subscription: {
    postCreated: {
      subscribe: () => pubsub.asyncIterator(EVENTS.POST.POST_CREATED)
    }
  }
};
