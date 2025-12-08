import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { decrypt } from "../utils/crypto.js";
import moment from "moment";
import { loggingWarning } from "../utils/console.log.js";
import response from "../utils/responseHandler.js";
import { generateAccessToken } from "../utils/jwt.js";

dotenv.config();

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PUBLIC_KEY = (() => {
  try {
    const keyPath = path.join(__dirname, "..", "key", "public.key");
    return fs.readFileSync(keyPath, "utf8").trim();
  } catch (error) {
    console.error("❌ Failed to load public.key:", error);
    process.exit(1);
  }
})();

/**
 * Verify JWT token from Authorization header
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const verifyJWT = (req, res, next) => {
  const authHeader = req.headers?.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    loggingWarning(`Unauthorized => ${JSON.stringify(req.headers)}`);
    return response.unauthorized(res);
  }

  const token = String(authHeader || "").split(" ")[1];
  const decryptedToken = decrypt(token);

  jwt.verify(
    decryptedToken,
    PUBLIC_KEY,
    { algorithms: ["RS256"] },
    (err, decoded) => {
      if (err) {
        if (err.name === "TokenExpiredError") {
          loggingWarning("Token is expired");
          return response.unauthorized(res);
        } else {
          loggingWarning(`${req.headers}\t Forbidden on JWT decode error`);
          return response.forbidden(res);
        }
      }

      req.id = decoded?.id;
      next();
    }
  );
};

/**
 * Refresh access token using refresh token from cookies
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const refreshToken = async (req, res) => {
  const refreshTokenFromCookie = req.cookies?.remember;

  if (!refreshTokenFromCookie) {
    loggingWarning("Refresh token missing");
    return response.forbidden(res);
  }

  try {
    const decryptedToken = decrypt(refreshTokenFromCookie);
    const decoded = jwt.verify(decryptedToken, PUBLIC_KEY);

    const payload = {
      id: decoded.id,
      email: decoded.email,
      mobile: decoded.mobile,
      role: decoded.role,
      firstname: decoded.firstname,
      lastname: decoded.lastname,
      job_title: decoded.job_title,
      point: decoded?.point || 0,
      balance: decoded?.balance || 0,
      village: decoded?.village || null,
      district: decoded?.district || null,
      province: decoded?.province || null,
      tokenDate: moment().format("DD/MM/YYYY HH:mm:ss"),
    };

    const newAccessToken = generateAccessToken(payload);

    return response.success(res, { accessToken: newAccessToken });
  } catch (error) {
    loggingWarning(
      `Refresh token verification failed: ${JSON.stringify(error || {})}`
    );
    return response.forbidden(res);
  }
};
