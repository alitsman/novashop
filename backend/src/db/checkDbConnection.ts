import { pool } from "./pool.js";

export async function checkDbConnection(): Promise<void> {
  await pool.query("SELECT 1;");
}
