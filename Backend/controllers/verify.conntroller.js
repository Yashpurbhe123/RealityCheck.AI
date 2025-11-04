// import { pipeline } from '@xenova/transformers';
const { raw } = require('express');
const model = require('../config/llm.config.js');
const dotenv = require('dotenv');
dotenv.config();


async function get_context(content, imageUrl) {
    // Check if model is available (API key is set)
    if (!model) {
        return {'error': 'LLM model not available. Please check GEMINI_API_KEY configuration.'};
    }

    let prompt = `You are a context generating expert. You are expected to find out the context of the tweet given below.`;
    
    if (imageUrl) {
        prompt += `\nThis tweet also includes an image. Please analyze both the text content and the image URL provided.`;
        prompt += `\nImage URL: ${imageUrl}`;
    }
    
    prompt += `\nRespond in JSON with fields: context (concise and all-inclusive)`;
    
    if (content) {
        prompt += `\n\nTweet Content : ${content}`;
    }

    try
    {
        const raw_output = (await model.generateContent(prompt)).response.text();
        const json_response_string = raw_output.replace(/```json/g,"").replace(/```/g,"").trim();
        const json_response_object = JSON.parse(json_response_string);
        console.log(json_response_object);

        return json_response_object.context;
    }
    catch(err){
        console.error('Error in get_context:', err);
        return {'error': err.message || 'Failed to generate context'};
    }

}

async function verify_tweet(tweet_content, imageUrl) {
    // Check if model is available (API key is set)
    if (!model) {
        return {'error': 'LLM model not available. Please check GEMINI_API_KEY configuration.'};
    }

    const tweet_context = await get_context(tweet_content, imageUrl);
    
    // Check if get_context returned an error
    if (tweet_context && typeof tweet_context === 'object' && 'error' in tweet_context) {
        return tweet_context;
    }
    
    let prompt = `You are a fact-checking expert. Given a tweet context, assess whether it likely contains real information or misinformation.`;
    
    if (imageUrl) {
        prompt += `\nThis tweet includes an image. Consider the image content in your fact-checking assessment.`;
        prompt += `\nImage URL: ${imageUrl}`;
    }
    
    prompt += `\nRespond in JSON with fields: verdict, confidence (0-1), reason (accurate), awareness factor (why such a tweet may be fake).`;
    prompt += `\n\nTweet Context : ${tweet_context}`;

    try {
        const raw_output = (await model.generateContent(prompt)).response.text();
        const json_response_string = raw_output.replace(/```json/g,"").replace(/```/g,"").trim();
        const json_response_object = JSON.parse(json_response_string);
        console.log(json_response_object);

        return json_response_object;
    }
    catch (error) {
        console.error('Error in verify_tweet:', error);
        return {'error': error.message || 'Failed to verify tweet'};
    }

}

module.exports = verify_tweet;