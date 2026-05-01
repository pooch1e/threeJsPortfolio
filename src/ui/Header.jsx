import { Link } from "react-router-dom";
import UserDropdown from "../components/UserDropdown";

export default function Header() {
  return (
    <section className="text-center font-karrik bg-[var(--color-bg)] overflow-x-hidden w-full relative">
      <header className="p-4">
        <div className="absolute right-4 top-4">
          <UserDropdown />
        </div>
        <Link to={"/homepage"}>
          <h1 className="text-4xl hover:text-cyan-300 transition-colors ease-linear">
            Experiments
          </h1>
        </Link>
        <h2 className="text-[var(--font-size-300)] p-2">
          A selection of experiments
        </h2>

        <hr className="border-gray-800" />
      </header>
    </section>
  );
}
