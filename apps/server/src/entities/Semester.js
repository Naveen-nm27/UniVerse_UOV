import { EntitySchema } from "typeorm";

export default new EntitySchema({
  name: "Semester",
  tableName: "SEMESTERS",

  columns: {
    semesterId: {
      name: "semester_id",
      type: "int",
      unsigned: true,
      primary: true,
      generated: "increment"
    },

    semesterName: {
      name: "semester_name",
      type: "varchar",
      length: 50
    },

    academicYear: {
      name: "academic_year",
      type: "varchar",
      length: 20
    },

    startDate: {
      name: "start_date",
      type: "date"
    },

    endDate: {
      name: "end_date",
      type: "date"
    }
  }
});
