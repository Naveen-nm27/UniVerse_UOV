import { AppDataSource } from "../data-source.js";

function dayLabel(dayOfWeek) {
  const labels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return labels[Number(dayOfWeek)] || "Mon";
}

export async function getLecturerTimetable(userId, semesterId = null) {
  try {
    const rows = await AppDataSource.query(
      `
        SELECT ts.slot_id AS id,
               ts.day_of_week AS dayOfWeek,
               ts.start_time AS startTime,
               ts.end_time AS endTime,
               mo.offering_id AS offeringId,
               m.module_code AS moduleCode,
               m.module_name AS title,
               h.hall_name AS room
        FROM TIMETABLE_SLOTS ts
        JOIN MODULE_OFFERINGS mo ON mo.offering_id = ts.offering_id
        LEFT JOIN MODULES m ON m.module_id = mo.module_id
        LEFT JOIN HALLS h ON h.hall_id = ts.hall_id
        WHERE mo.lecturer_id = ?
          ${semesterId ? "AND mo.semester_id = ?" : ""}
      `,
      semesterId ? [userId, semesterId] : [userId]
    );

    if (rows.length === 0) {
      return [];
    }

    return rows.map((row) => ({
      id: Number(row.id),
      offeringId: Number(row.offeringId),
      moduleCode: row.moduleCode,
      title: row.title,
      day: dayLabel(row.dayOfWeek),
      time: `${row.startTime} - ${row.endTime}`,
      room: row.room,
    }));
  } catch {
    return [];
  }
}
