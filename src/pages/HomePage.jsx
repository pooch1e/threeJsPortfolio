import ProjectCard from '../components/ProjectCard';
export default function HomePage() {
  return (
    <>
      <section>
        <header className="p-4">
          <h1>Welcome to my portfolio</h1>
          <h2>A selection of ThreeJs experiments</h2>
          <hr></hr>
        </header>
      </section>
      <main className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 max-w-6xl mx-auto">
        <section className="flex flex-col">
          <ProjectCard />
          <div>Project container 2 card</div>
        </section>
      </main>
    </>
  );
}
