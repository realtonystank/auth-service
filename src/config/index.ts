import { config } from "dotenv";
import path from "node:path";
config({ path: path.resolve(__dirname, `../../.env.${process.env.NODE_ENV}`) });

const {
  PORT,
  NODE_ENV,
  DB_NAME,
  DB_USERNAME,
  DB_PASSWORD,
  DB_HOST,
  DB_PORT,
  REFRESH_TOKEN_SECRET,
} = process.env;

export const Config = {
  PORT,
  NODE_ENV,
  DB_NAME,
  DB_USERNAME,
  DB_PASSWORD,
  DB_HOST,
  DB_PORT,
  REFRESH_TOKEN_SECRET,
};
