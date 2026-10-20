import DashboardChart from "./DashboardChart";
import { statusSeries } from "./chart-data";

export function ResultStatusChart({ rows = [], queue = false, scope = "your authorised scope" }) {
  return (
    <DashboardChart
      title={queue ? "Results awaiting action" : "Result status distribution"}
      description={
        queue
          ? "Unpublished result records grouped by their current workflow status."
          : `Result records in ${scope}, grouped by their current workflow status.`
      }
      type="doughnut"
      {...statusSeries(rows, !queue)}
      emptyMessage={
        queue ? "No results are awaiting action." : "No result records are available in this scope."
      }
    />
  );
}

export function StudentGpaChart({ rows = [] }) {
  return (
    <DashboardChart
      title="GPA by semester"
      description="Published results for the selected semesters. Unavailable GPA values remain gaps."
      type="line"
      labels={rows.map((row) => row.label)}
      datasets={[{ label: "GPA", data: rows.map((row) => row.value) }]}
      axisLabel="GPA"
      precision={2}
      max={4}
      emptyMessage="GPA is unavailable until published results and the required academic policies are available."
    />
  );
}

export function LecturerOverviewCharts({ data }) {
  const enrollment = data.offeringEnrollment || [];
  const sessions = data.sessionTrend || [];
  return (
    <div className="dashboard-charts-grid">
      <DashboardChart
        title="Registered students by offering"
        description="Distinct students with a current, registered enrollment in each assigned offering. The semester filter applies."
        labels={enrollment.map(
          (row) => `${row.moduleCode} · ${row.semesterLabel} · #${row.offeringId}`,
        )}
        datasets={[
          { label: "Registered students", data: enrollment.map((row) => row.studentCount) },
        ]}
        horizontal
        height={Math.max(260, enrollment.length * 46)}
        axisLabel="Students"
        emptyMessage={
          data.offeringEnrollment == null
            ? "Offering enrollment data is not available yet."
            : "No offerings are assigned in this semester."
        }
      />
      <DashboardChart
        title="Lecture sessions in the last 7 days"
        description="Recorded lecture sessions for the selected offerings, using Asia/Colombo dates."
        type="line"
        labels={sessions.map((row) => row.date)}
        datasets={[{ label: "Lecture sessions", data: sessions.map((row) => row.count) }]}
        axisLabel="Sessions"
        emptyMessage="Session activity is unavailable."
      />
    </div>
  );
}
