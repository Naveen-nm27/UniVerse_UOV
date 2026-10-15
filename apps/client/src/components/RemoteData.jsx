export function RequestState({ data, error, reload }) {
  if (error)
    return (
      <p className="ma-error" role="alert">
        {error} <button onClick={reload}>Try again</button>
      </p>
    );
  return !data ? <p role="status">Loading records…</p> : null;
}
export function Table({ rows, columns, rowKey = "id" }) {
  if (!rows?.length) return <p>No records match this view.</p>;
  return (
    <div className="ma-table-scroll" tabIndex={0} role="region" aria-label="Records">
      <table className="ma-table">
        <thead>
          <tr>
            {columns.map((c) => (
              <th scope="col" key={c.key}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row[rowKey]}>
              {columns.map((c) => (
                <td key={c.key}>{c.render ? c.render(row) : (row[c.key] ?? "—")}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
export function Pagination({ meta, onPage }) {
  if (!meta) return null;
  const pages = Math.max(1, Math.ceil(meta.total / meta.pageSize));
  return (
    <div className="ma-pagination">
      <button disabled={meta.page <= 1} onClick={() => onPage(meta.page - 1)}>
        Previous
      </button>
      <span>
        Page {meta.page} of {pages} · {meta.total} records
      </span>
      <button disabled={meta.page >= pages} onClick={() => onPage(meta.page + 1)}>
        Next
      </button>
    </div>
  );
}
