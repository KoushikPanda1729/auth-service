import { config } from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

config({ path: path.join(__dirname, `../../.env.${process.env.NODE_ENV}`) });

const {
    PORT,
    NODE_ENV,
    DB_HOST,
    DB_PORT,
    DB_USERNAME,
    DB_PASSWORD,
    DB_NAME,
    FRONTEND_URL,
    JWKS_URI,
    REFRESH_TOKEN_SECRET,
} = process.env;

export const Config = {
    PORT: PORT,
    NODE_ENV: NODE_ENV,
    DB_HOST: DB_HOST,
    DB_PORT: DB_PORT,
    DB_USERNAME: DB_USERNAME,
    DB_PASSWORD: DB_PASSWORD,
    DB_NAME: DB_NAME,
    FRONTEND_URL: FRONTEND_URL,
    JWKS_URI: JWKS_URI,
    REFRESH_TOKEN_SECRET: REFRESH_TOKEN_SECRET || "",
    PRIVATE_KEY: fs.readFileSync(
        path.join(__dirname, "../../certs/private.pem"),
        "utf-8"
    ),
    PUBLIC_KEY: fs.readFileSync(
        path.join(__dirname, "../../certs/public.pem"),
        "utf-8"
    ),
};
