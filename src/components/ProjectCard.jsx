import { Link } from 'react-router-dom';

export default function ProjectCard({ project }) {
  return (
    <Link to={project.url} className="block cursor-cell group">
      <div className="relative flex items-center gap-6 px-4 py-6 overflow-hidden">
        {/* Giant faded index in background */}
        <span
          className="absolute left-2 top-1/2 -translate-y-1/2 font-karrik leading-none select-none pointer-events-none text-[var(--text-color-verydark)]"
          style={{ fontSize: '6rem', opacity: 0.07 }}
          aria-hidden="true"
        >
          {project.order}
        </span>

        {/* Small index label */}
        <span className="relative font-karrik text-100 tracking-widest text-[var(--color-bg-light)] w-10 shrink-0">
          {project.order}
        </span>

        {/* Project name */}
        <span className="relative font-karrik text-300 text-[var(--text-color-verydark)] group-hover:text-[var(--text-color-standard)] transition-colors ease-linear flex-1">
          {project.projectName}
        </span>

        {/* Arrow — fades in on hover */}
        <span className="relative font-karrik text-200 text-[var(--text-color-standard)] opacity-0 group-hover:opacity-100 transition-opacity ease-linear">
          →
        </span>
      </div>
      <div className="h-px w-full bg-[var(--text-color-verydark)] opacity-20" />
    </Link>
  );
}
