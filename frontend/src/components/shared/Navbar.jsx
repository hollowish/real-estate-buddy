// Shared navigation bar — logo, nav links, logout
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();

  const displayName = user?.signInDetails?.loginId || user?.username;

  const linkClass = (path) =>
    `text-sm font-medium transition-colors ${
      pathname === path
        ? 'text-[var(--gold)]'
        : 'text-[var(--text-secondary)] hover:text-white'
    }`;

  return (
    <nav className="bg-[var(--bg-secondary)] border-b border-[var(--border)] shadow-lg shadow-black/40">
      <div className="page-container py-3 flex items-center justify-between">
        <Link to="/listings" className="text-lg font-bold text-[var(--gold)] tracking-tight">
          HomeScore AI
        </Link>

        <div className="flex items-center gap-6">
          <Link to="/listings" className={linkClass('/listings')}>My Listings</Link>
          <Link to="/profile" className={linkClass('/profile')}>Profile</Link>

          <div className="flex items-center gap-3 pl-4 border-l border-[var(--border)]">
            {user && (
              <span className="text-sm text-[var(--text-muted)] hidden sm:block">
                {displayName}
              </span>
            )}
            <button onClick={logout} className="btn-ghost btn-sm">
              Log out
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
