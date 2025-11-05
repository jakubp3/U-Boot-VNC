import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI, User } from '../api/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      refreshUser();
    } else {
      setLoading(false);
    }
  }, []);

  const refreshUser = async () => {
    try {
      const userData = await authAPI.getCurrentUser();
      setUser(userData);
      setLoading(false);
    } catch (error) {
      console.error('Error refreshing user:', error);
      localStorage.removeItem('token');
      setUser(null);
      setLoading(false);
    }
  };

  const login = async (username: string, password: string) => {
    try {
      const response = await authAPI.login({ username, password });
      if (!response || !response.access_token) {
        throw new Error('Brak tokenu w odpowiedzi serwera');
      }
      console.log('Login successful, storing token');
      localStorage.setItem('token', response.access_token);
      
      // Refresh user data immediately
      try {
        const userData = await authAPI.getCurrentUser();
        console.log('User data refreshed:', userData);
        setUser(userData);
        setLoading(false);
      } catch (userError: any) {
        console.error('Error getting user data:', userError);
        // If getCurrentUser fails, don't fail the login - user can still use the app
        // The token is valid, so we'll set a minimal user object
        setUser({
          id: 0,
          username: username,
          email: '',
          is_admin: false,
          created_at: new Date().toISOString()
        } as User);
        setLoading(false);
      }
    } catch (error: any) {
      console.error('Login error in AuthContext:', error);
      localStorage.removeItem('token');
      setUser(null);
      setLoading(false);
      // Re-throw to let Login component handle the error display
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

