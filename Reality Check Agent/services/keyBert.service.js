import confiuration from '../config/index.js';


const hf_client = confiuration.hf_client;
export async function extractKeywords(text, minScore = 0.5) {
  const result = await hf_client.tokenClassification({
    model: "ml6team/keyphrase-extraction-distilbert-inspec",
    inputs: text,
    provider: "hf-inference"
  });

  const keywords = result
    .filter(obj => obj.score >= minScore)
    .map(obj => obj.word.trim().toLowerCase())
    .filter((word, idx, arr) => word && arr.indexOf(word) === idx);

    console.log("Extracted keywords:", keywords);

  return keywords;

}

export default extractKeywords;
