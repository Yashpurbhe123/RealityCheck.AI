import { InferenceClient } from "@huggingface/inference";
import dotenv from "dotenv";

dotenv.config();

const hf_config = await new InferenceClient(process.env.HF_TOKEN);

export default hf_config;