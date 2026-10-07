export default function AttendanceTable({ rows = [] }) {
  if (!rows.length) {
    return <p className="empty-state">No attendance records are available for this session.</p>;
  }

  return (
    <div className="table-wrap">
      <table className="lecturer-table">
        <caption>Attendance summary</caption>
        <thead>
          <tr>
            <th scope="col">Student</th>
            <th scope="col">Registration</th>
            <th scope="col">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id ?? `${row.registration}-${row.name}`}>
              <td>{row.name}</td>
              <td>{row.registration}</td>
              <td>
                <span className={`status-pill status-${String(row.status || "present").toLowerCase().replace(/\s+/g, "-")}`}>
                  {row.status || "Present"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
