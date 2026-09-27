import { EntitySchema } from "typeorm";

export const ManStaff = new EntitySchema({
  name: "ManStaff",
  tableName: "man_staff",
  columns: {
    staffNumber: {
      name: "staff_num",
      type: "varchar",
      length: 50,
      primary: true,
    },
    position: {
      type: "varchar",
      length: 100,
    },
    userId: {
      name: "user_id",
      type: "int",
      unique: true,
    },
    officeNumber: {
      name: "office_no",
      type: "varchar",
      length: 50,
    },
  },
  relations: {
    user: {
      type: "one-to-one",
      target: "User",
      joinColumn: {
        name: "user_id",
        referencedColumnName: "id",
      },
      onDelete: "CASCADE",
    },
  },
});
