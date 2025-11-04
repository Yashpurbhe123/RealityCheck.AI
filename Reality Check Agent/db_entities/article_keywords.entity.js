import { DataTypes } from "sequelize";
import sequelize from "../config/database.config.js";
import Article from "./articles.entity.js";

const ArticleKeyword = sequelize.define("ArticleKeyword", {
  keyword_id: {
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
  keyword: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
}, {
  tableName: "article_keywords",
  timestamps: false,
});

export default ArticleKeyword;