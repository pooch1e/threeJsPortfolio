/**
 * LoadingOverlay — full-screen spinner that fades in and out via CSS.
 * Stays mounted through its exit, so render it unconditionally and
 * toggle `isLoading` rather than mounting it conditionally.
 */
import { usePresence } from '../hooks/usePresence';

export default function LoadingOverlay({ isLoading = true, message = 'Loading...' }) {
  const { mounted, visible } = usePresence(isLoading, 200);

  if (!mounted) return null;

  return (
    <div
      role="status"
      data-visible={visible}
      className="presence-fade fixed inset-0 z-50 flex items-center justify-center bg-black/70"
    >
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin" />
        <p className="text-white/80 text-lg font-karrik">{message}</p>
      </div>
    </div>
  );
}
