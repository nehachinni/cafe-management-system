import { createContext, useContext, useState } from 'react';
import { getUser, isAuthenticated, saveSession, clearSession } from '../services/auth.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getUser());
  const [authenticated, setAuthenticated] = useState(() => isAuthenticated());

  const login = (token, userData) => {
    saveSession(token, userData);
    setUser(userData);
    setAuthenticated(true);
  };

  const logout = () => {
    clearSession();
    setUser(null);
    setAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ user, authenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
