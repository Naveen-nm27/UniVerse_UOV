import { EntitySchema } from "typeorm";

export default new EntitySchema({
  name: "ResultStatusHistory",
  tableName: "RESULT_STATUS_HISTORY",

  columns: {
    historyId: {
      name: "history_id",
      type: "bigint",
      unsigned: true,
      primary: true,
      generated: "increment"
    },

    resultId: {
      name: "result_id",
      type: "int",
      unsigned: true
    },

    fromStatus: {
      name: "from_status",
      type: "varchar",
      length: 30,
      nullable: true
    },

    toStatus: {
      name: "to_status",
      type: "varchar",
      length: 30
    },

    note: {
      type: "varchar",
      length: 500,
      nullable: true
    },

    updatedBy: {
      name: "updated_by",
      type: "int",
      unsigned: true
    },

    changedAt: {
      name: "changed_at",
      type: "datetime",
      createDate: true
    }
  }
});