const post = (sequelize, DataTypes) => {
  const Post = sequelize.define("post", {
    text: {
      type: DataTypes.STRING,
      validate: { notEmpty: true }
    }
  });

  Post.associate = models => {
    Post.belongsTo(models.User);
  };

  return Post;
};

export default post;
