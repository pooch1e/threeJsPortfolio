import DebugButton from '../components/DebugButton';

export default function Footer() {
  return (
    <div className="font-karrik bg-[var(--color-bg)] overflow-x-hidden w-full">
      <div className="h-0.5 w-full bg-accent" />
      <div className="flex items-center justify-between px-6 py-3">
        <span className="text-100 text-[var(--color-index)] tracking-widest uppercase">
          Experiments
        </span>
        <DebugButton />
      </div>
    </div>
  );
}
