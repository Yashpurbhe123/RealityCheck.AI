import { DataTypes } from "sequelize";
import sequelize from "../config/database.config.js";
import Article from "./articles.entity.js";

const ArticleImage = sequelize.define("ArticleImage", {
  image_id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  article_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: {
      model: "articles",
      key: "article_id",
    },
  },
  image_url: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
}, {
  tableName: "article_images",
  timestamps: false,
});

export default ArticleImage;
