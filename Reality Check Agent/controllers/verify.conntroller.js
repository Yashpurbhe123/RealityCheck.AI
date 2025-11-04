import dotenv from "dotenv";
import CacheService from "../services/cache.service.js";
import LLMService from "../services/llm.service.js";
import keyBertExtractor from "../services/keyBert.service.js";
import vectorStoreService from "../services/vector_store.service.js";
import articleStoreService from "../services/articleStore.service.js";

dotenv.config();

async function verify_tweet(tweet_content, tweet_context, tweet_language, embeddings, tweet_date) {

  try {

    const keywords = await keyBertExtractor(tweet_context, 0.5);
    const filtered_articles = await articleStoreService.getArticlesByKeywords(keywords);
    console.log("Filtered articles: ", filtered_articles.length);
    const references = await vectorStoreService.retrieveSimilarArticles(embeddings, filtered_articles) || [];
    console.log("References found: ", references);
    const response = await LLMService.verifyContext(tweet_context, tweet_language, JSON.stringify(references));
    response['context']=tweet_context;
    CacheService.setToContentCache(tweet_content, response);
    CacheService.setToContextCache(embeddings, response);
  
    return response;

  } catch (error) {
    return { error };
  }
}

export default { verify_tweet };
