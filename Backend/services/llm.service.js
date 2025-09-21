import verification_model from "../config/verify_llm.config.js";
import context_extraction_model from "../config/context_llm.config.js";

class LLMService {

    async getContext(text) {
        const prompt = `You are a neutral text analysis engine. Your only function is to explain the literal meaning of a given text. 
  You must not form an opinion, verify facts, or comment on the validity of the content. 
  Your only output should be a direct explanation of the content provided. Also you must detect the prominently used language in the content, and mention the language in your response.
  You must respond only in JSON with strictly the fields: context, language.
    
    Tweet Text(if any) : ${text}`;

        try {
            const raw_output = (await context_extraction_model.generateContent(prompt)).response.text();
            const json_response_string = raw_output
                .replace(/```json/g, "")
                .replace(/```/g, "")
                .trim();

            const json_response_object = JSON.parse(json_response_string);

            return json_response_object;
        }
        catch (err) {
            return { error: err };
        }
    }

    async verifyContext(tweet_context, language, references) {

        const prompt = `You are a meticulous fact-checking expert from a neutral, non-partisan organization. Your goal is to analyze the provided tweet context and assess its likelihood of being real information versus misinformation, based on publicly available knowledge.

                  **Input :**
                  * **Tweet Context:** "${tweet_context}"
                  * **Response Language:** ${language}
                  * **Reference Content:** ${references} 

                  **Instructions:**
                  Using the tweet context and any relevant information from the provided reference content (if not provided, then use your own knowledge base), perform the following steps:

                  **Your Task:**
                  1.  **Analyze the Claims:** Identify the core verifiable claims made in the tweet, with the help of the reference content(if any).
                  2.  **Evaluate the Source:** Assess the author's bio and typical content, if relevant.
                  3.  **Check for Misinformation Tropes:** Look for signs like emotional language, calls to outrage, lack of sources, or use of buzzwords.
                  4.  **Synthesize Findings:** Based on your analysis, generate a JSON object with your assessment. Provide references to your response from the reference content(if any).
                  5. **Back Your Verdict with Evidence:** Ensure your verdict is supported by specific evidence from the reference content(if any) or your knowledge base. Feel free to mention news headlines, reference links, etc.

                  **Output Format:**
                  Respond ONLY with a valid JSON object following this schema.

                  {
                    "verdict": "string", // Must be one of: "Likely Real", "Likely Misinformation", "Misleading", "Lacks Context", "Unverified"
                    "confidence": "float", // A value between 0.0 (low confidence) and 1.0 (high confidence) in your verdict.
                    "reason": "string", // A concise, evidence-based explanation for your verdict. Mention the specific claims checked and what you found.
                    "awareness_factor": "string" // Explain the common misinformation techniques or psychological triggers this tweet uses or could use (e.g., "Appeals to fear," "Creates an 'us vs. them' narrative," "Uses a kernel of truth to sell a larger falsehood," "Lack of verifiable sources").
                  }`;

        try {
            const raw_output = (await verification_model.generateContent(prompt)).response.text();
            const json_response_string = raw_output
                .replace(/```json/g, "")
                .replace(/```/g, "")
                .trim();
            const json_response_object = JSON.parse(json_response_string);

            return json_response_object;
        }
        catch (err) {
            return { error: err };
        }
    }
}

export default new LLMService();