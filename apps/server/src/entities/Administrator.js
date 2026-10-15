import { EntitySchema } from "typeorm";
export default new EntitySchema({
  name: "Administrator",
  tableName: "ADMINISTRATORS",
  columns: {
    userId: {
      name: "user_id",
      type: "int",
      unsigned: true,
      primary: true,
    },
    adminLevel: {
      name: "admin_level",
      type: "varchar",
      length: 50,
    },
  },
});
