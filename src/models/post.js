const Sequelize = require("sequelize");

const post = (sequelize, DataTypes) => {
  const Post = sequelize.define("post", {
    text: {
      type: Sequelize.JSONB,
      validate: { notEmpty: true }
    }
  });

  Post.associate = models => {
    Post.belongsTo(models.User);
  };

  return Post;
};

export default post;
