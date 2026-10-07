export default function SessionControls({ canToggleAttendance, canViewUnpublished, onToggleAttendance, onToggleUnpublished }) {
  return (
    <div className="session-controls" aria-label="Session controls">
      <button type="button" className="secondary-button" onClick={onToggleAttendance}>
        {canToggleAttendance ? "Mark attendance" : "Attendance view only"}
      </button>
      <button type="button" className="secondary-button" onClick={onToggleUnpublished}>
        {canViewUnpublished ? "Show unpublished grades" : "Unpublished grades hidden"}
      </button>
    </div>
  );
}
