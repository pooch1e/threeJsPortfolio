import ProjectCard from '../components/ProjectCard';
import HomeStyle from '../layout/HomeStyle';
export default function HomePage() {
  return (
    <>
      <HomeStyle>
        <section className="overflow-x-hidden">
          <header className="p-4 mb-6">
            <h1>Welcome to my portfolio</h1>
            <h2>A selection of ThreeJs experiments</h2>
            <hr></hr>
          </header>
        </section>
        <main className="grid grid-cols-1 md:grid-cols-1 gap-4 max-w-3xl mx-auto px-4">
          <section className="flex flex-col">
            <div className="border-b-4 border-black pb-8">
              <ProjectCard />
            </div>
            <div className="border-b-4 border-black pb-8 mt-6">
              <ProjectCard />
            </div>
          </section>
        </main>
      </HomeStyle>
    </>
  );
}
