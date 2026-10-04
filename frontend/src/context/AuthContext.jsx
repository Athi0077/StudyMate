import React, { createContext, useState, useEffect } from 'react';
import api from '../utils/api';
import { initSocket, disconnectSocket } from '../services/socket';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      console.log('[AUTH INIT] starting session restoration');
      try {
        console.log('[AUTH INIT] calling /api/auth/refresh');
        const res = await api.post('/auth/refresh');
        console.log(`[AUTH REFRESH] status: ${res.status}`);
        if (res.data.success) {
          localStorage.setItem('token', res.data.token);
          setToken(res.data.token);
          setCurrentUser(res.data.user);
          setIsAuthenticated(true);
          initSocket(res.data.token);
        }
      } catch (error) {
        if (error.response) {
          console.log(`[AUTH REFRESH] status: ${error.response.status}`);
        } else {
          console.log('[AUTH REFRESH] network error');
        }
        // If refresh fails with 401, clear everything cleanly
        if (error.response && error.response.status === 401) {
          localStorage.removeItem('token');
          setToken(null);
          setCurrentUser(null);
          setIsAuthenticated(false);
          disconnectSocket();
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data.success) {
      localStorage.setItem('token', res.data.token);
      setToken(res.data.token);
      setCurrentUser(res.data.user);
      setIsAuthenticated(true);
      initSocket(res.data.token);
      return res.data;
    }
  };

  const register = async (name, email, password, role, classId) => {
    const res = await api.post('/auth/register', { name, email, password, role, classId });
    if (res.data.success && res.data.token) {
      localStorage.setItem('token', res.data.token);
      setToken(res.data.token);
      setCurrentUser(res.data.user);
      setIsAuthenticated(true);
      initSocket(res.data.token);
    }
    return res.data;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error('Logout error:', err);
    }
    localStorage.removeItem('token');
    setToken(null);
    setCurrentUser(null);
    setIsAuthenticated(false);
    disconnectSocket();
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        token,
        loading,
        isAuthenticated,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
