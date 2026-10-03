function getStartYear(value) {
  if (!value) return null;

  const year = value instanceof Date
    ? value.getUTCFullYear()
    : Number(String(value).slice(0, 4));

  return Number.isInteger(year) && year > 1900 ? year : null;
}

export function getIntakeAcademicYear(student) {
  const year = getStartYear(student.batchStartDate || student.programmeStartDate);
  return year === null ? null : `${year}/${year + 1}`;
}

export function getStudyPeriod(student, academicYear, semesterName) {
  const intakeYear = getStartYear(student.batchStartDate || student.programmeStartDate);
  const calendarYear = Number(String(academicYear).match(/^(\d{4})\s*\//)?.[1]);
  const semesterNumber = Number(String(semesterName).match(/semester\s*(\d+)/i)?.[1]);
  const studyYear = calendarYear - intakeYear + 1;

  if (!intakeYear || !Number.isInteger(studyYear) || studyYear < 1 ||
      !Number.isInteger(semesterNumber) || semesterNumber < 1) {
    return { label: `${academicYear} - ${semesterName}`, studyYear: null, semesterNumber: null };
  }

  return {
    label: `Y${String(studyYear).padStart(2, "0")}S${String(semesterNumber).padStart(2, "0")}`,
    studyYear,
    semesterNumber,
  };
}

export function getCurrentStudyPeriod(currentSemester) {
  const index = Number(currentSemester);
  if (!Number.isInteger(index) || index < 1) return null;

  const studyYear = Math.ceil(index / 2);
  const semesterNumber = index % 2 || 2;
  return `Y${String(studyYear).padStart(2, "0")}S${String(semesterNumber).padStart(2, "0")}`;
}
