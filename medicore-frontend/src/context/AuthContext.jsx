import { createContext, useContext, useState, useEffect } from 'react';
import { StorageManager } from '../utils/constants';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize from localStorage on mount
  useEffect(() => {
    const storedUser = StorageManager.getUser();
    const storedToken = StorageManager.getToken();
    
    if (storedUser && storedToken) {
      setUser(storedUser);
      setToken(storedToken);
    }
    
    setLoading(false);
  }, []);

  const login = (userData, accessToken) => {
    StorageManager.setUser(userData);
    StorageManager.setToken(accessToken);
    StorageManager.setRole(userData.role);
    setUser(userData);
    setToken(accessToken);
  };

  const logout = () => {
    StorageManager.clearAll();
    setUser(null);
    setToken(null);
  };

  const isAuthenticated = !!token && !!user;

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
