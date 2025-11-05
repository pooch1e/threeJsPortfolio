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
      <main className="grid grid-cols-2 gap-2 p-4">
        <ProjectCard />
        <div>Project container 2 card</div>
      </main>
    </>
  );
}
