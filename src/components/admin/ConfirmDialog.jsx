/**
 * ConfirmDialog — modal confirm/cancel prompt for destructive admin actions.
 * Fades and scales in from the centre; keeps the last title/message mounted
 * through its exit so the text doesn't blank mid-fade.
 */
import { useEffect, useState } from "react";
import { usePresence } from "../../hooks/usePresence";

export default function ConfirmDialog({ open, title, message, onConfirm, onCancel }) {
  const { mounted, visible } = usePresence(open, 120);
  const [shown, setShown] = useState({ title, message });

  if (open && (shown.title !== title || shown.message !== message)) {
    setShown({ title, message });
  }

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onCancel]);

  if (!mounted) return null;

  return (
    <div
      data-visible={visible}
      className="presence-fade fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-[var(--admin-space-4)]"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={shown.title}
        data-visible={visible}
        className="presence presence-modal w-full max-w-sm rounded-[var(--admin-radius-lg)] p-[var(--admin-space-6)] flex flex-col gap-[var(--admin-space-4)] bg-[var(--admin-bg-secondary)] border border-[var(--admin-border)]"
        style={{ boxShadow: "var(--admin-shadow-modal)" }}
      >
        <h2 className="font-semibold text-[var(--admin-font-size-lg)] text-[var(--admin-text-primary)]">
          {shown.title}
        </h2>
        <p className="text-[var(--admin-font-size-base)] text-[var(--admin-text-secondary)] break-words">
          {shown.message}
        </p>
        <div className="flex justify-end gap-[var(--admin-space-3)] mt-[var(--admin-space-2)]">
          <button
            type="button"
            onClick={onCancel}
            className="px-[var(--admin-space-4)] py-[var(--admin-space-2)] rounded-[var(--admin-radius-md)] text-[var(--admin-font-size-sm)] font-medium text-[var(--admin-text-secondary)] border border-[var(--admin-border)] hover:bg-[var(--admin-bg-hover)] hover:text-[var(--admin-text-primary)] transition-colors focus-visible:outline-none focus-visible:shadow-[var(--admin-focus-ring)]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-[var(--admin-space-4)] py-[var(--admin-space-2)] rounded-[var(--admin-radius-md)] text-[var(--admin-font-size-sm)] font-medium text-white bg-[var(--admin-danger)] hover:bg-[var(--admin-danger-hover)] transition-colors focus-visible:outline-none focus-visible:shadow-[var(--admin-focus-ring)]"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
