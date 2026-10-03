// Calculate in hundredths of grade points, rounding once at the boundary.
export function calculateGpa(results) {
  let points = 0;
  let credits = 0;
  for (const result of results) {
    const credit = Number(result.credits);
    const gradePoint = result.gradePoint == null ? NaN : Number(result.gradePoint);
    if (!Number.isFinite(gradePoint) || !Number.isInteger(credit) || credit <= 0) continue;
    points += Math.round(gradePoint * 100) * credit;
    credits += credit;
  }
  return credits ? Math.round(points / credits) / 100 : null;
}
export function selectGpaAttempts(rows, repeatPolicy = process.env.GPA_REPEAT_POLICY) {
  if (repeatPolicy === "ALL") return rows;
  const modules = new Map();
  let hasRepeats = false;
  for (const row of rows) {
    const key = Number(row.moduleId);
    const previous = modules.get(key);
    if (previous) hasRepeats = true;
    if (!previous || Number(row.attemptNumber) > Number(previous.attemptNumber) ||
      (Number(row.attemptNumber) === Number(previous.attemptNumber) && Number(row.resultId) > Number(previous.resultId)))
      modules.set(key, row);
  }
  if (hasRepeats && repeatPolicy !== "LATEST") return null;
  return [...modules.values()];
}
export function completedCredits(rows, passingGrades) {
  if (!passingGrades.length) return null;
  const passed = new Map();
  for (const row of rows) if (passingGrades.includes(row.finalGrade)) passed.set(Number(row.moduleId), Number(row.credits));
  return [...passed.values()].reduce((total, credits) => total + credits, 0);
}
export function getPassingGrades() {
  return (process.env.PASSING_GRADES || "").split(",").map((grade) => grade.trim()).filter(Boolean);
}
