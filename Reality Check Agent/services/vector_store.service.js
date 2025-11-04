import configuration from '../config/index.js';
import articleStoreService from './articleStore.service.js';
import sequelizeClient from '../config/database.config.js';
import dotenv from 'dotenv';

dotenv.config();

class VectorStoreService {

    vectorStoreClient = configuration.database_client;

    async retrieveSimilarArticles(queryEmbeddings, filtered_articles, topN=10) {
        try {
            // Convert JS arrays into PostgreSQL array literals
            const queryEmbeddingLiteral = queryEmbeddings
                .map(vec => `'[${vec.join(", ")}]'::vector`)
                .join(", ");

            console.log(filtered_articles);
            const filteredArticlesLiteral = filtered_articles.join(", ");

            console.log("Query Embeddings Literal:", queryEmbeddingLiteral);
            console.log("Filtered Articles Literal:", filteredArticlesLiteral);

            const sql = `
                        SELECT * FROM find_similar_articles_multi(
                            ${queryEmbeddings.length > 0 
                            ? `ARRAY[${queryEmbeddingLiteral}]::vector[]` 
                            : `ARRAY[]::vector[]`},
                            ${filtered_articles.length > 0 
                            ? `ARRAY[${filteredArticlesLiteral}]::bigint[]` 
                            : `ARRAY[]::bigint[]`},
                            ${topN}
                        );
                        `;

            const [results] = await sequelizeClient.query(sql);
            console.log("Retrieved similar articles from vector store:", results);

            const reference_articles = await articleStoreService.getArticlesByIds(results)
            return reference_articles;
        }
        catch (error) {
            console.error("Error retrieving similar articles from vector store:", error);
            return { error: error.message };
        }
    }
}

export default new VectorStoreService();