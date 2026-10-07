export default function SemesterSelector({ value, onChange, options = [] }) {
  return (
    <label className="lecturer-field">
      <span className="lecturer-field-label">Semester</span>
      <select value={value} onChange={onChange} aria-label="Select academic semester">
        <option value="">All semesters</option>
        {options.map((option) => (
          <option key={option.value ?? option.label} value={option.value ?? option.label}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
