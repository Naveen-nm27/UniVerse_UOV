import { EntitySchema } from "typeorm";

export default new EntitySchema({
  name: "Exam",
  tableName: "EXAMS",

  columns: {
    examId: {
      name: "exam_id",
      type: "int",
      unsigned: true,
      primary: true,
      generated: "increment"
    },

    offeringId: {
      name: "offering_id",
      type: "int",
      unsigned: true
    },

    examType: {
      name: "exam_type",
      type: "varchar",
      length: 50
    },

    isResit: {
      name: "is_resit",
      type: "boolean",
      default: false
    },

    
    examDate: {
      name: "exam_date",
      type: "date",
      nullable: true
    }
  }
});