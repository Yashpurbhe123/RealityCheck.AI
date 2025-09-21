import CacheService from "../services/cache.service.js";
import llmService from "../services/llm.service.js";
import embeddingsService from "../services/embeddings.service.js";

async function mountCacheService(req, res, next) {
  try {
    // 0 LLM calls → check content cache
    const cachedResponse = await CacheService.getFromContentCache(req.body.content);

    if (cachedResponse) {
      return res.status(200).json({ response: cachedResponse });
    }

    // 1 LLM call → get context
    const context_json = await llmService.getContext(req.body.content);
    console.log("Post Context :" , context_json.context);
    const embeddings = await embeddingsService.get_embeddings(context_json.context);
    if(embeddings.error){
      return res.status(500).json({ error: "Error generating embeddings", message: embeddings.error });
    }
    const cachedContextResponse = await CacheService.getFromContextCache(embeddings);

    if (cachedContextResponse) {
      return res.status(200).json({ response: cachedContextResponse });
    }

    // If nothing found → continue to route handler
    req.body.context = context_json.context;
    req.body.language = context_json.language;
    req.body.embeddings = embeddings; // Pass context to api logic
    next();

  } catch (err) {
    next(err);
  }
}

export default mountCacheService;
