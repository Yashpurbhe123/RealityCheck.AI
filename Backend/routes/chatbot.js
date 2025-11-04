const express = require('express');
const router = express.Router();
const model = require('../config/llm.config');

// General chatbot endpoint
router.post('/', async (req, res) => {
  try {
    const { query } = req.body;
    
    if (!query || typeof query !== 'string' || !query.trim()) {
      return res.status(400).json({ 
        error: 'Query is required and must be a non-empty string' 
      });
    }

    // Check if model is available
    if (!model) {
      return res.status(503).json({ 
        error: 'AI service is temporarily unavailable. Please check GEMINI_API_KEY configuration.',
        response: "I'm sorry, but my AI capabilities are currently unavailable. Please check with the administrator or try again later."
      });
    }

    // Create a prompt for a general global assistant
    const prompt = `You are a helpful and knowledgeable global assistant. Your role is to help users find information about news, current events, general knowledge, and answer questions about anything.

User Query: ${query.trim()}

Please provide a clear, informative, and helpful response. If the query is about news or current events, mention that information may be time-sensitive. If you're unsure about something, be honest about it.

Keep your response concise but comprehensive (aim for 2-4 sentences for simple queries, up to a short paragraph for complex ones). Format your response naturally without using markdown unless necessary for clarity.

Response:`;

    try {
      const result = await model.generateContent(prompt);
      const response = result.response.text();
      
      res.status(200).json({ 
        response: response.trim() || "I apologize, but I couldn't generate a proper response. Please try rephrasing your question."
      });
    } catch (aiError) {
      console.error('AI generation error:', aiError);
      
      // Provide a fallback response if AI generation fails
      res.status(500).json({ 
        error: 'Failed to generate AI response',
        response: "I apologize, but I encountered an error while processing your query. Please try again in a moment, or rephrase your question."
      });
    }
  } catch (error) {
    console.error('Chatbot route error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      response: "I'm sorry, but I encountered an unexpected error. Please try again later."
    });
  }
});

// Tweet-specific chatbot endpoint
router.post('/tweet', async (req, res) => {
  try {
    const { query, tweetContent, verificationResult, tweetId, imageUrl } = req.body;
    
    if (!query || typeof query !== 'string' || !query.trim()) {
      return res.status(400).json({ 
        error: 'Query is required and must be a non-empty string' 
      });
    }

    if (!tweetContent || !verificationResult) {
      return res.status(400).json({ 
        error: 'Tweet content and verification result are required' 
      });
    }

    // Check if model is available
    if (!model) {
      return res.status(503).json({ 
        error: 'AI service is temporarily unavailable',
        response: "I'm sorry, but my AI capabilities are currently unavailable. Please check with the administrator or try again later."
      });
    }

    // Build comprehensive context about the tweet and verification
    const contextInfo = `
Tweet Content: ${tweetContent}
Verification Verdict: ${verificationResult.verdict}
Confidence Level: ${Math.round(verificationResult.confidence * 100)}%
Analysis: ${verificationResult.reason}
${verificationResult.awareness_factor ? `Awareness Factor: ${verificationResult.awareness_factor}` : ''}
${imageUrl ? `Image URL: ${imageUrl}` : ''}
${tweetId ? `Tweet ID: ${tweetId}` : ''}
`;

    // Create a specialized prompt for tweet-specific questions
    const prompt = `You are a specialized assistant that helps users understand tweet verification and fact-checking results. You have access to detailed verification information about a specific tweet.

CONTEXT ABOUT THE VERIFIED TWEET:
${contextInfo}

USER'S QUESTION ABOUT THIS TWEET:
${query.trim()}

Your role is to:
1. Answer questions specifically about this tweet's verification
2. Explain the verdict, confidence level, and analysis in accessible terms
3. Provide context about why this verification matters
4. Help users understand potential misinformation or accuracy concerns
5. Be clear, factual, and helpful without being alarmist

If the question is not directly related to this specific tweet's verification, gently redirect the user or explain that your expertise is focused on this particular verification.

Keep responses concise but informative (2-4 sentences for simple questions, up to a paragraph for complex ones). Use clear, accessible language.

Response:`;

    try {
      const result = await model.generateContent(prompt);
      const response = result.response.text();
      
      res.status(200).json({ 
        response: response.trim() || "I apologize, but I couldn't generate a proper response. Please try rephrasing your question about this tweet's verification."
      });
    } catch (aiError) {
      console.error('AI generation error:', aiError);
      
      res.status(500).json({ 
        error: 'Failed to generate AI response',
        response: "I apologize, but I encountered an error while processing your query. Please try again in a moment, or rephrase your question."
      });
    }
  } catch (error) {
    console.error('Tweet chatbot route error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      response: "I'm sorry, but I encountered an unexpected error. Please try again later."
    });
  }
});

module.exports = router;
