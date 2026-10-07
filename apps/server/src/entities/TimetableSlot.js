import { EntitySchema } from "typeorm";

export default new EntitySchema({
  name: "TimetableSlot",
  tableName: "TIMETABLE_SLOTS",

  columns: {
    slotId: {
      name: "slot_id",
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

    hallId: {
      name: "hall_id",
      type: "int",
      unsigned: true,
    },

    dayOfWeek: {
      name: "day_of_week",
      type: "tinyint",
      unsigned: true,
    },

    startTime: {
      name: "start_time",
      type: "time",
    },

    endTime: {
      name: "end_time",
      type: "time",
    },

    effectiveFrom: {
      name: "effective_from",
      type: "datetime",
    },

    effectiveUntil: {
      name: "effective_until",
      type: "datetime",
      nullable: true,
    },

    isActive: {
      name: "is_active",
      type: "boolean",
      default: true,
    },

    updatedBy: {
      name: "updated_by",
      type: "int",
      unsigned: true,
      nullable: true,
    },

    updatedAt: {
      name: "updated_at",
      type: "datetime",
      updateDate: true,
    },
  },
});
