import { EntitySchema } from "typeorm";

export default new EntitySchema({
  name: "Department",
  tableName: "DEPARTMENTS",

  columns: {
    departmentId: {
      name: "department_id",
      type: "int",
      unsigned: true,
      primary: true,
      generated: "increment",
    },

    departmentName: {
      name: "department_name",
      type: "varchar",
      length: 200,
    },

    departmentCode: {
      name: "department_code",
      type: "varchar",
      length: 50,
    },

    headLecturerId: {
      name: "head_lecturer_id",
      type: "int",
      unsigned: true,
      nullable: true,
    },

    createdAt: {
      name: "created_at",
      type: "datetime",
      createDate: true,
    },
  },
});
