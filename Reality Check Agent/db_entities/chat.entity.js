import { Sequelize } from "sequelize";
import sequelizeClient from "../config/database.config.js";

const ChatEntityObject = sequelizeClient.define("Chat", {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    chatId: {
        type: Sequelize.STRING,  // or UUID if you want
        allowNull: false,
    },
    
    platformId: {
        type: Sequelize.INTEGER,
        allowNull: false,
    },
    userName: {
        type: Sequelize.TEXT,
        allowNull: false,
    },
    query: {
        type: Sequelize.TEXT,
        allowNull: false,
    },
    response: {
        type: Sequelize.TEXT,
        allowNull: false,
    },
    timestamp: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
    },
});

export default ChatEntityObject;