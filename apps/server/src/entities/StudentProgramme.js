import { EntitySchema } from "typeorm";

export default new EntitySchema({
  name: "StudentProgramme",
  tableName: "STUDENT_PROGRAMMES",

  columns: {
    studentProgrammeId: {
      name: "student_programme_id",
      type: "int",
      unsigned: true,
      primary: true,
      generated: "increment"
    },

    studentId: {
      name: "student_id",
      type: "int",
      unsigned: true
    },

    programmeId: {
      name: "programme_id",
      type: "int",
      unsigned: true
    },

    startDate: {
      name: "start_date",
      type: "date"
    },

    expectedEndDate: {
      name: "expected_end_date",
      type: "date",
      nullable: true
    },

    actualEndDate: {
      name: "actual_end_date",
      type: "date",
      nullable: true
    },

    status: {
      type: "varchar",
      length: 20,
      default: "active"
    }
  }
});
