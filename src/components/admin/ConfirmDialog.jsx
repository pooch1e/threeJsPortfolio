/**
 * ConfirmDialog — modal confirm/cancel prompt for destructive admin actions.
 */
export default function ConfirmDialog({ open, title, message, onConfirm, onCancel }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-[#1a1a1a] border border-gray-700 rounded-md shadow-xl p-6 flex flex-col gap-4">
        <h2 className="font-offbit uppercase tracking-widest text-[var(--object-alt)] text-lg">
          {title}
        </h2>
        <p className="font-karrik text-gray-300 text-sm">{message}</p>
        <div className="flex justify-end gap-3 mt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-md text-sm font-offbit uppercase tracking-widest text-gray-300 border border-gray-700 hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 rounded-md text-sm font-offbit uppercase tracking-widest text-white bg-red-600 hover:bg-red-700 transition-colors"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
