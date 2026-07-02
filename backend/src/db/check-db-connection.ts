import { pool } from "./pool.js";

export const checkDbConnection = async (): Promise<void> => {
  await pool.query("SELECT 1;");
};
