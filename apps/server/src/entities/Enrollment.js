import { EntitySchema } from "typeorm";

export default new EntitySchema({
  name: "Enrollment",
  tableName: "ENROLLMENTS",

  columns: {
    enrollmentId: {
      name: "enrollment_id",
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

    offeringId: {
      name: "offering_id",
      type: "int",
      unsigned: true
    },

    attemptNumber: {
      name: "attempt_number",
      type: "tinyint",
      unsigned: true,
      default: 1
    },

    isCurrent: {
      name: "is_current",
      type: "boolean",
      default: true
    },

    
    status: {
      type: "varchar",
      length: 20,
      default: "registered"
    },

    enrolledAt: {
      name: "enrolled_at",
      type: "datetime",
      createDate: true
    }
  }
});
