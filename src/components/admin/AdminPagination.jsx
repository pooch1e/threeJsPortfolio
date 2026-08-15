/**
 * AdminPagination — prev/next pager for the admin user table.
 */
export default function AdminPagination({ pagination, onPageChange }) {
  const { page = 1, total_pages = 1 } = pagination || {};

  return (
    <div className="flex items-center justify-between gap-4 font-karrik text-sm text-gray-300">
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="px-3 py-1.5 rounded-md border border-gray-700 hover:bg-gray-800 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
      >
        Prev
      </button>
      <span>
        Page {page} of {total_pages || 1}
      </span>
      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= total_pages}
        className="px-3 py-1.5 rounded-md border border-gray-700 hover:bg-gray-800 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
      >
        Next
      </button>
    </div>
  );
}
