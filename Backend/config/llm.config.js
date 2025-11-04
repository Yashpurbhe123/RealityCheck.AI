const {GoogleGenerativeAI} = require('@google/generative-ai');

let llm = null;

try {
    if (process.env.GEMINI_API_KEY) {
        const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        llm = genai.getGenerativeModel({ model: "gemini-2.5-flash" });
        console.log('✅ LLM model initialized successfully');
    } else {
        console.warn('⚠️  GEMINI_API_KEY not found. Verification features will not work.');
        console.warn('   Please set GEMINI_API_KEY in your .env file');
    }
} catch (error) {
    console.error('❌ Failed to initialize LLM model:', error.message);
}

module.exports = llm;