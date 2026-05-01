import { Link } from "react-router-dom";
import UserDropdown from "../components/UserDropdown";

export default function Header() {
  return (
    <section className="font-karrik bg-[var(--color-bg)] w-full">
      <header className="p-4">
        <div className="flex items-center justify-between mb-2">
          {/* Spacer to keep title centered */}
          <div className="w-10"></div> 
          
          <Link to={"/homepage"}>
            <h1 className="text-4xl hover:text-cyan-300 transition-colors ease-linear text-center">
              Experiments
            </h1>
          </Link>

          <div className="w-10 flex justify-end">
            <UserDropdown />
          </div>
        </div>

        <h2 className="text-[var(--font-size-300)] p-2 text-center">
          A selection of experiments
        </h2>

        <hr className="border-gray-800" />
      </header>
    </section>
  );
}
