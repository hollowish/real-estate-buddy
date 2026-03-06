// Shared page layout — Navbar + content area
import Navbar from './Navbar';

export default function Layout({ children }) {
  return (
    <div style={{ minHeight: '100vh', background: '#111827' }}>
      <Navbar />
      <main style={{
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        paddingTop: '2rem',
        paddingBottom: '3rem',
        boxSizing: 'border-box',
      }}>
        <div style={{
          width: '100%',
          maxWidth: '1100px',
          padding: '0 2rem',
          boxSizing: 'border-box',
        }}>
          {children}
        </div>
      </main>
    </div>
  );
}