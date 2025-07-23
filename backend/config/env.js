import { config } from "dotenv";

config({ path: `.env.${process.env.NODE_ENV || "development"}.local` });

export const { PORT, MONGODB_URI, JWT_SECRET, REDIS_HOST, REDIS_PORT, REDIS_PASSWORD, HF_API_TOKEN, GOOGLE_API_KEY } = process.env;