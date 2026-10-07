import { EntitySchema } from "typeorm";

export default new EntitySchema({
  name: "Lecturer",
  tableName: "LECTURERS",

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
      nullable: true,
    },

    isHod: {
      name: "is_hod",
      type: "boolean",
      default: false,
    },

    staffNumber: {
      name: "staff_number",
      type: "varchar",
      length: 50,
      nullable: true,
      unique: true,
    },

    dateJoined: {
      name: "date_joined",
      type: "datetime",
      nullable: true,
    },
  },
});
