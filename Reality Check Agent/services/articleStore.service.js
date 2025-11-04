import { Op } from "sequelize";
import { Article, ArticleKeyword, ArticleImage } from "../db_entities/index.js";

class articleStoreService {
  async getArticlesByKeywords(keywords) {
    try {
      const articles = await Article.findAll({
        include: [
          {
            model: ArticleKeyword,
            where: {
              [Op.or]: keywords.map(k => ({
                keyword: {
                  [Op.iLike]: `%${k}%`, // case-insensitive LIKE
                },
              })),
            },
            attributes: ["keyword"],
          },
          {
            model: ArticleImage,
            attributes: ["image_url"],
            required: false,
          },
        ],
        distinct: true,
      });

      return articles.map(article => ({
        article_id: article.article_id,
      }));

    } catch (error) {
      console.error("Error fetching articles by keywords:", error);
      throw error;
    }

  }

  async getArticlesByIds(article_ids) {

    if (!article_ids || article_ids.length === 0) return [];

    // Extract IDs and preserve order
    const articleIds = results.map(r => r.article_id);

    // Fetch all articles matching the IDs
    const articles = await Article.findAll({
      where: {
        article_id: {
          [Op.in]: articleIds
        }
      }
    });

    // Preserve the order returned by pgvector
    const articleMap = new Map(articles.map(a => [a.article_id, a.toJSON()]));

    const orderedArticles = results
      .map(r => ({
        ...articleMap.get(r.article_id),
        avg_distance: r.avg_distance // include similarity score
      }))
      .filter(a => a); // remove nulls if any missing

    console.log("Ordered Articles:", orderedArticles);

    return orderedArticles;
  }
}

export default new articleStoreService();