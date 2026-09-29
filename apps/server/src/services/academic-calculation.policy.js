export function calculateGpa(results) {

  const eligible =
    results.filter(
      (result) =>
        result.gradePoint !== null &&
        result.credits > 0
    );

  if (!eligible.length) {
    return null;
  }

  let totalPoints = 0;
  let totalCredits = 0;

  for (const result of eligible) {

    totalPoints +=
      Number(result.gradePoint) *
      Number(result.credits);

    totalCredits +=
      Number(result.credits);
  }

  if (totalCredits === 0) {
    return null;
  }

  return Number(
    (totalPoints / totalCredits).toFixed(2)
  );
}