const Sequelize = require("sequelize");
import { combineResolvers } from "graphql-resolvers";

import pubsub, { EVENTS } from "../subscription";
import { isAuthenticated, isPostOwner } from "./authorization";

const toCursorHash = string => Buffer.from(string).toString("base64");

const fromCursorHash = string =>
  Buffer.from(string, "base64").toString("ascii");

export default {
  Query: {
    posts: async (parent, { cursor, limit = 2 }, { models, local }) => {
      const posts = await models.Post.findAll({
        attributes: ["id", ['"text"->"ru"', "text"], "createdAt"]
        // attr: [
        //   '"Office"."id" as "Office.id"',
        //   '"OfficeLocations"."id" AS "OfficeLocation.id"'
        // ],
      });
      console.log(posts);

      const hasNextPage = posts.length > limit;
      const edges = hasNextPage ? posts.slice(0, -1) : posts;
      return {
        edges,
        pageInfo: {
          hasNextPage,
          endCursor: toCursorHash(edges[edges.length - 1].createdAt.toString())
        }
      };
    },

    /*posts: async (parent, { cursor, limit = 2 }, { models, local }) => {
      const cursorOptions = cursor
        ? {
            where: {
              createdAt: {
                [Sequelize.Op.lt]: fromCursorHash(cursor)
              }
            }
          }
        : {};

      const posts = await models.Post.findAll({
        order: [["createdAt", "DESC"]],
        limit: limit + 1,
        ...cursorOptions
      });

      const hasNextPage = posts.length > limit;

      const edges = hasNextPage ? posts.slice(0, -1) : posts;
      console.log(posts);
      return {
        edges,
        pageInfo: {
          hasNextPage,
          endCursor: toCursorHash(edges[edges.length - 1].createdAt.toString())
        }
      };
    },*/
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