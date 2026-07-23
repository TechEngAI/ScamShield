import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { LogOut, Menu, X } from "lucide-react";
import toast from "react-hot-toast";
import useAuth from "../../hooks/useAuth";

const navItems = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/check", label: "Check Scam" },
  { to: "/bulk", label: "Bulk Check" },
  { to: "/history", label: "History" },
];

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    const result = await logout();
    if (result.success) {
      toast.success("Logged out successfully");
      navigate("/login", { replace: true });
    } else {
      toast.error(result.message || "Could not log out");
    }
  };

  const linkClass = ({ isActive }) =>
    `rounded-lg px-4 py-2 text-sm font-medium transition-colors duration-200 ${
      isActive
        ? "text-white font-semibold bg-blue-500/20 border-b-2 border-blue-500"
        : "text-slate-300 hover:text-white hover:bg-slate-800/50"
    }`;

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/95 backdrop-blur-sm">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link
          to="/"
          className="flex items-center gap-3 text-white transition-transform hover:scale-105"
        >
          <svg
            width="32"
            height="32"
            viewBox="0 0 32 32"
            fill="none"
            className="flex-shrink-0"
          >
            <path
              d="M16 2L4 7V15C4 21.6 9.2 27.8 16 30C22.8 27.8 28 21.6 28 15V7L16 2Z"
              fill="#3B82F6"
            />
            <path
              d="M12 16L15 19L21 13"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="text-xl font-bold tracking-tight">
            ScamShield NG
          </span>
        </Link>

        {user ? (
          <>
            <div className="hidden items-center gap-1 md:flex">
              <NavLink
                to="/feed"
                className="flex items-center gap-1 text-slate-300 hover:text-white transition-colors text-sm"
              >
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                Live Feed
              </NavLink>
              <NavLink
                to="/developer"
                className="rounded-lg px-4 py-2 text-sm font-medium transition-colors duration-200 text-slate-300 hover:text-white hover:bg-slate-800/50"
              >
                🔑 API
              </NavLink>
              {navItems.map((item) => (
                <NavLink key={item.to} to={item.to} className={linkClass}>
                  {item.label}
                </NavLink>
              ))}
            </div>

            <div className="hidden items-center gap-4 md:flex">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-sm">
                  {user.username?.charAt(0).toUpperCase() ||
                    user.email?.charAt(0).toUpperCase()}
                </div>
                <span className="max-w-40 truncate text-sm font-medium text-slate-300">
                  {user.username || user.email}
                </span>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="btn-base inline-flex items-center gap-2 rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:border-red-500 hover:text-red-400 hover:bg-red-500/10"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Logout
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen((value) => !value)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-700 text-slate-300 transition-colors hover:bg-slate-800 md:hidden"
              aria-label="Open navigation menu"
            >
              {isOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </>
        ) : (
          <div className="hidden items-center gap-3 md:flex">
            <NavLink
              to="/feed"
              className="flex items-center gap-1 text-slate-300 hover:text-white transition-colors text-sm"
            >
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              Live Feed
            </NavLink>
            <NavLink
              to="/api-docs"
              className="text-slate-300 hover:text-white transition-colors text-sm"
            >
              Developers
            </NavLink>
            <Link
              to="/login"
              className="btn-base rounded-lg px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:text-white hover:bg-slate-800"
            >
              Sign in
            </Link>
            <Link
              to="/register"
              className="btn-base rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:bg-blue-700 hover:shadow-blue-500/40"
            >
              Create account
            </Link>
          </div>
        )}
      </nav>

      {user && isOpen ? (
        <div className="border-t border-slate-800 bg-slate-950 px-4 pb-4 md:hidden mobile-menu-animate">
          <div className="flex flex-col gap-1 pt-4">
            <NavLink
              to="/feed"
              className={({ isActive }) =>
                `rounded-lg px-4 py-3 text-sm font-medium transition-colors flex items-center gap-2 ${
                  isActive
                    ? "bg-blue-500/20 text-white"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`
              }
              onClick={() => setIsOpen(false)}
            >
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              Live Feed
            </NavLink>
            <NavLink
              to="/api-docs"
              className={({ isActive }) =>
                `rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-blue-500/20 text-white"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`
              }
              onClick={() => setIsOpen(false)}
            >
              Developers
            </NavLink>
            <NavLink
              to="/developer"
              className={({ isActive }) =>
                `rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-blue-500/20 text-white"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`
              }
              onClick={() => setIsOpen(false)}
            >
              🔑 API
            </NavLink>
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-blue-500/20 text-white"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`
                }
                onClick={() => setIsOpen(false)}
              >
                {item.label}
              </NavLink>
            ))}
            <div className="mt-4 border-t border-slate-800 pt-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold">
                  {user.username?.charAt(0).toUpperCase() ||
                    user.email?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">
                    {user.username || user.email}
                  </p>
                  <p className="text-xs text-slate-400">
                    {user.first_name} {user.last_name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="btn-base w-full inline-flex items-center justify-center gap-2 rounded-lg border border-slate-700 px-4 py-3 text-sm font-medium text-slate-300 transition-colors hover:border-red-500 hover:text-red-400 hover:bg-red-500/10"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Logout
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}

export default Navbar;
