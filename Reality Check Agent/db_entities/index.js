import sequelizeClient from "../config/database.config.js";
import ChatEntityObject from "./chat.entity.js";
import Article from "./articles.entity.js";
import ArticleKeyword from "./article_keywords.entity.js";
import ArticleImage from "./article_images.entity.js";

// Define associations
Article.hasMany(ArticleKeyword, {
  foreignKey: "article_id",
  onDelete: "CASCADE",
});

ArticleKeyword.belongsTo(Article, {
  foreignKey: "article_id",
});

Article.hasMany(ArticleImage, {
  foreignKey: "article_id",
  onDelete: "CASCADE",
});

ArticleImage.belongsTo(Article, {
  foreignKey: "article_id",
});

export { Article, ArticleKeyword, ArticleImage,  sequelizeClient, ChatEntityObject};
