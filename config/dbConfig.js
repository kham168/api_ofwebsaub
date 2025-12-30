import dotevn from "dotenv";
dotevn.config();
import { logEvents } from "../middleware/logEvent.js";
import pkg from "pg";
const { Pool } = pkg;

const dbPool = new Pool({
  host: String(process.env.DBHOST),
  database: String(process.env.DBNAME),
  user: String(process.env.DBUSER),
  password: String(process.env.DBPWD),
  port: Number(process.env.DBPORT),
  connectionTimeoutMillis: 90000,
  idleTimeoutMillis: 30000,
  max: 100,
  allowExitOnIdle: true,
});


export const dbExecution = async (query, params = []) => {
  const client = await dbPool.connect();

  try {
    // Validate query
    if (typeof query !== "string" || query.trim() === "") {
      throw new Error("Invalid query");
    }

    // Execute query
    const result = await client.query(query, params);
    return result;

  } catch (error) {
    // Don't log duplicate key errors (23505) — they are normal
    if (error.code !== "23505") {
      console.error("Unexpected database error:", error.message);
    }

    // Always throw error to controller
    throw error;

  } finally {
    client.release();
  }
};
