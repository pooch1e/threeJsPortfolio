import { useState } from 'react';

export default function NavBar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav>
      <div className="relative inline-block">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex w-full justify-center gap-x-1.5 rounded-md border-2 p-2 ">
          Projects
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-56 rounded-md bg-gray-800 ring-1 ring-white/10">
            <div className="py-1">
              <a
                href="/animalPage"
                className="block px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white">
                Animal Page
              </a>
              <a
                href="/pointCloud"
                className="block px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white">
                PointCloud
              </a>
              <a
                href="#"
                className="block px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white">
                Project 3
              </a>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
