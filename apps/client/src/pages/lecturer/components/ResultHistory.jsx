export default function ResultHistory({ history = [] }) {
  if (!history.length) {
    return <p className="empty-state">No result-history records are available.</p>;
  }

  return (
    <ul className="result-history-list">
      {history.map((entry) => (
        <li key={entry.id ?? `${entry.action}-${entry.at}`}>
          <strong>{entry.action}</strong>
          <span>{entry.by}</span>
          <small>{entry.at}</small>
        </li>
      ))}
    </ul>
  );
}
