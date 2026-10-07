import { AppDataSource } from "../data-source.js";

export async function getOfferingAssessments(userId, offeringId) {
  const rows = await AppDataSource.query(
    `
      SELECT mi.ica_id AS assessmentId,
             mi.offering_id AS offeringId,
             mi.ica_number AS icaNumber,
             mi.title,
             ig.grade,
             ig.entered_at AS released,
             m.module_code AS moduleCode
      FROM MODULE_ICAS mi
      JOIN MODULE_OFFERINGS mo ON mo.offering_id = mi.offering_id
      LEFT JOIN ICA_GRADES ig ON ig.ica_id = mi.ica_id
      LEFT JOIN MODULES m ON m.module_id = mo.module_id
      WHERE mo.lecturer_id = ? AND mi.offering_id = ?
      ORDER BY mi.ica_number ASC
    `,
    [userId, offeringId]
  );

  return rows.map((row) => ({
    assessmentId: Number(row.assessmentId),
    offeringId: Number(row.offeringId),
    offeringCode: row.moduleCode,
    title: row.title || `ICA ${row.icaNumber}`,
    type: "ICA",
    released: row.released,
    grade: row.grade,
    comment: null,
  }));
}
