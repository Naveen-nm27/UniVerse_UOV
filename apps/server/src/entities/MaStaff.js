import { EntitySchema } from "typeorm";
export default new EntitySchema({
  name: "MaStaff",
  tableName: "MA_STAFF",
  columns: {
    userId: {
      name: "user_id",
      type: "int",
      unsigned: true,
      primary: true,
    },
    staffNumber: {
      name: "staff_number",
      type: "varchar",
      length: 50,
      nullable: true,
    },
    officeName: {
      name: "office_name",
      type: "varchar",
      length: 100,
      nullable: true,
    },
  },
});
