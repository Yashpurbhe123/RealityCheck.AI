import { DataTypes } from "sequelize";
import sequelize from "../config/database.config.js";

const Article = sequelize.define("Article", {
  article_id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    allowNull: false,
  },
  article_content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  article_url: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  publication: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
}, {
  tableName: "articles",
  timestamps: false,
});

export default Article;
