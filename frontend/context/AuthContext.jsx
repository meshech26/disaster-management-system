import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { storage } from '../utils/storage';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await storage.getItem('auth_token');
      const storedUser = await storage.getItem('auth_user');

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (e) {
      console.warn('Failed loading stored auth credentials:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (identifier, password) => {
    setIsLoading(true);
    try {
      const payload = identifier.includes('@')
        ? { email: identifier, password }
        : { username: identifier, password };
      const res = await authService.login(payload);
      const { user: userData, token: jwtToken } = res.data;

      setUser(userData);
      setToken(jwtToken);
      await storage.setItem('auth_token', jwtToken);
      await storage.setItem('auth_user', JSON.stringify(userData));
      return userData;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data) => {
    setIsLoading(true);
    try {
      const res = await authService.register(data);
      const { user: userData, token: jwtToken } = res.data;

      setUser(userData);
      setToken(jwtToken);
      await storage.setItem('auth_token', jwtToken);
      await storage.setItem('auth_user', JSON.stringify(userData));
      return userData;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setUser(null);
    setToken(null);
    await storage.removeItem('auth_token');
    await storage.removeItem('auth_user');
  };

  const updateLocation = async (lat, lon, address) => {
    try {
      const res = await authService.updateLocation(lat, lon, address);
      if (user) {
        const updated = {
          ...user,
          lastKnownLocation: {
            coordinates: [lon, lat],
            address: address || res.data?.address
          }
        };
        setUser(updated);
        await storage.setItem('auth_user', JSON.stringify(updated));
      }
    } catch (err) {
      console.warn('Failed to update location on server:', err);
    }
  };

  const switchRoleDemo = (role) => {
    if (user) {
      const updated = { ...user, role };
      setUser(updated);
      storage.setItem('auth_user', JSON.stringify(updated));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        updateLocation,
        switchRoleDemo
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
