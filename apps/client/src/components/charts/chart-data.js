export const chartColors = ["#6d287e", "#1d807d", "#cc7a22", "#4267b2", "#c14465", "#777386"];

export const resultStatuses = [
  { key: "ENTERED", label: "Entered", color: "#4267b2" },
  { key: "VALIDATED", label: "Validated", color: "#8c51a3" },
  { key: "WITH_DEAN_OFFICE", label: "With Dean office", color: "#cc7a22" },
  { key: "PUBLISHED", label: "Published", color: "#1d807d" },
  { key: "RETURNED", label: "Returned", color: "#c14465" },
];

// A missing GPA must remain a gap, never become a zero.
export function chartNumber(value) {
  if (typeof value !== "number" && typeof value !== "string") return null;
  if (typeof value === "string" && !value.trim()) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export function statusSeries(rows = [], includePublished = true) {
  const statuses = resultStatuses.filter((item) => includePublished || item.key !== "PUBLISHED");
  return {
    labels: statuses.map((item) => item.label),
    datasets: [
      {
        label: "Result records",
        data: statuses.map((item) =>
          rows
            .filter((row) => row.status === item.key)
            .reduce((total, row) => total + Math.max(0, chartNumber(row.count) ?? 0), 0),
        ),
        backgroundColor: statuses.map((item) => item.color),
      },
    ],
  };
}

export function gradeSeries(rows = []) {
  const order = ["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D+", "D", "D-", "E", "F"];
  const totals = new Map();
  for (const row of rows) {
    if (!row.grade) continue;
    const count = Math.max(0, chartNumber(row.count) ?? 0);
    totals.set(row.grade, (totals.get(row.grade) || 0) + count);
  }
  const rank = (grade) => (order.includes(grade) ? order.indexOf(grade) : order.length);
  const labels = [...totals.keys()].sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));
  return {
    labels,
    datasets: [{ label: "Students", data: labels.map((grade) => totals.get(grade)) }],
  };
}
