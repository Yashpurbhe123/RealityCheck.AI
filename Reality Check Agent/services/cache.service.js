import cxt_cache_client from "../config/context_response_cache.config.js";
import cnt_cache_client from "../config/content_response_cache.config.js";
import SHA_256 from 'node:crypto';
import * as tf from '@tensorflow/tfjs';

class CacheService {
    async getFromContentCache(key) {
        try {
            const value = await cnt_cache_client.get(
                SHA_256.createHash('sha256').update(key).digest('hex')
            );
            return value ? JSON.parse(value) : null;
        } catch (err) {
            return null;
        }
    }

    async setToContentCache(key, value, expiration = 3600) {
        try {
            await cnt_cache_client.set(
                SHA_256.createHash('sha256').update(key).digest('hex'),
                JSON.stringify(value),
                {
                    EX: expiration,
                    NX: true,
                }
            );
        } catch (err) {
            throw err;
        }
    }

    async getFromContextCache(key) {

        let similar_key;

        try {

            const keys = await cxt_cache_client.keys('*');

            for (const k of keys) {

                const similarity = this.getCosineSimilarity(key, JSON.parse(k));
                console.log("similarity : ", similarity);
                if (similarity >= 0.88) {
                    console.log("Found similar key in context cache with similarity:", similarity);
                    similar_key = k; // Use the similar key found
                    break;
                }
            }

            if (!similar_key) {
                return null; // No similar key found
            }

            const value = await cxt_cache_client.get(similar_key);

            return value ? JSON.parse(value) : null;

        } catch (err) {
            return null;
        }
    }

    async setToContextCache(key, value, expiration = 3600) {
        try {
            await cxt_cache_client.set(
                JSON.stringify(key),
                JSON.stringify(value),
                {
                    EX: expiration,
                    NX: true,
                }
            );

        } catch (err) {
            throw err;
        }
    }

    getCosineSimilarity(vecA, vecB) {

        const tensorA = tf.tensor1d(vecA);
        const tensorB = tf.tensor1d(vecB);

        const dotProduct = tf.dot(tensorA, tensorB);
        const normA = tf.norm(tensorA);
        const normB = tf.norm(tensorB);

        return dotProduct.div(normA.mul(normB)).dataSync()[0];

    }
}

export default new CacheService();
