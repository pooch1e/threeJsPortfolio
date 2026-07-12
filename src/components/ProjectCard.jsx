import { Link } from 'react-router-dom';

export default function ProjectCard({ project }) {
  return (
    <Link to={project.url} className="block cursor-cell group">
      <div className="flex items-center gap-6 px-4 py-5">
        <span className="font-offbit text-100 tracking-widest text-[var(--object-alt)] group-hover:text-accent transition-colors ease-linear w-10 shrink-0">
          {project.order}
        </span>
        <span className="font-offbit text-300 text-[var(--object-alt)] group-hover:text-accent transition-colors ease-linear flex-1">
          {project.projectName}
        </span>
        <span className="font-offbit text-200 text-accent opacity-0 group-hover:opacity-100 transition-opacity ease-linear">
          →
        </span>
      </div>
      <div className="h-px w-full bg-[var(--color-divider)]" />
    </Link>
  );
}
