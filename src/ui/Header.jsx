import { Link } from "react-router-dom";
import UserDropdown from "../components/UserDropdown";

export default function Header() {
  return (
    <section className="font-karrik bg-[var(--color-bg)] w-full">
      <header className="px-6 pt-4 pb-4">
        <div className="grid grid-cols-[2.5rem_1fr_2.5rem] items-center">
          <div />
          <Link to="/homepage" className="justify-self-center">
            <h1 className="text-4xl uppercase tracking-widest text-ink hover:text-accent transition-colors ease-linear text-center">
              Experiments
            </h1>
          </Link>
          <div className="justify-self-end">
            <UserDropdown />
          </div>
        </div>
      </header>
      <div className="h-0.5 w-full bg-accent" />
    </section>
  );
}
