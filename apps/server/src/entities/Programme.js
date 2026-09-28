import { EntitySchema } from "typeorm";

export default new EntitySchema({
  name: "Programme",
  tableName: "PROGRAMMES",

  columns: {
    programmeId: {
      name: "programme_id",
      type: "int",
      unsigned: true,
      primary: true,
      generated: "increment"
    },

    programmeCode: {
      name: "programme_code",
      type: "varchar",
      length: 20,
      unique: true
    },

    programmeName: {
      name: "programme_name",
      type: "varchar",
      length: 255
    },

    departmentId: {
      name: "department_id",
      type: "int",
      unsigned: true
    },

    durationYears: {
      name: "duration_years",
      type: "tinyint",
      unsigned: true
    }
  }
});