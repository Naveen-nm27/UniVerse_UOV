import { AppDataSource as db } from "../data-source.js";
import { ApiError } from "../utils/api-error.js";
import { appendAuditLog } from "./audit.service.js";
export const transitions = Object.freeze({
  ENTERED: ["VALIDATED", "RETURNED"],
  VALIDATED: ["WITH_DEAN_OFFICE", "RETURNED"],
  WITH_DEAN_OFFICE: ["PUBLISHED", "RETURNED"],
  RETURNED: ["ENTERED"],
  PUBLISHED: [],
});
async function validGrade(manager, grade) {
  if (!(await manager.getRepository("GradeScale").existsBy({ grade })))
    throw new ApiError(400, "INVALID_GRADE", "Choose a configured grade.");
}
async function context(manager, enrollmentId, assessmentId, table, key) {
  const [enrollment] = await manager.query(
    "SELECT offering_id AS offeringId FROM ENROLLMENTS WHERE enrollment_id=? FOR UPDATE",
    [enrollmentId],
  );
  const [assessment] = await manager.query(
    `SELECT offering_id AS offeringId FROM ${table} WHERE ${key}=?`,
    [assessmentId],
  );
  if (!enrollment || !assessment || enrollment.offeringId !== assessment.offeringId)
    throw new ApiError(
      400,
      "OFFERING_MISMATCH",
      "The assessment and enrollment must belong to the same offering.",
    );
}
export async function enterFinal(input, actorId) {
  return db.transaction(async (manager) => {
    await context(manager, input.enrollmentId, input.examId, "EXAMS", "exam_id");
    await validGrade(manager, input.examGrade);
    await validGrade(manager, input.finalGrade);
    const [old] = await manager.query(
      "SELECT result_id AS resultId,status,exam_grade AS examGrade,final_grade AS finalGrade FROM FINAL_RESULTS WHERE enrollment_id=? AND exam_id=? FOR UPDATE",
      [input.enrollmentId, input.examId],
    );
    if (old && !["ENTERED", "RETURNED"].includes(old.status))
      throw new ApiError(409, "RESULT_LOCKED", "Only entered or returned results can be edited.");
    let resultId = old?.resultId;
    if (old)
      await manager.query(
        "UPDATE FINAL_RESULTS SET exam_grade=?,final_grade=?,updated_by=? WHERE result_id=?",
        [input.examGrade, input.finalGrade, actorId, resultId],
      );
    else {
      const inserted = await manager.query(
        "INSERT INTO FINAL_RESULTS (enrollment_id,exam_id,exam_grade,final_grade,entered_by,updated_by) VALUES (?,?,?,?,?,?)",
        [input.enrollmentId, input.examId, input.examGrade, input.finalGrade, actorId, actorId],
      );
      resultId = inserted.insertId;
      await manager.query(
        "INSERT INTO RESULT_STATUS_HISTORY (result_id,from_status,to_status,updated_by) VALUES (?,NULL,'ENTERED',?)",
        [resultId, actorId],
      );
    }
    await appendAuditLog(
      manager,
      "FINAL_RESULTS",
      resultId,
      old ? "UPDATE" : "INSERT",
      actorId,
      old || null,
      { examGrade: input.examGrade, finalGrade: input.finalGrade },
    );
    return { resultId, status: old?.status || "ENTERED" };
  });
}
export async function enterIca(input, actorId) {
  return db.transaction(async (manager) => {
    await context(manager, input.enrollmentId, input.icaId, "MODULE_ICAS", "ica_id");
    await validGrade(manager, input.grade);
    const locked = await manager.query(
      "SELECT result_id FROM FINAL_RESULTS WHERE enrollment_id=? AND status NOT IN ('ENTERED','RETURNED') FOR UPDATE",
      [input.enrollmentId],
    );
    if (locked.length)
      throw new ApiError(
        409,
        "RESULT_LOCKED",
        "Assessments cannot be edited after result validation.",
      );
    const [old] = await manager.query(
      "SELECT ica_grade_id AS id,grade FROM ICA_GRADES WHERE enrollment_id=? AND ica_id=? FOR UPDATE",
      [input.enrollmentId, input.icaId],
    );
    let id = old?.id;
    if (old)
      await manager.query("UPDATE ICA_GRADES SET grade=? WHERE ica_grade_id=?", [input.grade, id]);
    else {
      const inserted = await manager.query(
        "INSERT INTO ICA_GRADES (ica_id,enrollment_id,grade,entered_by) VALUES (?,?,?,?)",
        [input.icaId, input.enrollmentId, input.grade, actorId],
      );
      id = inserted.insertId;
    }
    await appendAuditLog(
      manager,
      "ICA_GRADES",
      id,
      old ? "UPDATE" : "INSERT",
      actorId,
      old || null,
      { grade: input.grade },
    );
    return { icaGradeId: id, grade: input.grade };
  });
}
export async function changeStatus(resultId, input, actorId) {
  return db.transaction(async (manager) => {
    const [identity] = await manager.query(
      "SELECT enrollment_id AS enrollmentId FROM FINAL_RESULTS WHERE result_id=?",
      [resultId],
    );
    if (!identity) throw new ApiError(404, "RESULT_NOT_FOUND", "Result not found.");
    // All grade/status writers lock enrollment before result, avoiding opposite lock orders.
    await manager.query("SELECT enrollment_id FROM ENROLLMENTS WHERE enrollment_id=? FOR UPDATE", [
      identity.enrollmentId,
    ]);
    const [row] = await manager.query(
      "SELECT status,exam_id AS examId FROM FINAL_RESULTS WHERE result_id=? FOR UPDATE",
      [resultId],
    );
    if (!row) throw new ApiError(404, "RESULT_NOT_FOUND", "Result not found.");
    await context(manager, identity.enrollmentId, row.examId, "EXAMS", "exam_id");
    if (row.status !== input.fromStatus)
      throw new ApiError(
        409,
        "STALE_RESULT",
        "The result changed. Refresh before recording a status.",
      );
    if (!transitions[row.status]?.includes(input.toStatus))
      throw new ApiError(409, "INVALID_TRANSITION", "This status transition is not allowed.");
    if (input.toStatus === "RETURNED" && !input.note?.trim())
      throw new ApiError(400, "NOTE_REQUIRED", "Provide the reason for returning this result.");
    await manager.query(
      "UPDATE FINAL_RESULTS SET status=?,updated_by=?,published_at=CASE WHEN ?='PUBLISHED' THEN NOW() ELSE NULL END WHERE result_id=?",
      [input.toStatus, actorId, input.toStatus, resultId],
    );
    await manager.query(
      "INSERT INTO RESULT_STATUS_HISTORY (result_id,from_status,to_status,note,updated_by) VALUES (?,?,?,?,?)",
      [resultId, row.status, input.toStatus, input.note || null, actorId],
    );
    await appendAuditLog(
      manager,
      "FINAL_RESULTS",
      resultId,
      "UPDATE",
      actorId,
      { status: row.status },
      { status: input.toStatus },
    );
    return { resultId, status: input.toStatus };
  });
}
