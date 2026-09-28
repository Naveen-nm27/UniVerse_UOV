import { EntitySchema } from "typeorm";

export default new EntitySchema({
  name: "FinalResult",
  tableName: "FINAL_RESULTS",

  columns: {
    resultId: {
      name: "result_id",
      type: "int",
      unsigned: true,
      primary: true,
      generated: "increment"
    },

    enrollmentId: {
      name: "enrollment_id",
      type: "int",
      unsigned: true
    },

    examId: {
      name: "exam_id",
      type: "int",
      unsigned: true
    },

    examGrade: {
      name: "exam_grade",
      type: "varchar",
      length: 2
    },

    finalGrade: {
      name: "final_grade",
      type: "varchar",
      length: 2
    },

    status: {
      type: "enum",
      enum: [
        "ENTERED",
        "VALIDATED",
        "WITH_DEAN_OFFICE",
        "PUBLISHED",
        "RETURNED"
      ],
      default: "ENTERED"
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

    updatedBy: {
      name: "updated_by",
      type: "int",
      unsigned: true
    },

    updatedAt: {
      name: "updated_at",
      type: "datetime",
      updateDate: true
    },

    publishedAt: {
      name: "published_at",
      type: "datetime",
      nullable: true
    }
  }
});