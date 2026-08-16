/**
 * ConfirmDialog — modal confirm/cancel prompt for destructive admin actions.
 */
export default function ConfirmDialog({ open, title, message, onConfirm, onCancel }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div
        className="w-full max-w-sm rounded-[var(--admin-radius-lg)] p-[var(--admin-space-6)] flex flex-col gap-[var(--admin-space-4)] bg-[var(--admin-bg-secondary)] border border-[var(--admin-border)]"
        style={{ boxShadow: "var(--admin-shadow-modal)" }}
      >
        <h2 className="font-semibold text-[var(--admin-font-size-lg)] text-[var(--admin-text-primary)]">
          {title}
        </h2>
        <p className="text-[var(--admin-font-size-base)] text-[var(--admin-text-secondary)]">
          {message}
        </p>
        <div className="flex justify-end gap-[var(--admin-space-3)] mt-[var(--admin-space-2)]">
          <button
            type="button"
            onClick={onCancel}
            className="px-[var(--admin-space-4)] py-[var(--admin-space-2)] rounded-[var(--admin-radius-md)] text-[var(--admin-font-size-sm)] font-medium text-[var(--admin-text-secondary)] border border-[var(--admin-border)] hover:bg-[var(--admin-bg-hover)] hover:text-[var(--admin-text-primary)] transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-[var(--admin-space-4)] py-[var(--admin-space-2)] rounded-[var(--admin-radius-md)] text-[var(--admin-font-size-sm)] font-medium text-white bg-[var(--admin-danger)] hover:bg-[var(--admin-danger-hover)] transition-colors"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
