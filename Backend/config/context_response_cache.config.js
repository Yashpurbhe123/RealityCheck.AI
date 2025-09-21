import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

const redis_client = createClient(
    {
        url: process.env.CONTEXT_CACHE_URL
    }
);

redis_client.on('error', err => console.log('Content Response Cache Error : ', err));
await redis_client.connect();

export default redis_client;

