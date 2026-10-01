import { EntitySchema } from "typeorm";

export const User = new EntitySchema({
  name: "User",
  tableName: "users",

  columns: {
    id: {
      type: Number,
      primary: true,
      generated: true,
    },

    email: {
      type: String,
      unique: true,
    },

    password: {
      type: String,
    },

    firstName: {
      type: String,
    },

    lastName: {
      type: String,
    },

    phone: {
      type: String,
      nullable: true,
    },

    role: {
      type: String,
      default: "student",
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    createdAt: {
      type: "datetime",
      createDate: true,
    },

    updatedAt: {
      type: "datetime",
      updateDate: true,
    },
  },
});