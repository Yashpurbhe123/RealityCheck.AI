import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const llm = genai.getGenerativeModel({
  model: "gemini-2.5-flash",
});

export default llm;
