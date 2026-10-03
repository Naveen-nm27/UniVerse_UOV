import { getPublishedResults } from "./student-results.service.js";
import { getStudentContext } from "./student-context.service.js";
import { completedCredits, getPassingGrades } from "./academic-calculation.policy.js";
export async function getStudentCredits(userId) {
  await getStudentContext(userId);
  const passingGrades = getPassingGrades();
  return { completedCredits: completedCredits(await getPublishedResults(userId), passingGrades),
    requiredCredits: null, policyConfigured: passingGrades.length > 0 };
}
