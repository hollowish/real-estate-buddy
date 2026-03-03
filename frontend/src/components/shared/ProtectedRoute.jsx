// Student A (with Student D) — Redirects to /login if no valid JWT token exists
// TODO: Implement using Cognito JWT validation

export default function ProtectedRoute({ children }) {
  return <>{children}</>;
}
