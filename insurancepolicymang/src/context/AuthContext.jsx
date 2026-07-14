import React, { createContext, useState, useEffect, useCallback } from 'react';
import authService from '../services/authService';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initAuth = () => {
      try {
        if (authService.isAuthenticated()) {
          const savedUser = authService.getCurrentUser();
          setUser(savedUser);
        } else {
          // Token exists but is expired/invalid — clear stale data
          authService.logout();
        }
      } catch (err) {
        authService.logout();
      } finally {
        setLoading(false);
      }
    };
    initAuth();
  }, []);

  const login = useCallback(async (credentials) => {
    setLoading(true);
    setError(null);
    try {
      const data = await authService.login(credentials);
      // If MFA is required, return payload without setting user yet
      if (data.mfaRequired) return data;
      setUser(data.user || authService.getCurrentUser());
      return data;
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed. Please try again.';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const verifyMfa = useCallback(async ({ tempToken, totpCode }) => {
    setLoading(true);
    setError(null);
    try {
      const data = await authService.verifyMfa({ tempToken, totpCode });
      setUser(data.user || authService.getCurrentUser());
      return data;
    } catch (err) {
      const message = err.response?.data?.message || 'Invalid code. Please try again.';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (userData) => {
    setLoading(true);
    setError(null);
    try {
      const data = await authService.register(userData);
      // Registration now always returns mfaRequired=true first
      return data;
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed. Please try again.';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
    setError(null);
  }, []);

  const updateUser = useCallback((updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('auth_user', JSON.stringify(updatedUser));
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const value = {
    user,
    loading,
    error,
    isAuthenticated: !!user && authService.isAuthenticated(),
    login,
    verifyMfa,
    register,
    logout,
    updateUser,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
