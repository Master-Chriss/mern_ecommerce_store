import Redis from "ioredis"
import dotenv from 'dotenv'
dotenv.config();

export const redis = new Redis(process.env.UPSTASH_REDIS_URL);
// await redis.config("SET", "stop-writes-on-bgsave-error", "no");

// Run the config fix and log connection status
// redis.on("connect", async () => {
//     try {
//         await redis.config("SET", "stop-writes-on-bgsave-error", "no");
//         console.log("Redis connected and BGSAVE error fix applied.");
//     } catch (err) {
//         console.error("Failed to set Redis config:", err);
//     }
// });

// redis.on("error", (err) => {
//     console.error("Redis connection error:", err);
// });