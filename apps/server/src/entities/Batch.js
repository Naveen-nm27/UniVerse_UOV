import { EntitySchema } from "typeorm";

export default new EntitySchema({
  name: "Batch",
  tableName: "BATCHES",

  columns: {
    batchId: {
      name: "batch_id",
      type: "int",
      unsigned: true,
      primary: true,
      generated: "increment"
    },

    batchName: {
      name: "batch_name",
      type: "varchar",
      length: 100
    },

    startDate: {
      name: "start_date",
      type: "date"
    }
  }
});
