import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const generateJwt = () => {
  // Load private key from file, not hardcoded
  const privateKeyPath = path.join(__dirname, "../key/private.key");
  const privateKey = fs.readFileSync(privateKeyPath, "utf8");

  // Use environment variables for sensitive config
  const appId = process.env.APP_ID || "63baf6ae-bbd6-44db-a176-ad72f729aedf";

  const token = jwt.sign(
    {
      application_id: appId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 60 * 60, // 1 hour
    },
    privateKey,
    { algorithm: "RS256" }
  );

  return token;
};
