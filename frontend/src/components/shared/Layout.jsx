// Shared page layout — Navbar + content area
import Navbar from './Navbar';

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <Navbar />
      <main className="w-full flex justify-center pt-8 pb-12">
        <div className="page-container">
          {children}
        </div>
      </main>
    </div>
  );
}
