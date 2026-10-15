import { EntitySchema } from "typeorm";
export default new EntitySchema({
  name: "Hall",
  tableName: "HALLS",
  columns: {
    hallId: {
      name: "hall_id",
      type: "int",
      unsigned: true,
      primary: true,
      generated: "increment",
    },
    hallName: {
      name: "hall_name",
      type: "varchar",
      length: 100,
    },
    capacity: {
      name: "capacity",
      type: "smallint",
      unsigned: true,
      nullable: true,
    },
  },
});
