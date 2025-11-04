import { Op } from "sequelize";
import { v4 as uuidv4 } from "uuid";
import ChatEntityObject from "../db_entities/chat.entity.js";
import sequelizeClient from "../config/database.config.js";

class ChatService {

  async createNewChatSession(userName, platformId) {
    const chatId = uuidv4();
    console.log(`New chat session created: ${chatId} for ${userName}`);
    return chatId;
  }

  async saveChatEntry(chatId, userName, query, response, platformId) {
    try {
      await sequelizeClient.sync();
      console.log("Chat table synced successfully.");

      const chatEntry = await ChatEntityObject.create({
        chatId,
        userName,
        query,
        response,
        platformId,
      });

      console.log(`Chat entry saved successfully for chatId: ${chatId}`);
      return chatEntry;
    } catch (error) {
      console.error("Error saving chat entry:", error);
      throw error;
    }
  }

  async getChatHistory(chatId, limit = 50) {
    try {
      const chats = await ChatEntityObject.findAll({
        where: { chatId },
        attributes: ["query", "response"],
        order: [["timestamp", "DESC"]],
        limit,
      });
      return chats.reverse();
    } catch (error) {
      console.error("Error fetching chat history:", error);
      return [];
    }
  }

  async getChatContextForLLM(chatId) {
    const chats = await this.getChatHistory(chatId, 30);
    console.log(chats.map(c => ({
      query: c.query,
      response: c.response,
    })));
    return chats.map(c => ({
      query: c.query,
      response: c.response,
    }));
  }

  /**
   * 🔍 Search chats dynamically using chatId, userName, and/or platformId
   */
  async searchChats({ chatId = null, userName = null, platformId = null, limit = 100 }) {
    try {
      const whereClause = {};

      if (chatId) whereClause.chatId = chatId;
      if (userName) whereClause.userName = { [Op.iLike]: `%${userName}%` }; // case-insensitive
      if (platformId) whereClause.platformId = platformId;

      const chats = await ChatEntityObject.findAll({
        where: whereClause,
        order: [["timestamp", "DESC"]],
        limit,
      });

      return chats;
    } catch (error) {
      console.error("Error searching chats:", error);
      throw error;
    }
  }
}

export default new ChatService();
