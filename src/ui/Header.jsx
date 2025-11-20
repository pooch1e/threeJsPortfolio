import { Link } from 'react-router-dom';
import DebugButton from '../components/DebugButton';
export default function Header() {
  return (
    <section className="font-karrik bg-[#798086] overflow-x-hidden w-full">
      <header className="p-4 mb-6">
        <Link to={'/'}>
          <h1 className="text-center text-4xl hover:text-cyan-300 transition-colors ease-linear">
            Home
          </h1>
        </Link>
        <DebugButton />
        <h2>A selection of ThreeJs experiments</h2>
        <hr></hr>
      </header>
    </section>
  );
}
