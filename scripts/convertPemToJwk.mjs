import fs from "fs";
import path from "path";
import rsaPemToJwk from "rsa-pem-to-jwk";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const privateKey = fs.readFileSync(
  path.resolve(__dirname, "../certs/private.pem"),
);
const jwk = rsaPemToJwk(privateKey, { use: "sig" }, "public");

console.log(JSON.stringify(jwk));
