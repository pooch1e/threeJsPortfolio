import { Link } from 'react-router-dom';
export default function Header() {
  return (
    <section className="font-karrik bg-[var(--color-bg)] overflow-x-hidden w-full">
      <header className="p-4">
        <Link to={'/'}>
          <h1 className="text-center text-4xl hover:text-cyan-300 transition-colors ease-linear">
            Home
          </h1>
        </Link>
        <h2 className="text-center text-[var(--font-size-300)] p-2">A selection of experiments</h2>

        <hr></hr>
      </header>
    </section>
  );
}
