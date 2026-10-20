import { useState } from "react";
import DashboardChart from "./charts/DashboardChart";
import { gradeSeries } from "./charts/chart-data";

export default function GradeDistributionChart({ rows = [] }) {
  if (!rows.length) {
    return (
      <div className="student-chart-empty">
        Batch grades will appear when published results are available.
      </div>
    );
  }
  return (
    <div className="student-subject-grid">
      {rows.map((subject, index) => (
        <SubjectChart key={subject.moduleCode} subject={subject} initiallyOpen={index === 0} />
      ))}
    </div>
  );
}

function SubjectChart({ subject, initiallyOpen }) {
  const [open, setOpen] = useState(initiallyOpen);
  return (
    <details
      className="student-subject-card"
      open={open}
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary>
        <span className="student-subject-code">{subject.moduleCode}</span>
        <strong>{subject.moduleTitle}</strong>
        <small>
          {subject.studentCount} student{subject.studentCount === 1 ? "" : "s"} with a published
          result
        </small>
        <span className="student-subject-toggle" aria-hidden="true">
          +
        </span>
      </summary>
      {open && (
        <DashboardChart
          title={`${subject.moduleCode}: grade distribution`}
          description="Latest published attempt counted once per student in your batch."
          {...gradeSeries(subject.gradeCounts)}
          axisLabel="Students"
          height={240}
          emptyMessage="No published grades are available for this subject."
        />
      )}
    </details>
  );
}
