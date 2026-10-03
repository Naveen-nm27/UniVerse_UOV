export const dashboardPaths = Object.freeze({
  STUDENT: "/student", MA: "/ma", LECTURER: "/lecturer",
  HOD: "/hod", DEAN: "/dean", ADMIN: "/admin",
});
export function getJwtSecret() {
  if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is not configured");
  return process.env.JWT_SECRET;
}
export function sessionUser(user) {
  return {
    id: user.userId, email: user.email, fullName: user.name,
    role: user.roleCode, roleCode: user.roleCode,
    dashboardPath: dashboardPaths[user.roleCode],
    mustChangePassword: user.mustChangePassword,
  };
}
