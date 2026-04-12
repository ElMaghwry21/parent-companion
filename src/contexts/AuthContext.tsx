import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '@/types/parenting';

interface AuthContextType {
  user: User | null;
  login: (name: string, role: UserRole) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: () => {},
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const raw = localStorage.getItem('sp_user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (user) localStorage.setItem('sp_user', JSON.stringify(user));
    else localStorage.removeItem('sp_user');
  }, [user]);

  const login = (name: string, role: UserRole) => {
    setUser({ id: role === 'parent' ? 'parent-1' : 'child-1', name, role });
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
