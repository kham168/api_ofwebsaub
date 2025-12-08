import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

const rawKey = Buffer.from(process.env.CRYPT_KEY || "", "hex");
const secretKey = crypto.createHash("sha256").update(rawKey).digest();

/**
 * Encrypt text using AES-256-ECB algorithm
 * @param {string} text - The text to encrypt
 * @returns {string} The encrypted text in hex format
 */
export const encrypt = (text) => {
  if (!text || typeof text !== "string") {
    throw new Error("Invalid input for encryption");
  }

  const cipher = crypto.createCipheriv("aes-256-ecb", secretKey, null);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  return encrypted;
};

/**
 * Decrypt text using AES-256-ECB algorithm
 * @param {string} encryptedText - The encrypted text in hex format
 * @returns {string} The decrypted text
 */
export const decrypt = (encryptedText) => {
  if (!encryptedText || typeof encryptedText !== "string") {
    throw new Error("Invalid input for decryption");
  }

  const decipher = crypto.createDecipheriv("aes-256-ecb", secretKey, null);
  let decrypted = decipher.update(encryptedText, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
};
