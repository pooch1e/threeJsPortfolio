import ProjectCard from '../components/ProjectCard';
import UserDropdown from '../components/UserDropdown';
import HomeStyle from '../layout/HomeStyle';
import { experiences } from '../config/experienceConfig';

export default function HomePage() {
  return (
    <HomeStyle>
      <div className="fixed top-4 right-4 z-20">
        <UserDropdown />
      </div>
      <main className="min-h-svh flex flex-col items-center justify-start sm:justify-center px-4 py-10">
        <h1 className="font-dirtyline text-5xl uppercase tracking-widest text-[var(--text-primary)] text-center mb-10">
          Experiments
        </h1>
        <section className="w-full max-w-3xl">
          <div className='grid md:grid-cols-2 gap-12 grid-cols-1'>
          {experiences.map((project) => (
            <ProjectCard key={project.slug} project={project} />
          ))}
            </div>
        </section>
      </main>
    </HomeStyle>
  );
}
