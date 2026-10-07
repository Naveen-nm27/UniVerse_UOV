export default function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;

  const pageNumber = Number(page) || 1;

  return (
    <div className="pagination" aria-label="Pagination">
      <button type="button" disabled={pageNumber <= 1} onClick={() => onChange(Math.max(1, pageNumber - 1))}>
        Previous
      </button>
      <span>
        Page {pageNumber} of {totalPages}
      </span>
      <button type="button" disabled={pageNumber >= totalPages} onClick={() => onChange(Math.min(totalPages, pageNumber + 1))}>
        Next
      </button>
    </div>
  );
}
