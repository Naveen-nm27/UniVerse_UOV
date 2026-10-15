import { AppDataSource } from "../data-source.js";
import { ApiError } from "../utils/api-error.js";
let schemaPromise;
export function getSchema() {
  if (!schemaPromise)
    schemaPromise = AppDataSource.query(
      "SELECT TABLE_NAME AS tableName, COLUMN_NAME AS columnName FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE()",
    )
      .then((rows) => {
        const tables = new Map();
        const exactNames = new Set(rows.map((row) => row.tableName));
        for (const row of rows) {
          const name = row.tableName.toUpperCase();
          if (exactNames.has(name) && row.tableName !== name) continue;
          if (!tables.has(name)) tables.set(name, new Set());
          tables.get(name).add(row.columnName.toLowerCase());
        }
        return tables;
      })
      .catch((error) => {
        schemaPromise = undefined;
        throw error;
      });
  return schemaPromise;
}
export function resetSchemaCache() {
  schemaPromise = undefined;
}
export async function requireTable(name) {
  if (!(await getSchema()).has(name))
    throw new ApiError(
      503,
      "SCHEMA_UNAVAILABLE",
      "This feature requires database setup before it can be used.",
    );
}
