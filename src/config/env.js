import dotenv from "dotenv";
import path from "path";

dotenv.config({
  path: path.join(process.cwd(), ".env"),
});

export default {
  port: process.env.PORT,
  database_uri: process.env.DATABASE_URI,
  cors_origin: process.env.CORS_ORIGIN,
}