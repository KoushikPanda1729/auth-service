import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const certsDir = path.join(__dirname, "../certs");

if (!fs.existsSync(certsDir)) {
    fs.mkdirSync(certsDir);
}

const { privateKey, publicKey } = crypto.generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: {
        type: "spki",
        format: "pem",
    },
    privateKeyEncoding: {
        type: "pkcs8",
        format: "pem",
    },
});

fs.writeFileSync(path.join(certsDir, "private.pem"), privateKey);
fs.writeFileSync(path.join(certsDir, "public.pem"), publicKey);

console.log("Keys generated successfully in certs/ directory");
