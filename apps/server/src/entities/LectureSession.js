import { EntitySchema } from "typeorm";

export default new EntitySchema({
  name: "LectureSession",
  tableName: "LECTURE_SESSIONS",

  columns: {
    sessionId: {
      name: "session_id",
      type: "int",
      unsigned: true,
      primary: true,
      generated: "increment",
    },

    offeringId: {
      name: "offering_id",
      type: "int",
      unsigned: true,
    },

    slotId: {
      name: "slot_id",
      type: "int",
      unsigned: true,
      nullable: true,
    },

    hallId: {
      name: "hall_id",
      type: "int",
      unsigned: true,
      nullable: true,
    },

    deviceId: {
      name: "device_id",
      type: "int",
      unsigned: true,
      nullable: true,
    },

    sessionDate: {
      name: "session_date",
      type: "date",
    },

    openedAt: {
      name: "opened_at",
      type: "datetime",
      nullable: true,
    },

    closedAt: {
      name: "closed_at",
      type: "datetime",
      nullable: true,
    },

    openedBy: {
      name: "opened_by",
      type: "int",
      unsigned: true,
      nullable: true,
    },
  },
});
