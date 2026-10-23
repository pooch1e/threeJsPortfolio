/**
 * UserDropdown — account menu with a link to the admin dashboard
 * (for admin users) and logout.
 */
import { useState } from "react";
import { usePresence } from "../hooks/usePresence";
import { useNavigate } from "react-router-dom";
import { userLoginStore } from "../store/user";
import { postLogout } from "../utils/postLogout";
import { User, LogOut } from "./icons";

export default function UserDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const { mounted, visible } = usePresence(isOpen);
  const username = userLoginStore((s) => s.username);
  const isAdmin = userLoginStore((s) => s.isAdmin);
  const logout = userLoginStore((s) => s.logout);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await postLogout();
    } catch (error) {
      console.error("Logout failed", error);
    } finally {
      logout();
      navigate("/");
    }
  };

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-10 h-10 rounded-full transition-colors focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)] border-2 border-transparent text-[var(--object-alt)] hover:text-[var(--text-alt)] hover:border-[var(--text-alt)]"
        title={username}
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        <User size={20} />
      </button>

      {mounted && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)}></div>
          <div data-visible={visible} className="presence origin-top-right absolute right-0 mt-2 w-48 bg-[#1a1a1a] border border-gray-700 rounded-md shadow-xl z-20 py-1 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-700 bg-[#242424]">
              <p className="text-xs text-gray-400 uppercase tracking-wider">Signed in as</p>
              <p className="text-[var(--object-alt)]">{username}</p>
            </div>
            {isAdmin && (
              <button
                onClick={() => {
                  setIsOpen(false);
                  navigate("/admin");
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-800 hover:text-white transition-colors flex items-center"
              >
                Admin Dashboard
              </button>
            )}
            <button
              onClick={() => {
                setIsOpen(false);
                handleLogout();
              }}
              className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-800 hover:text-white transition-colors flex items-center"
            >
              <LogOut size={16} className="mr-2" />
              Logout
            </button>
          </div>
        </>
      )}
    </div>
  );
}
