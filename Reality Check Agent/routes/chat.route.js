import express from "express";
import ChatController from "../controllers/chat.controller.js";

const router = express.Router();

// Start new chat session
router.post("/session", ChatController.createSession);

// Send new chat message
router.post("/send", ChatController.sendMessage);

// Get chat history for a session
router.get("/history/:chatId", ChatController.getChatHistory);

// Search chats (chatId, userName, platformId)
router.get("/search", ChatController.searchChats);

export default router;
