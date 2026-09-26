import { EntitySchema } from "typeorm";

export const User = new EntitySchema({
  name: "User",
  tableName: "users",
  columns: {
    id: { type: "int", primary: true, generated: true },
    email: { type: "varchar", unique: true },
    fullName: { type: "varchar" },
    passwordHash: { type: "varchar" },
    role: { type: "varchar", default: "student" },
    studentNumber: { type: "varchar", nullable: true },
    programmeId: { type: "varchar", nullable: true },
    batchId: { type: "varchar", nullable: true },
    createdAt: { type: "timestamp", createDate: true },
    updatedAt: { type: "timestamp", updateDate: true },
  },
});