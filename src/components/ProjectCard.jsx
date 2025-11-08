import { Link } from "react-router-dom";
export default function ProjectCard({project}) {
  return (
    <>
      <Link to={project.url}>
        <div className="flex justify-between hover:text-cyan-300 ease-linear transition-colors">
          <span>
            <p className="text-2xl">{project.order}</p>
          </span>
          <span>
            <p className="text-2xl">{project.projectName}</p>
          </span>
        </div>
      </Link>
    </>
  );
}
