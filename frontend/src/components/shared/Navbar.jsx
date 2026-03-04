import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { signIn, confirmSignIn } from 'aws-amplify/auth';
import { useAuth } from '../../auth/AuthContext';

// ─── NAV LINKS ──────────────────────────────────────────────────────────────
// Add, remove, or reorder entries here to update the navigation menu.
// Set authRequired: true to hide a link from unauthenticated users.
const NAV_LINKS = [
  { label: 'Listings',    to: '/listings',     authRequired: false },
  { label: 'Add Listing', to: '/listings/new', authRequired: true  },
  { label: 'Profile',     to: '/profile',      authRequired: true  },
  // { label: 'Dashboard', to: '/dashboard',   authRequired: true  }, // future
  // { label: 'About',     to: '/about',        authRequired: false }, // future
];

// ─── STYLES ─────────────────────────────────────────────────────────────────
const S = {
  nav: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.75rem 2rem',
    background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
    color: 'white',
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
    position: 'sticky',
    top: 0,
    zIndex: 1000,
    gap: '1rem',
  },
  logo: {
    color: 'var(--gold)',
    textDecoration: 'none',
    fontSize: '1.4rem',
    fontWeight: '900',
    letterSpacing: '1px',
    flexShrink: 0,
  },
  logoAccent: { color: 'white' },
  searchForm: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    flex: 1,
    maxWidth: '320px',
  },
  searchInput: {
    padding: '0.45rem 1rem',
    borderRadius: '25px',
    border: 'none',
    outline: 'none',
    width: '100%',
    background: 'rgba(255,255,255,0.1)',
    color: 'white',
    fontSize: '0.9rem',
  },
  searchBtn: {
    padding: '0.45rem 1rem',
    borderRadius: '25px',
    border: 'none',
    background: 'var(--gold)',
    color: '#0a0e1a',
    cursor: 'pointer',
    fontWeight: 'bold',
    flexShrink: 0,
  },
  rightSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem',
    position: 'relative',
  },
  navLink: (active) => ({
    color: active ? 'var(--gold)' : 'white',
    textDecoration: 'none',
    fontWeight: '600',
    fontSize: '0.95rem',
    borderBottom: active ? '2px solid var(--gold)' : '2px solid transparent',
    paddingBottom: '2px',
    transition: 'color 0.2s',
  }),
  username: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: '0.85rem',
  },
  logoutBtn: {
    padding: '0.45rem 1.25rem',
    borderRadius: '25px',
    border: '2px solid var(--gold)',
    background: 'transparent',
    color: 'var(--gold)',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontSize: '0.9rem',
  },
  loginBtn: {
    padding: '0.45rem 1.25rem',
    borderRadius: '25px',
    background: 'var(--gold)',
    color: '#0a0e1a',
    border: 'none',
    fontWeight: 'bold',
    fontSize: '0.9rem',
    cursor: 'pointer',
  },
  // ── Login dropdown ────────────────────────────────────────────────────────
  dropdown: {
    position: 'absolute',
    top: 'calc(100% + 0.75rem)',
    right: 0,
    background: '#16213e',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '12px',
    padding: '1.5rem',
    width: '280px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  dropdownTitle: {
    color: 'white',
    fontWeight: '700',
    fontSize: '1.1rem',
    marginBottom: '0.25rem',
  },
  dropdownInput: {
    padding: '0.6rem 1rem',
    borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.15)',
    background: 'rgba(255,255,255,0.07)',
    color: 'white',
    fontSize: '0.9rem',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  },
  dropdownSubmit: {
    padding: '0.65rem',
    borderRadius: '8px',
    border: 'none',
    background: 'var(--gold)',
    color: '#0a0e1a',
    fontWeight: 'bold',
    fontSize: '0.95rem',
    cursor: 'pointer',
    marginTop: '0.25rem',
  },
  dropdownError: {
    color: '#ff6b6b',
    fontSize: '0.82rem',
    margin: 0,
  },
  dropdownHint: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: '0.8rem',
    margin: 0,
  },
  dropdownLink: {
    color: 'var(--gold)',
    fontSize: '0.85rem',
    textAlign: 'center',
    textDecoration: 'none',
  },
};

