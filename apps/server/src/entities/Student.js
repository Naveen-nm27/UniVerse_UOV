import { EntitySchema } from "typeorm";

export default new EntitySchema({
  name: "Student",
  tableName: "STUDENTS",

  columns: {
    userId: {
      name: "user_id",
      type: "int",
      unsigned: true,
      primary: true
    },

    registrationNumber: {
      name: "registration_number",
      type: "varchar",
      length: 50,
      unique: true
    },

    batchId: {
      name: "batch_id",
      type: "int",
      unsigned: true
    },

    currentSemester: {
      name: "current_semester",
      type: "tinyint",
      unsigned: true,
      nullable: true
    }
  }
});
