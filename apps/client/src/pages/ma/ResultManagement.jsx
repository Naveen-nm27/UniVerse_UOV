import { useState } from "react";
import { apiRequest, queryString } from "../../api/client";
import { RequestState, Table, Pagination } from "../../components/RemoteData";
import { useRemote } from "../../hooks/use-remote";
const column = (key, label) => ({ key, label });
export default function ResultManagement({ grades = false }) {
  return grades ? <GradeEntry /> : <Workflow />;
}
function Workflow() {
  const [page, setPage] = useState(1),
    [status, setStatus] = useState(""),
    [selected, setSelected] = useState(null);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [success, setSuccess] = useState("");
  const rows = useRemote("/staff/results" + queryString({ page, status })),
    transitions = useRemote("/ma/results/transitions");
  async function submit(event) {
    event.preventDefault();
    const fields = Object.fromEntries(new FormData(event.currentTarget));
    if (
      !window.confirm(
        `Record ${fields.toStatus} for ${selected.studentName}, ${selected.moduleCode}?`,
      )
    )
      return;
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      await apiRequest(`/ma/results/${selected.resultId}/status`, {
        method: "POST",
        body: { ...fields, fromStatus: selected.status },
      });
      setSelected(null);
      rows.reload();
      setSuccess("Result status recorded.");
    } catch (e) {
      setError(e.message);
      if (e.code === "STALE_RESULT") {
        setSelected(null);
        rows.reload();
      }
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <h1>Result workflow</h1>
      <p>
        Record the verified outcome from each office. Students see final results after publication.
      </p>
      <label>
        Filter status{" "}
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
            setSelected(null);
          }}
        >
          <option value="">All statuses</option>
          {["ENTERED", "VALIDATED", "WITH_DEAN_OFFICE", "PUBLISHED", "RETURNED"].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </label>
      <RequestState {...rows} />
      <RequestState {...transitions} />
      {error && (
        <p role="alert" className="ma-error">
          {error}
        </p>
      )}
      {success && <p role="status">{success}</p>}
      {rows.data && (
        <section className="ma-panel">
          <Table
            rows={rows.data.data}
            rowKey="resultId"
            columns={[
              column("studentName", "Student"),
              column("registrationNumber", "Registration"),
              column("moduleCode", "Module"),
              column("attemptNumber", "Attempt"),
              column("finalGrade", "Final grade"),
              column("status", "Status"),
              {
                key: "action",
                label: "Action",
                render: (r) => (
                  <button
                    onClick={() => {
                      setSelected(r);
                      setError("");
                    }}
                  >
                    View workflow
                  </button>
                ),
              },
            ]}
          />
          <Pagination meta={rows.data.meta} onPage={setPage} />
        </section>
      )}
      {selected && (
        <section className="ma-panel">
          <h2>
            {selected.studentName} · {selected.moduleCode}
          </h2>
          <p>
            Attempt {selected.attemptNumber} · Current status: {selected.status}
          </p>
          {transitions.data?.data[selected.status]?.length > 0 ? (
            <form className="ma-form" onSubmit={submit}>
              <label>
                Next status
                <select name="toStatus" required>
                  {transitions.data.data[selected.status].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>
              <label>
                Verification note (required for returns)
                <textarea name="note" maxLength={500} />
              </label>
              <button disabled={busy}>{busy ? "Recording…" : "Review and record status"}</button>
            </form>
          ) : (
            <p>No further status changes are available.</p>
          )}
          <ResultHistory id={selected.resultId} />
          <button onClick={() => setSelected(null)}>Close</button>
        </section>
      )}
    </>
  );
}
function GradeEntry() {
  const [offeringId, setOfferingId] = useState(""),
    [kind, setKind] = useState("final"),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [error, setError] = useState("");
  const offerings = useRemote("/ma/results/offerings");
  return (
    <>
      <h1>Grade entry</h1>
      <p>
        Select the module offering and enrollment attempt before entering an approved letter grade.
      </p>
      <RequestState {...offerings} />
      <label>
        Module offering
        <select
          value={offeringId}
          onChange={(e) => {
            setOfferingId(e.target.value);
            setMessage("");
            setError("");
          }}
        >
          <option value="">Choose offering</option>
          {offerings.data?.data.map((r) => (
            <option key={r.id} value={r.id}>
              {r.label}
            </option>
          ))}
        </select>
      </label>
      {offeringId && (
        <EntryForm
          key={`${offeringId}-${kind}`}
          {...{ offeringId, kind, setKind, busy, setBusy, message, setMessage, error, setError }}
        />
      )}
    </>
  );
}
function EntryForm({
  offeringId,
  kind,
  setKind,
  busy,
  setBusy,
  message,
  setMessage,
  error,
  setError,
}) {
  const context = useRemote(`/ma/results/entry-context/${offeringId}`);
  async function submit(event) {
    event.preventDefault();
    const input = Object.fromEntries(new FormData(event.currentTarget));
    input.enrollmentId = Number(input.enrollmentId);
    const id = kind === "final" ? "examId" : "icaId";
    input[id] = Number(input[id]);
    if (!window.confirm("Save these grades for the selected enrollment attempt?")) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await apiRequest(`/ma/results/${kind === "final" ? "final-grades" : "ica-grades"}`, {
        method: "POST",
        body: input,
      });
      setMessage("Grades saved.");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="ma-panel">
      <RequestState {...context} />
      {error && (
        <p role="alert" className="ma-error">
          {error}
        </p>
      )}
      {message && <p role="status">{message}</p>}
      {context.data && (
        <>
          <label>
            Grade type
            <select
              value={kind}
              onChange={(e) => {
                setKind(e.target.value);
                setMessage("");
                setError("");
              }}
            >
              <option value="final">Exam and final grades</option>
              <option value="ica">ICA grade</option>
            </select>
          </label>
          <form className="ma-form" onSubmit={submit}>
            <Choice
              name="enrollmentId"
              label="Student and attempt"
              options={context.data.data.enrollments}
            />
            {kind === "final" ? (
              <>
                <Choice name="examId" label="Exam" options={context.data.data.exams} />
                <Choice name="examGrade" label="Exam grade" options={context.data.data.grades} />
                <Choice
                  name="finalGrade"
                  label="Approved final grade"
                  options={context.data.data.grades}
                />
              </>
            ) : (
              <>
                <Choice name="icaId" label="Assessment" options={context.data.data.icas} />
                <Choice name="grade" label="ICA grade" options={context.data.data.grades} />
              </>
            )}
            <button disabled={busy}>{busy ? "Saving…" : "Review and save grades"}</button>
          </form>
        </>
      )}
    </section>
  );
}
function Choice({ name, label, options }) {
  return (
    <label>
      {label}
      <select name={name} required defaultValue="">
        <option value="" disabled>
          Choose {label.toLowerCase()}
        </option>
        {options.map((r) => (
          <option key={r.id} value={r.id}>
            {r.label}
          </option>
        ))}
      </select>
      {!options.length && <small>No available options. Complete the academic setup first.</small>}
    </label>
  );
}
function ResultHistory({ id }) {
  const rows = useRemote(`/staff/results/${id}/history`);
  return (
    <>
      <h3>Status history</h3>
      <RequestState {...rows} />
      {rows.data && (
        <Table
          rows={rows.data.data}
          columns={[
            column("fromStatus", "From"),
            column("toStatus", "To"),
            column("actor", "Recorded by"),
            column("changedAt", "Date"),
            column("note", "Note"),
          ]}
        />
      )}
    </>
  );
}
