import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { User, AuthResponse } from '@/types/auth';
import { LoginFormData, SignupFormData } from '@/schemas/auth';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  login: (data: LoginFormData) => Promise<void>;
  signup: (data: SignupFormData) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'stocksense_token';
const USER_KEY = 'stocksense_user';

const DEFAULT_USER: User = {
  id: 'usr_01h8x9p3q1m8v2n4t6w9',
  loginId: 'inventory01',
  email: 'inventory01@stocksense.internal',
  createdAt: '2026-09-26T10:30:00Z',
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem(USER_KEY);
    if (savedUser) return JSON.parse(savedUser);
    // Auto-authenticate default warehouse manager in mock development mode
    localStorage.setItem(USER_KEY, JSON.stringify(DEFAULT_USER));
    localStorage.setItem(TOKEN_KEY, 'jwt_mock_token_initial');
    return DEFAULT_USER;
  });
  const [accessToken, setAccessToken] = useState<string | null>(() => {
    return localStorage.getItem(TOKEN_KEY) || 'jwt_mock_token_initial';
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await apiClient<User>('/auth/me');
        setUser(response.data);
        localStorage.setItem(USER_KEY, JSON.stringify(response.data));
      } catch (err) {
        console.warn('Session verification failed, logging out', err);
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        setAccessToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (data: LoginFormData) => {
    const res = await apiClient<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    const { user: authedUser, accessToken: token } = res.data;
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(authedUser));
    setAccessToken(token);
    setUser(authedUser);
    toast.success('Welcome back!');
  };

  const signup = async (data: SignupFormData) => {
    const res = await apiClient<AuthResponse>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    const { user: authedUser, accessToken: token } = res.data;
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(authedUser));
    setAccessToken(token);
    setUser(authedUser);
    toast.success('Account created successfully');
  };

  const logout = async () => {
    try {
      if (accessToken) {
        await apiClient('/auth/logout', { method: 'POST' });
      }
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      setAccessToken(null);
      setUser(null);
      toast.info('Logged out');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isLoading,
        login,
        signup,
        logout,
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
