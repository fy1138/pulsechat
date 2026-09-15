import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('pulse_token'));
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState('');

  // Initial user check
  useEffect(() => {
    const savedUserId = localStorage.getItem('pulse_user_id');
    if (!savedUserId) {
      setCurrentUser(null);
      setIsLoading(false);
      return;
    }

    fetch(`/api/auth/me?userId=${savedUserId}`)
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error('Failed to restore session');
      })
      .then((data) => {
        if (data.success && data.user) {
          setCurrentUser(data.user);
          localStorage.setItem('pulse_user_id', data.user.id);
        } else {
          setCurrentUser(null);
          localStorage.removeItem('pulse_user_id');
          localStorage.removeItem('pulse_token');
        }
      })
      .catch(() => {
        setCurrentUser(null);
        localStorage.removeItem('pulse_user_id');
        localStorage.removeItem('pulse_token');
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (loginId, password) => {
    setAuthError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loginId, username: loginId, password })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      setCurrentUser(data.user);
      setToken(data.token);
      localStorage.setItem('pulse_token', data.token);
      localStorage.setItem('pulse_user_id', data.user.id);
      return data.user;
    } catch (err) {
      setAuthError(err.message);
      throw err;
    }
  }, []);

  const register = useCallback(async ({ name, handle, email, phone, password, avatar, bio }) => {
    setAuthError('');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, handle, email, phone, password, avatar, bio })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      setCurrentUser(data.user);
      setToken(data.token);
      localStorage.setItem('pulse_token', data.token);
      localStorage.setItem('pulse_user_id', data.user.id);
      return data.user;
    } catch (err) {
      setAuthError(err.message);
      throw err;
    }
  }, []);

  const updateProfile = useCallback(async (updates) => {
    if (!currentUser) return;
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, ...updates })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Profile update failed');
      }
      setCurrentUser(data.user);
      return data.user;
    } catch (err) {
      console.warn('Update profile error', err);
      throw err;
    }
  }, [currentUser]);

  const logout = useCallback(() => {
    localStorage.removeItem('pulse_token');
    localStorage.removeItem('pulse_user_id');
    setCurrentUser(null);
    setToken(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        token,
        isLoading,
        authError,
        setAuthError,
        login,
        register,
        logout,
        updateProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
