import ChatService from "../services/chat.service.js";
import chatModel from "../config/context_llm.config.js";

class ChatController {

    /**
     * 🎯 Create a new chat session
     */
    static async createSession(req, res) {
        try {
            const { userName, platformId } = req.body;

            if (!userName || !platformId) {
                return res.status(400).json({ error: "userName and platformId are required" });
            }

            const chatId = await ChatService.createNewChatSession(userName, platformId);

            return res.status(201).json({
                message: "New chat session created",
                chatId,
            });
        } catch (error) {
            console.error("Error creating chat session:", error);
            res.status(500).json({ error: "Internal Server Error" });
        }
    }

    /**
     * 💬 Send a message in an existing chat session
     */
    static async sendMessage(req, res) {
        try {
            const { chatId, userName, platformId, query } = req.body;

            if (!chatId || !userName || !platformId || !query) {
                return res.status(400).json({ error: "chatId, userName, platformId, and query are required" });
            }

            // 🧠 Get previous context for LLM
            const contextMessages = await ChatService.getChatContextForLLM(chatId);

            const prompt = `You are a chat Agent. Reply to the following query based on the given context chats:- 
                            \n Cuurent query : "${query}" \n\n Past chats for context :  ${contextMessages.map(c => `\n\n User: ${c.query} \n\n Agent: ${c.response}`).join('')}
                            \n
                            Reply strictly in json with the format:
                            {
                                "response": "your response here"
                            }

                            Note: Do not use phrases like "based on given content",etc just chat like a normal human
                                  Also if the asked query is not related to the context chats, try to fetch from your own knowledge. If you don't know, just say you don't know, politely.`;

            const raw_output = (await chatModel.generateContent(prompt)).response.text();
            const llmResponse = raw_output.replace(/```json/g,"").replace(/```/g,"").trim();

            // 💾 Save to database
            const chatEntry = await ChatService.saveChatEntry(chatId, userName, query, llmResponse, platformId);
            console.log("Chat entry saved:", chatEntry.toJSON());

            return res.status(201).json({
                response: llmResponse,
            });
        } catch (error) {
            console.error("Error sending message:", error);
            res.status(500).json({ error: "Internal Server Error" });
        }
    }

    /**
     * 📜 Get chat history for a specific chat session
     */
    static async getChatHistory(req, res) {
        try {
            const { chatId } = req.params;

            if (!chatId) {
                return res.status(400).json({ error: "chatId is required" });
            }

            const history = await ChatService.getChatHistory(chatId);

            return res.status(200).json({
                message: "Chat history fetched successfully",
                chatId,
                data: history,
            });
        } catch (error) {
            console.error("Error fetching chat history:", error);
            res.status(500).json({ error: "Internal Server Error" });
        }
    }

    /**
     * 🔍 Search chats dynamically
     */
    static async searchChats(req, res) {
        try {
            const { chatId, userName, platformId } = req.query;

            const chats = await ChatService.searchChats({
                chatId,
                userName,
                platformId,
            });

            return res.status(200).json({
                message: "Search completed successfully",
                data: chats,
            });
        } catch (error) {
            console.error("Error searching chats:", error);
            res.status(500).json({ error: "Internal Server Error" });
        }
    }
}

export default ChatController;
