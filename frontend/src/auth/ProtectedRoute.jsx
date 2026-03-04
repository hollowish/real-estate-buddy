import { useAuth } from './AuthContext';

export default function ProtectedRoute({ children }) {
  const { token, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        color: 'var(--text-muted)',
        fontSize: '0.95rem',
      }}>
        Loading…
      </div>
    );
  }

  if (!token) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        gap: '1rem',
        textAlign: 'center',
        padding: '2rem',
      }}>
        <span style={{ fontSize: '2.5rem' }}>🔒</span>
        <h2 style={{ color: 'var(--text-primary)', margin: 0 }}>Sign in to continue</h2>
        <p style={{ color: 'var(--text-secondary)', margin: 0, maxWidth: '320px' }}>
          Use the <strong style={{ color: 'var(--gold)' }}>Login</strong> button in the top-right corner to access this page.
        </p>
      </div>
    );
  }

  return children;
}
