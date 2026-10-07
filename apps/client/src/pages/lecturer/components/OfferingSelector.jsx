export default function OfferingSelector({ value, onChange, offerings = [] }) {
  return (
    <label className="lecturer-field">
      <span className="lecturer-field-label">Offering</span>
      <select value={value} onChange={onChange} aria-label="Select a module offering">
        <option value="">All offerings</option>
        {offerings.map((offering) => (
          <option key={offering.id} value={offering.id}>
            {offering.moduleCode} · {offering.title}
          </option>
        ))}
      </select>
    </label>
  );
}
