/**
 * ProjectCard — clickable tile on the home menu that triggers the
 * pixelated page transition before navigating into a world scene.
 */
import { transitionStore } from '../store/transitionStore';

export default function ProjectCard({ project }) {
  const setTargetPath = transitionStore((s) => s.setTargetPath);
  const path = `/experience/${project.slug}`;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => setTargetPath(path)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setTargetPath(path);
        }
      }}
      className="block group cursor-pointer"
    >
      <div className="flex items-center gap-11 px-4 py-5 place-self-center">
        <span className="font-offbit text-400 tracking-widest text-[var(--object-alt)] group-hover:text-accent transition-colors ease-linear w-10 shrink-0">
          {project.order}
        </span>
        <span className="font-offbit text-400 text-[var(--object-alt)] group-hover:text-accent transition-colors ease-linear flex-1">
          {project.name}
        </span>
      </div>
      <div className=" w-full border-b" />
    </div>
  );
}
