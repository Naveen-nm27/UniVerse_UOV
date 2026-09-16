import { EntitySchema } from "typeorm";

export const Course = new EntitySchema({
  name: "Course",
  tableName: "courses",
  columns: {
    id: { type: "int", primary: true, generated: true },
    code: { type: "varchar" },
    title: { type: "varchar" },
    credits: { type: "int" },
    createdAt: { type: "timestamp", createDate: true },
  },
});