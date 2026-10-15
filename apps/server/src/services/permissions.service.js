import { AppDataSource } from "../data-source.js";
import { requireTable } from "./schema.service.js";
export async function getEffectivePermissions(userId, role) {
  await requireTable("PERMISSIONS");
  const rows = await AppDataSource.query(
    `SELECT DISTINCT p.permission_name AS permission
    FROM PERMISSIONS p WHERE EXISTS (SELECT 1 FROM ROLE_DEFAULT_PERMISSIONS r
      WHERE r.permission_id=p.permission_id AND r.role=?)
    OR EXISTS (SELECT 1 FROM USER_PERMISSIONS u WHERE u.permission_id=p.permission_id AND u.user_id=?)`,
    [role, userId],
  );
  return rows.map((row) => row.permission);
}
export const getLecturerCapabilities = () => ({
  sessionControl: "terminal",
  viewUnpublishedGrades: false,
  viewResultHistory: true,
});
