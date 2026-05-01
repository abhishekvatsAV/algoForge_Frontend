import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
// import { BACKEND_URL } from '../config';
const BACKEND_URL = process.env.BACKEND_URL;
const GUEST_EMAIL = 'guest@user.com';
const GUEST_PASSWORD = 'guest@123';
interface User {
  id: number;
  email: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isLoginModalOpen: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  guestLogin: () => Promise<void>;
  logout: () => void;
  openLoginModal: () => void;
  closeLoginModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to parse JWT
const parseJwt = (token: string): User | null => {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        const payload = JSON.parse(jsonPayload);
        return { id: payload.id, email: payload.email };
    } catch (error) {
        console.error("Failed to parse JWT", error);
        return null;
    }
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('authToken');
      if (storedToken) {
        setToken(storedToken);
        const decodedUser = parseJwt(storedToken);
        setUser(decodedUser);
      }
    } catch (error) {
      console.error("Could not load auth token from storage", error);
      localStorage.removeItem('authToken');
    } finally {
        setIsLoading(false);
    }
  }, []);

  const handleAuthSuccess = (newToken: string) => {
    setToken(newToken);
    const decodedUser = parseJwt(newToken);
    setUser(decodedUser);
    localStorage.setItem('authToken', newToken);
    closeLoginModal();
  };
  
  const login = async (email: string, password: string) => {
    const response = await fetch(`${BACKEND_URL}/user/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Login failed');
    }
    handleAuthSuccess(data.token);
  };
  
  const signup = async (email: string, password: string) => {
    const response = await fetch(`${BACKEND_URL}/user/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Signup failed');
    }
    handleAuthSuccess(data.token);
  };
  
  const guestLogin = async () => {
    try {
      await login(GUEST_EMAIL, GUEST_PASSWORD);
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      const shouldCreateGuest =
        message.toLowerCase().includes('does not exists') ||
        message.toLowerCase().includes('not found');

      if (!shouldCreateGuest) {
        throw error;
      }

      // Self-heal for fresh deployments where guest account is not created yet.
      await signup(GUEST_EMAIL, GUEST_PASSWORD);
    }
  };

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('authToken');
  }, []);
  
  const openLoginModal = () => setIsLoginModalOpen(true);
  const closeLoginModal = () => setIsLoginModalOpen(false);

  return (
    <AuthContext.Provider value={{ 
        user, 
        token,
        isAuthenticated: !!token,
        isLoading, 
        isLoginModalOpen,
        login, 
        signup,
        guestLogin,
        logout,
        openLoginModal,
        closeLoginModal,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};