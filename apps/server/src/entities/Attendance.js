import { EntitySchema } from "typeorm";

export default new EntitySchema({
  name: "Attendance",
  tableName: "ATTENDANCE",

  columns: {
    attendanceId: {
      name: "attendance_id",
      type: "int",
      unsigned: true,
      primary: true,
      generated: "increment",
    },

    sessionId: {
      name: "session_id",
      type: "int",
      unsigned: true,
    },

    studentId: {
      name: "student_id",
      type: "int",
      unsigned: true,
    },

    deviceId: {
      name: "device_id",
      type: "int",
      unsigned: true,
    },

    scannedAt: {
      name: "scanned_at",
      type: "datetime",
    },

    status: {
      type: "varchar",
      length: 20,
      default: "present",
    },

    recordedVia: {
      name: "recorded_via",
      type: "varchar",
      length: 50,
    },
  },

  uniques: [{ columns: ["sessionId", "studentId"] }],
});
