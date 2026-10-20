import { useEffect, useState } from "react";
import { downloadStudentResults, getStudentDashboard } from "../../api/student";
import { signOut } from "../../api/client";
import "./StudentDashboard.css";
import GradeDistributionChart from "../../components/GradeDistributionChart";
import { StudentGpaChart } from "../../components/charts/RoleDashboardCharts";

const studentNavigation = [
  ["Overview", "overview"],
  ["Results", "results"],
  ["Progress", "progress"],
  ["Downloads", "downloads"],
];

export default function StudentDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [semesterId, setSemesterId] = useState("");
  const [navOpen, setNavOpen] = useState(false);
  const [activeSection, setActiveSection] = useState(window.location.hash.slice(1) || "overview");
  useEffect(() => {
    const hash = () => setActiveSection(window.location.hash.slice(1) || "overview");
    const key = (event) => {
      if (event.key === "Escape") setNavOpen(false);
    };
    window.addEventListener("hashchange", hash);
    window.addEventListener("keydown", key);
    return () => {
      window.removeEventListener("hashchange", hash);
      window.removeEventListener("keydown", key);
    };
  }, []);

  const [semesters, setSemesters] = useState([]);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    Promise.resolve()
      .then(() => {
        if (controller.signal.aborted) return;
        setLoading(true);
        setError("");
        setDashboard(null);

        return getStudentDashboard(semesterId, { signal: controller.signal });
      })
      .then((data) => {
        if (!controller.signal.aborted) {
          setDashboard(data);

          setSemesters(data.semesters);
        }
      })
      .catch((requestError) => {
        if (!controller.signal.aborted) setError(requestError.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [semesterId, retry]);

  const profile = dashboard?.profile;
  const summary = dashboard?.summary || {};
  const initials = (profile?.fullName || "Student")
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const completed = summary.completedCredits;
  const required = summary.requiredCredits;
  const percentage =
    completed != null && required ? Math.round((completed / required) * 100) : null;
  async function download() {
    setDownloading(true);
    setError("");
    try {
      const blob = await downloadStudentResults(semesterId);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "result-summary.pdf";
      link.click();
      URL.revokeObjectURL(url);
    } catch (downloadError) {
      setError(downloadError.message);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="student-shell">
      <aside className="student-sidebar" aria-label="Student navigation">
        <a className="student-brand" href="/student">
          <span>U</span>UniVerse
        </a>
        <p className="student-role">Student portal</p>
        <button
          className="student-menu"
          aria-expanded={navOpen}
          aria-controls="student-navigation"
          onClick={() => setNavOpen((value) => !value)}
        >
          Menu
        </button>
        <nav id="student-navigation" className={`student-nav ${navOpen ? "is-open" : ""}`}>
          {studentNavigation.map(([label, id]) => (
            <a
              key={id}
              className={activeSection === id ? "is-active" : ""}
              href={`#${id}`}
              onClick={() => setNavOpen(false)}
            >
              {label}
            </a>
          ))}
        </nav>
        <div className="student-account">
          <b>{initials}</b>
          <div>
            <strong>{profile?.fullName || "Student"}</strong>
            <small>{profile?.registrationNumber || "Loading profile"}</small>
          </div>
        </div>
        <button className="student-signout" type="button" onClick={signOut}>
          Sign out
        </button>
      </aside>
      <main className="student-main">
        <section className="student-intro" id="overview">
          <p className="student-eyebrow">Student workspace</p>
          <h1>
            {loading ? "Loading your academic record" : `Welcome, ${firstName(profile?.fullName)}`}
          </h1>
          <p>
            {profile?.programme?.name ||
              profile?.programmes?.map((programme) => programme.name).join(" · ") ||
              "Your programme information will appear here."}
            {profile?.currentContext ? ` · ${profile.currentContext}` : ""}
          </p>
          {profile?.academicYear && (
            <p className="student-intake-year">
              Academic year of enrolment: {profile.academicYear}
            </p>
          )}
          <label className="student-semester">
            View semester{" "}
            <select value={semesterId} onChange={(event) => setSemesterId(event.target.value)}>
              <option value="">All semesters</option>
              {semesters.map((semester) => (
                <option key={semester.id} value={semester.id}>
                  {semester.label}
                </option>
              ))}
            </select>
          </label>
        </section>
        {error && (
          <div className="student-error" role="alert">
            {error} <button onClick={() => setRetry((value) => value + 1)}>Try again</button>
          </div>
        )}
        {dashboard &&
          (!dashboard.policy.programmeScopeUnambiguous ||
            !dashboard.policy.repeatPolicyConfigured ||
            !dashboard.policy.passingGradesConfigured) && (
            <p className="student-empty">
              Some GPA or credit values are unavailable until the academic calculation policies are
              configured.
            </p>
          )}
        <section className="student-summary">
          <StudentMetric
            label="Current GPA"
            value={studentNumber(summary.currentGpa)}
            detail={summary.currentGpaLabel || "Current published semester"}
          />
          <StudentMetric
            label="CGPA"
            value={studentNumber(summary.cgpa)}
            detail={summary.calculatedThrough || "Published results in view"}
          />
          <StudentMetric
            label="Completed credits"
            value={
              completed == null ? "—" : required == null ? completed : `${completed} / ${required}`
            }
            detail={semesterId ? "Selected semester" : "Published results"}
          />
          <StudentMetric
            label="Published results"
            value={summary.latestPublishedResultCount ?? "—"}
            detail="Available to view"
          />
        </section>
        {dashboard && (
          <section className="student-panel" aria-label="GPA trend">
            <StudentGpaChart rows={dashboard.gpaTrend} />
          </section>
        )}
        <section className="student-grid" id="progress">
          <article className="student-panel" id="results">
            <StudentTitle eyebrow="Results and batch performance" title="Grades by subject" />
            <p className="student-panel-description">
              Results, repeat attempts and three ICAs for each subject. View a graph to compare
              published batch grades.
            </p>
            <GradeDistributionChart rows={dashboard?.subjects || []} loading={loading} />
          </article>
          <article className="student-panel student-credit">
            <StudentTitle
              eyebrow="Programme progress"
              title={required ? "Credit completion" : "Completed credits in view"}
            />
            <strong>{percentage == null ? `${completed ?? "—"} credits` : `${percentage}%`}</strong>
            {required && (
              <div className="student-progress">
                <span style={{ width: `${percentage || 0}%` }} />
              </div>
            )}
            <p>
              Completed <b>{completed ?? "—"}</b>
              {required && (
                <span>
                  Remaining <b>{Math.max(0, required - completed)}</b>
                </span>
              )}
            </p>
          </article>
        </section>
        <section className="student-download" id="downloads">
          <div>
            <p className="student-eyebrow">Downloads</p>
            <h2>Result summary</h2>
            <p>Download a PDF of your published results.</p>
          </div>
          <button type="button" disabled={downloading} onClick={download}>
            {downloading ? "Preparing download…" : "Download PDF"}
          </button>
        </section>
      </main>
    </div>
  );
}

function StudentMetric({ label, value, detail }) {
  return (
    <article className="student-metric">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  );
}
function StudentTitle({ eyebrow, title }) {
  return (
    <div>
      <p className="student-eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
    </div>
  );
}
function studentNumber(value) {
  return value == null ? "—" : Number(value).toFixed(2);
}
function firstName(value) {
  return (value || "Student").split(" ")[0];
}
