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

    let image_extracted_text = "N/A";
    let deepfake_analysis_result = "N/A";
    let deepfake_analysis_result_confidence = 0;
    if (req.body.image_url) {
      const imageAnalysisAPIping = "https://googlegenaiexchange-imageprocessingengine-132180526643.us-central1.run.app/";
      const imageAnalysisAPI = "https://googlegenaiexchange-imageprocessingengine-132180526643.us-central1.run.app/analyze/url";

      try {
        const imageResponse = await fetch(imageAnalysisAPIping, {
          method: 'GET',
        });
        if (imageResponse.ok) {
          console.log("Image Analysis API is reachable.");
          const analysisResponse = await fetch(imageAnalysisAPI, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ image_url: req.body.image_url })
          });

          if (analysisResponse && analysisResponse.ok) {
            const analysisData = await analysisResponse.json();
            console.log("Image Analysis Data:", analysisData);
            image_extracted_text = analysisData.extracted_text;
            deepfake_analysis_result = analysisData.verdict;
            deepfake_analysis_result_confidence = analysisData.confidence;
          } else {
            console.error("Failed to analyze image. Status:", analysisResponse.status);
          }
        }
      }
      catch (error) {
        console.error("Error reaching Image Analysis API:", error);
      }
    }

    // 1 LLM call → get context
    const context_json = await llmService.getContext(req.body.content, image_extracted_text, deepfake_analysis_result, deepfake_analysis_result_confidence);
    console.log("Post Context :", context_json.context);
    const embeddings = await embeddingsService.get_embeddings(context_json.context);
    if (embeddings.error) {
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
