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
    },
    isHod: {
      name: "is_hod",
      type: "boolean",
    },
    staffNumber: {
      name: "staff_number",
      type: "varchar",
      length: 50,
      nullable: true,
    },
    dateJoined: {
      name: "date_joined",
      type: "date",
    },
  },
});
