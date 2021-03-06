import { gql } from "apollo-server-express";

export default gql`
  extend type Query {
    posts(cursor: String, limit: Int): PostConnection!
    post(id: ID!): Post!
  }

  extend type Mutation {
    createPost(text: String!): Post!
    deletePost(id: ID!): Boolean!
  }

  type LanType {
    ru: String!
    en: String!
  }

  type PostConnection {
    edges: [Post!]!
    pageInfo: PageInfo!
  }

  type Post {
    id: ID!
    text: LanType
    createdAt: Date!
    user: User!
  }

  extend type Subscription {
    postCreated: PostCreated!
  }

  type PostCreated {
    post: Post!
  }
`;
