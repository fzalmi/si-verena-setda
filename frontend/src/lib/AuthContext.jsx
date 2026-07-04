import React, { createContext, useState, useContext, useEffect } from 'react';
import { api } from '@/api/client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setIsLoadingAuth(false);
      return;
    }

    try {
      const userData = await api.me();
      setUser(userData);
      setIsAuthenticated(true);
      setAuthError(null);
    } catch (error) {
      localStorage.removeItem('auth_token');
      setAuthError({ type: 'auth_required' });
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const login = async (email, password) => {
    const { token, user: userData } = await api.login(email, password);
    api.setToken(token);
    setUser(userData);
    setIsAuthenticated(true);
    setAuthError(null);
    return userData;
  };

  const register = async (data) => {
    return api.register(data);
  };

  const logout = () => {
    api.setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    setAuthError(null);
    window.location.href = '/login';
  };

  const updateUser = (userData) => {
    setUser(prev => ({ ...prev, ...userData }));
  };

  const navigateToLogin = () => {
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      login,
      register,
      logout,
      checkAuth,
      updateUser,
      navigateToLogin,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export default AuthContext;
