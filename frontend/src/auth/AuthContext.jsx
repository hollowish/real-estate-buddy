import { createContext, useContext, useState, useEffect } from 'react';
import { signOut, fetchAuthSession, getCurrentUser } from 'aws-amplify/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { checkSession(); }, []);

  const checkSession = async () => {
    try {
      const session = await fetchAuthSession();
      const currentUser = await getCurrentUser();
      setToken(session.tokens?.accessToken?.toString());
      setUser(currentUser);
    } catch {
      // Not logged in
    } finally { setLoading(false); }
  };

  const login = async () => { await checkSession(); };

  const logout = async () => {
    await signOut();
    setToken(null);
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
