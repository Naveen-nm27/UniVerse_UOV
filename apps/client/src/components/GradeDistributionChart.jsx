import { useLayoutEffect, useRef, useState } from "react";
import DashboardChart from "./charts/DashboardChart";
import { gradeSeries } from "./charts/chart-data";
import "./GradeDistributionChart.css";

export default function GradeDistributionChart({ rows = [], loading = false }) {
  const [selectedId, setSelectedId] = useState(null);
  const selected = rows.find((row) => row.moduleId === selectedId);
  if (!rows.length) {
    return (
      <p className="student-chart-empty" role="status">
        {loading ? "Loading subjects…" : "No enrolled subjects are available for this semester."}
      </p>
    );
  }
  return (
    <div className="student-subject-list">
      {rows.map((subject) => (
        <article className="student-subject-result" key={subject.moduleId}>
          <div className="student-subject-result-header">
            <div>
              <span className="student-subject-code">{subject.moduleCode}</span>
              <h3>{subject.moduleTitle}</h3>
              <p>
                {subject.semesterLabel} · Attempt {subject.attemptNumber}
              </p>
            </div>
            <div className="student-subject-final">
              <span>Your result</span>
              <strong>{subject.finalGrade ?? "Awaiting release"}</strong>
            </div>
          </div>
          {subject.requiresResit === true && (
            <p className="student-resit-notice" role="status">
              Resit required — your latest released grade ({subject.resitGrade}) does not meet the
              passing requirement.
            </p>
          )}
          <dl className="student-subject-icas">
            {subject.assessments.map((assessment) => (
              <div key={assessment.number}>
                <dt title={assessment.title}>ICA {assessment.number}</dt>
                <dd className={assessment.grade != null ? "is-released" : ""}>
                  {assessment.grade ?? assessment.status}
                </dd>
              </div>
            ))}
          </dl>
          {subject.attemptHistory?.length > 1 && (
            <section
              className="student-subject-history"
              aria-label={`${subject.moduleCode} repeat attempts`}
            >
              <h4>Repeat attempts</h4>
              <p>
                Other attempts across all semesters. The result above follows your semester
                selection.
              </p>
              {subject.attemptHistory
                .filter((attempt) => attempt.enrollmentId !== subject.enrollmentId)
                .map((attempt) => (
                  <article className="student-subject-attempt" key={attempt.enrollmentId}>
                    <h5>
                      Attempt {attempt.attemptNumber} · {attempt.semesterLabel}
                    </h5>
                    <p>
                      Result: <strong>{attempt.finalGrade ?? "Awaiting release"}</strong>
                    </p>
                    <dl className="student-subject-icas">
                      {attempt.assessments.map((assessment) => (
                        <div key={assessment.number}>
                          <dt>ICA {assessment.number}</dt>
                          <dd>{assessment.grade ?? assessment.status}</dd>
                        </div>
                      ))}
                    </dl>
                  </article>
                ))}
            </section>
          )}
          <div className="student-subject-result-footer">
            <small>{subject.studentCount} students with published batch results</small>
            <button
              type="button"
              onClick={() => setSelectedId(subject.moduleId)}
              aria-haspopup="dialog"
              aria-label={`View graph for ${subject.moduleCode}`}
            >
              View graph
            </button>
          </div>
        </article>
      ))}
      {selected && <SubjectGraph subject={selected} onClose={() => setSelectedId(null)} />}
    </div>
  );
}

function SubjectGraph({ subject, onClose }) {
  const dialog = useRef(null);
  useLayoutEffect(() => {
    const element = dialog.current;
    const previousOverflow = document.body.style.overflow;
    element.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      element.close();
      document.body.style.overflow = previousOverflow;
    };
  }, []);
  return (
    <dialog
      ref={dialog}
      className="student-subject-dialog"
      aria-labelledby="subject-graph-title"
      onCancel={onClose}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          onClose();
        }
      }}
    >
      <div className="student-subject-dialog-header">
        <div>
          <span className="student-subject-code">Batch performance</span>
          <h2 id="subject-graph-title">
            {subject.moduleCode} · {subject.moduleTitle}
          </h2>
        </div>
        <button type="button" onClick={onClose} aria-label="Close graph">
          Close
        </button>
      </div>
      <DashboardChart
        title="Published grade distribution"
        description="Latest published attempt counted once per student in your batch, within the selected semesters."
        {...gradeSeries(subject.gradeCounts)}
        axisLabel="Students"
        height={320}
        emptyMessage="No published batch grades are available for this subject yet."
      />
    </dialog>
  );
}
