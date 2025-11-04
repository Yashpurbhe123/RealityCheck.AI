import embeddings_model from "../config/huggingface.config.js";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

class EmbeddingsService {

  async get_embeddings(text) {

    let material = text;

    if (material.length > 150) {

      const text_splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 100,
        chunkOverlap: 50,
      });

      const split_text = await text_splitter.createDocuments([material]);
      material = split_text.map(doc => doc.pageContent); //material is in array form now

    }

    console.log("Material to be embedded:", material);

    try {
      let embeddings = await embeddings_model.featureExtraction({
        model: "google/embeddinggemma-300m",
        inputs: material,
        provider: "hf-inference",
      });

      if (Array.isArray(embeddings) && !embeddings.every(Array.isArray)) {
        embeddings = [embeddings];
      }

      console.log("Embeddings:", embeddings);

      return embeddings;

    } catch (err) {
      console.error("Error generating embeddings:", err);
      return { error: err };
    }

  }

  // meanPool(matrix) {
  //   const dim = matrix[0].length;
  //   const pooled = new Array(dim).fill(0);

  //   for (const row of matrix) {
  //     for (let i = 0; i < dim; i++) {
  //       pooled[i] += row[i];
  //     }
  //   }

  //   for (let i = 0; i < dim; i++) {
  //     pooled[i] /= matrix.length;
  //   }

  //   return pooled;
  // }

  // normalize(vec) {
  //   const norm = Math.sqrt(vec.reduce((sum, val) => sum + val * val, 0));
  //   return vec.map(v => v / norm);
  // }

}

export default new EmbeddingsService();
