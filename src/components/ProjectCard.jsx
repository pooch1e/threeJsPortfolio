/**
 * ProjectCard — clickable tile on the home menu that triggers the
 * pixelated page transition before navigating into a world scene.
 */
import { transitionStore } from '../store/transitionStore';

export default function ProjectCard({ project }) {
  const setTargetPath = transitionStore((s) => s.setTargetPath);
  const path = `/experience/${project.slug}`;

  return (
    <button
      type="button"
      onClick={() => setTargetPath(path)}
      className="block group cursor-pointer w-full text-left focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]"
    >
      <div className="flex items-center gap-11 px-4 py-5 place-self-center">
        <span className="font-offbit text-400 tracking-widest text-[var(--object-alt)] group-hover:text-accent transition-colors w-10 shrink-0">
          {project.order}
        </span>
        <span className="font-offbit text-400 text-[var(--object-alt)] group-hover:text-accent transition-colors flex-1 min-w-0 break-words">
          {project.name}
        </span>
      </div>
      <div className=" w-full border-b" />
    </button>
  );
}
