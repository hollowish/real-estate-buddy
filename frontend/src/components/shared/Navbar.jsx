// Shared navigation bar — logo, nav links, logout
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();

  // Resolve a human-readable display name.
  // Amplify's getCurrentUser() returns username as the Cognito sub (UUID);
  // signInDetails.loginId holds the email / alias used at sign-in.
  const displayName = user?.signInDetails?.loginId || user?.username;

  const linkClass = (path) =>
    `text-sm font-medium transition-colors ${
      pathname === path
        ? 'text-indigo-400'
        : 'text-gray-400 hover:text-gray-100'
    }`;

  return (
    <nav className="bg-gray-800 border-b border-gray-700 shadow-lg shadow-gray-900/40">
      <div className="max-w-[1100px] mx-auto px-4 md:px-8 py-3 flex items-center justify-between">
        <Link to="/listings" className="text-lg font-bold text-indigo-400 tracking-tight">
          HomeScore AI
        </Link>

        <div className="flex items-center gap-6">
          <Link to="/listings" className={linkClass('/listings')}>My Listings</Link>
          <Link to="/profile" className={linkClass('/profile')}>Profile</Link>

          <div className="flex items-center gap-3 pl-4 border-l border-gray-700">
            {user && (
              <span className="text-sm text-gray-500 hidden sm:block">
                {displayName}
              </span>
            )}
            <button
              onClick={logout}
              className="text-sm font-medium text-gray-400 hover:text-red-400 transition-colors"
            >
              Log out
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
