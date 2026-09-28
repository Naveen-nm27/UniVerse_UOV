import { EntitySchema } from "typeorm";

export default new EntitySchema({
  name: "GradeScale",
  tableName: "GRADE_SCALE",

  columns: {
    grade: {
      type: "varchar",
      length: 2,
      primary: true
    },

    gradePoint: {
      name: "grade_point",
      type: "decimal",
      precision: 3,
      scale: 2
    },

    description: {
      type: "varchar",
      length: 100,
      nullable: true
    }
  }
});