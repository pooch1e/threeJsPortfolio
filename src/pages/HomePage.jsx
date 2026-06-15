import ProjectCard from '../components/ProjectCard';
import HomeStyle from '../layout/HomeStyle';
import { projectLinks } from '../config/projectLinksConfig';

export default function HomePage() {
  return (
    <HomeStyle>
      <main className="min-h-screen flex items-center justify-center px-4">
        <section className="w-full max-w-3xl flex flex-col">
          {projectLinks.map((project) => (
            <ProjectCard key={project.order} project={project} />
          ))}
        </section>
      </main>
    </HomeStyle>
  );
}
