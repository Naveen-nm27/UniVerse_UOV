import { EntitySchema } from "typeorm";

export const User = new EntitySchema({
  name: "User",
  tableName: "USERS",

  columns: {
    userId: {
      name: "user_id",
      type: "int",
      unsigned: true,
      primary: true,
      generated: "increment",
    },

    name: {
      name: "name",
      type: "varchar",
      length: 255,
    },

    email: {
      name: "email",
      type: "varchar",
      length: 255,
      unique: true,
    },

    passwordHash: {
      name: "password_hash",
      type: "varchar",
      length: 255,
      select: false,
    },

    roleCode: {
      name: "role_code",
      type: "varchar",
      length: 20,
    },

    phone: {
      name: "phone",
      type: "varchar",
      length: 30,
      nullable: true,
    },

    isActive: {
      name: "is_active",
      type: "boolean",
      default: true,
    },

    mustChangePassword: {
      name: "must_change_password",
      type: "boolean",
      default: true,
    },

    createdBy: {
      name: "created_by",
      type: "int",
      unsigned: true,
      nullable: true,
    },

    lastLoginAt: {
      name: "last_login_at",
      type: "datetime",
      nullable: true,
    },

    createdAt: {
      name: "created_at",
      type: "datetime",
      createDate: true,
    },

    updatedAt: {
      name: "updated_at",
      type: "datetime",
      updateDate: true,
    },
  },
});
