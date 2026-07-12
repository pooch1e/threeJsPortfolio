import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { userLoginStore } from "../store/user";
import { postLogout } from "../utils/postLogout";
import { User, LogOut } from "./icons";

export default function UserDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const username = userLoginStore((s) => s.username);
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
        className="flex items-center justify-center w-10 h-10 rounded-full bg-cyan-700 text-white hover:bg-cyan-600 transition-colors focus:outline-none border-2 border-transparent hover:border-cyan-300"
        title={username}
      >
        <User size={20} />
      </button>

      {isOpen && (
        <>
          {/* Overlay to close dropdown when clicking outside */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          ></div>
          <div className="absolute right-0 mt-2 w-48 bg-[#1a1a1a] border border-gray-700 rounded-md shadow-xl z-20 py-1 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-700 bg-[#242424]">
              <p className="text-xs text-gray-400 uppercase tracking-wider">Signed in as</p>
              <p className="font-medium truncate text-cyan-400">{username}</p>
            </div>
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
