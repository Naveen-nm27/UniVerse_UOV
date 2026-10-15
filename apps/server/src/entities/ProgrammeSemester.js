import { EntitySchema } from "typeorm";
export default new EntitySchema({
  name: "ProgrammeSemester",
  tableName: "PROGRAMME_SEMESTERS",
  columns: {
    programmeSemesterId: {
      name: "programme_semester_id",
      type: "int",
      unsigned: true,
      primary: true,
      generated: "increment",
    },
    programmeId: {
      name: "programme_id",
      type: "int",
      unsigned: true,
    },
    semesterNumber: {
      name: "semester_number",
      type: "tinyint",
      unsigned: true,
    },
    name: {
      name: "name",
      type: "varchar",
      length: 100,
    },
  },
});
