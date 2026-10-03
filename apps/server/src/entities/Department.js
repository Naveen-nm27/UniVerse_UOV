import { EntitySchema } from "typeorm";
export default new EntitySchema({
  name: "Department", tableName: "DEPARTMENTS",
  columns: {
    departmentId: { name: "department_id", type: "int", unsigned: true, primary: true, generated: "increment" },
    departmentName: { name: "department_name", type: "varchar", length: 100 },
  },
});
