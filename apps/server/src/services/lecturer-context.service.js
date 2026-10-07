import { AppDataSource } from "../data-source.js";
import { getLecturerCapabilities } from "./permissions.service.js";

export async function getLecturerContext(userId) {
  const [row] = await AppDataSource.query(
    `
      SELECT u.user_id AS id,
             u.name AS fullName,
             u.email,
             u.phone,
             u.role_code AS role,
             l.staff_number AS staffNumber,
             l.date_joined AS dateJoined,
             l.is_hod AS isHod,
             d.department_id AS departmentId,
             d.department_code AS departmentCode,
             d.department_name AS departmentName
      FROM USERS u
      LEFT JOIN LECTURERS l ON l.user_id = u.user_id
      LEFT JOIN DEPARTMENTS d ON d.department_id = l.department_id
      WHERE u.user_id = ?
    `,
    [userId]
  );

  if (!row) {
    return null;
  }

  return {
    id: Number(row.id),
    fullName: row.fullName,
    email: row.email,
    phone: row.phone,
    role: row.role,
    staffNumber: row.staffNumber,
    dateJoined: row.dateJoined,
    isHod: Boolean(row.isHod),
    department: row.departmentId
      ? {
          id: Number(row.departmentId),
          code: row.departmentCode,
          name: row.departmentName,
        }
      : null,
    capabilities: getLecturerCapabilities(),
  };
}
