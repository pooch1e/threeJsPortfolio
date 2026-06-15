import DebugButton from '../components/DebugButton';

export default function Footer() {
  return (
    <div className="font-karrik bg-[var(--color-bg)] overflow-x-hidden w-full">
      <div className="h-0.5 w-full bg-[var(--text-color-standard)]" />
      <div className="flex items-center justify-between px-6 py-3">
        <span className="text-100 text-[var(--text-color-verydark)] opacity-50 tracking-widest uppercase">
          Experiments
        </span>
        <DebugButton />
      </div>
    </div>
  );
}
