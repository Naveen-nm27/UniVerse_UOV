import { EntitySchema } from "typeorm";
export default new EntitySchema({
  name: "Dean",
  tableName: "DEANS",
  columns: {
    userId: {
      name: "user_id",
      type: "int",
      unsigned: true,
      primary: true,
    },
    departmentId: {
      name: "department_id",
      type: "int",
      unsigned: true,
    },
    appointedAt: {
      name: "appointed_at",
      type: "date",
    },
  },
});
