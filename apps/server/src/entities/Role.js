import { EntitySchema } from "typeorm";

export default new EntitySchema({
  name: "Role",
  tableName: "ROLES",

  columns: {
    roleCode: {
      name: "role_code",
      type: "varchar",
      length: 20,
      primary: true
    },

    dashboardPath: {
      name: "dashboard_path",
      type: "varchar",
      length: 100
    }
  }
});