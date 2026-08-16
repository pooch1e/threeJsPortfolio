/**
 * AdminPagination — prev/next pager for the admin user table.
 */
export default function AdminPagination({ pagination, onPageChange }) {
  const { page = 1, total_pages = 1 } = pagination || {};

  return (
    <div className="flex items-center justify-between gap-[var(--admin-space-4)] text-[var(--admin-font-size-sm)] text-[var(--admin-text-secondary)]">
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="px-[var(--admin-space-3)] py-[var(--admin-space-1)] rounded-[var(--admin-radius-sm)] border border-[var(--admin-border)] hover:bg-[var(--admin-bg-hover)] hover:text-[var(--admin-text-primary)] disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-[var(--admin-text-secondary)] transition-colors"
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
        className="px-[var(--admin-space-3)] py-[var(--admin-space-1)] rounded-[var(--admin-radius-sm)] border border-[var(--admin-border)] hover:bg-[var(--admin-bg-hover)] hover:text-[var(--admin-text-primary)] disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-[var(--admin-text-secondary)] transition-colors"
      >
        Next
      </button>
    </div>
  );
}
