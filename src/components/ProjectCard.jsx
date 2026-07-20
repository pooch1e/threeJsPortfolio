import { Link } from 'react-router-dom';

export default function ProjectCard({ project }) {
  return (
    <Link to={`/experience/${project.slug}`} className="block group">
      <div className="flex items-center gap-11 px-4 py-5 place-self-center">
        <span className="font-offbit text-400 tracking-widest text-[var(--object-alt)] group-hover:text-accent transition-colors ease-linear w-10 shrink-0">
          {project.order}
        </span>
        <span className="font-offbit text-400 text-[var(--object-alt)] group-hover:text-accent transition-colors ease-linear flex-1">
          {project.name}
        </span>
      </div>
      <div className=" w-full border-b" />
    </Link>
  );
}
