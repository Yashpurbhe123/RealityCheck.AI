import { InferenceClient } from "@huggingface/inference";
import dotenv from "dotenv";

dotenv.config();

const embedding_model = await new InferenceClient(process.env.HUGGING_FACE_TOKEN);

export default embedding_model;