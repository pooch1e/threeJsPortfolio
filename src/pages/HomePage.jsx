import ProjectCard from '../components/ProjectCard';
import HomeStyle from '../layout/HomeStyle';
import { projectLinks } from '../config/projectLinksConfig';
export default function HomePage() {
  return (
    <HomeStyle>
      <main className="grid grid-cols-1 md:grid-cols-1 gap-4 max-w-3xl mx-auto px-4">
        <section className="flex flex-col ">
          {projectLinks.map((project) => {
            return (
              <div
                key={project.order}
                className="border-b-4 border-black pb-4 pt-4">
                <ProjectCard project={project} />
              </div>
            );
          })}
        </section>
      </main>
    </HomeStyle>
  );
}
