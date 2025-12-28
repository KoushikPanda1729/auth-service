import { config } from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Only load .env file if not in Docker (Docker uses --env-file)
// Check if we're in Docker by looking for /.dockerenv or if env vars are already set
const isDocker = fs.existsSync("/.dockerenv");
if (!isDocker) {
    const envPath = fs.existsSync(
        path.join(process.cwd(), `.env.${process.env.NODE_ENV}`)
    )
        ? path.join(process.cwd(), `.env.${process.env.NODE_ENV}`)
        : path.join(__dirname, `../../.env.${process.env.NODE_ENV}`);

    config({ path: envPath });
}

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
    PRIVATE_KEY,
    PUBLIC_KEY,
    ADMIN_EMAIL,
    ADMIN_PASSWORD,
    ADMIN_FIRST_NAME,
    ADMIN_LAST_NAME,
} = process.env;

// Replace literal \n with actual newlines and strip surrounding quotes from PEM keys
const privateKey = (PRIVATE_KEY?.replace(/\\n/g, "\n") || "").replace(
    /^"|"$/g,
    ""
);
const publicKey = (PUBLIC_KEY?.replace(/\\n/g, "\n") || "").replace(
    /^"|"$/g,
    ""
);

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
    PRIVATE_KEY: privateKey,
    PUBLIC_KEY: publicKey,
    ADMIN_EMAIL: ADMIN_EMAIL,
    ADMIN_PASSWORD: ADMIN_PASSWORD,
    ADMIN_FIRST_NAME: ADMIN_FIRST_NAME,
    ADMIN_LAST_NAME: ADMIN_LAST_NAME,
};
