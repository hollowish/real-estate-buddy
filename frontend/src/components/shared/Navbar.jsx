// Shared navigation bar — logo, nav links, logout
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();

  const linkClass = (path) =>
    `text-sm font-medium transition-colors ${
      pathname === path
        ? 'text-indigo-600'
        : 'text-gray-600 hover:text-gray-900'
    }`;

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/listings" className="text-lg font-bold text-indigo-600 tracking-tight">
          HomeScore AI
        </Link>

        <div className="flex items-center gap-6">
          <Link to="/listings" className={linkClass('/listings')}>My Listings</Link>
          <Link to="/profile" className={linkClass('/profile')}>Profile</Link>

          <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
            {user && (
              <span className="text-sm text-gray-500 hidden sm:block">
                {user.username}
              </span>
            )}
            <button
              onClick={logout}
              className="text-sm font-medium text-gray-600 hover:text-red-600 transition-colors"
            >
              Log out
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