// ─── LOGIN DROPDOWN ──────────────────────────────────────────────────────────
function LoginDropdown({ onClose }) {
  const { login } = useAuth();
  const [step, setStep] = useState('credentials'); // 'credentials' | 'mfa'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCredentials = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await signIn({ username: email, password });
      if (result.nextStep.signInStep === 'CONFIRM_SIGN_IN_WITH_TOTP_CODE') {
        setStep('mfa');
      } else if (result.isSignedIn) {
        await login();
        onClose();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMFA = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await confirmSignIn({ challengeResponse: mfaCode });
      if (result.isSignedIn) {
        await login();
        onClose();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={S.dropdown}>
      {step === 'credentials' ? (
        <form onSubmit={handleCredentials} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <p style={S.dropdownTitle}>Sign in</p>
          {error && <p style={S.dropdownError}>{error}</p>}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={S.dropdownInput}
            required
            autoFocus
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={S.dropdownInput}
            required
          />
          <button type="submit" style={S.dropdownSubmit} disabled={loading}>
            {loading ? 'Signing in…' : 'Log In'}
          </button>
          <Link to="/signup" style={S.dropdownLink} onClick={onClose}>
            No account? Sign up
          </Link>
        </form>
      ) : (
        <form onSubmit={handleMFA} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <p style={S.dropdownTitle}>Two-factor code</p>
          <p style={S.dropdownHint}>Enter the 6-digit code from your authenticator app.</p>
          {error && <p style={S.dropdownError}>{error}</p>}
          <input
            type="text"
            placeholder="000000"
            value={mfaCode}
            onChange={(e) => setMfaCode(e.target.value)}
            style={{ ...S.dropdownInput, letterSpacing: '0.3em', textAlign: 'center' }}
            maxLength={6}
            required
            autoFocus
          />
          <button type="submit" style={S.dropdownSubmit} disabled={loading}>
            {loading ? 'Verifying…' : 'Verify'}
          </button>
          <button
            type="button"
            onClick={() => { setStep('credentials'); setError(''); }}
            style={{ ...S.dropdownLink, background: 'none', border: 'none', cursor: 'pointer' }}
          >
            ← Back
          </button>
        </form>
      )}
    </div>
  );
}

// ─── NAVBAR ──────────────────────────────────────────────────────────────────
export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [search, setSearch] = useState('');
  const [showLogin, setShowLogin] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!showLogin) return;
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowLogin(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showLogin]);

  // Close dropdown on route change
  useEffect(() => {
    setShowLogin(false);
  }, [location.pathname]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) {
      // TODO: connect to backend search / filter endpoint
      navigate(`/listings?search=${encodeURIComponent(search.trim())}`);
    }
  };

  const visibleLinks = NAV_LINKS.filter((link) => !link.authRequired || user);

  return (
    <nav style={S.nav}>

      {/* ── Logo ──────────────────────────────────────────────── */}
      <Link to="/" style={S.logo}>
        🏠 RealEstate<span style={S.logoAccent}>Buddy</span>
      </Link>

      {/* ── Search bar ────────────────────────────────────────── */}
      {/* TODO: wire up to backend search endpoint */}
      <form onSubmit={handleSearch} style={S.searchForm}>
        <input
          type="text"
          placeholder="Search listings..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={S.searchInput}
        />
        <button type="submit" style={S.searchBtn}>Search</button>
      </form>

      {/* ── Nav links + auth ──────────────────────────────────── */}
      <div style={S.rightSection} ref={dropdownRef}>

        {visibleLinks.map(({ label, to }) => (
          <Link
            key={to}
            to={to}
            style={S.navLink(location.pathname === to)}
          >
            {label}
          </Link>
        ))}

        {/* ── Auth area ─────────────────────────────────────── */}
        {user ? (
          <>
            {/* TODO: make username a link to /profile */}
            <span style={S.username}>
              {user.username ?? user.signInDetails?.loginId ?? 'User'}
            </span>
            <button onClick={logout} style={S.logoutBtn}>Logout</button>
          </>
        ) : (
          <button
            onClick={() => setShowLogin((prev) => !prev)}
            style={S.loginBtn}
          >
            Login
          </button>
        )}

        {/* ── Login dropdown ────────────────────────────────── */}
        {showLogin && !user && (
          <LoginDropdown onClose={() => setShowLogin(false)} />
        )}

      </div>
    </nav>
  );
}
