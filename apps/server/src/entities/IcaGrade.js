import { EntitySchema } from "typeorm";

export default new EntitySchema({
  name: "IcaGrade",
  tableName: "ICA_GRADES",

  columns: {
    icaGradeId: {
      name: "ica_grade_id",
      type: "int",
      unsigned: true,
      primary: true,
      generated: "increment"
    },

    icaId: {
      name: "ica_id",
      type: "int",
      unsigned: true
    },

    enrollmentId: {
      name: "enrollment_id",
      type: "int",
      unsigned: true
    },

    grade: {
      type: "varchar",
      length: 2
    },

    enteredBy: {
      name: "entered_by",
      type: "int",
      unsigned: true
    },

    
    enteredAt: {
      name: "entered_at",
      type: "datetime",
      createDate: true
    },

    updatedAt: {
      name: "updated_at",
      type: "datetime",
      updateDate: true
    }
  }
});