import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import { auth, googleAuthProvider } from '../lib/firebase.ts';

interface AuthContextValue {
  firebaseUser: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  authError: string | null;
  signInWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, password?: string) => Promise<void>;
  signupWithProfile: (payload: Record<string, any>) => Promise<void>;
  enterWorkspaceAs: (persona?: 'STUDENT' | 'ADMIN' | 'ORGANIZATION') => void;
  logout: () => Promise<void>;
  authFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  // Token kept strictly in memory per Cloud SQL & Firebase Auth guidelines
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const idToken = await user.getIdToken();
          setFirebaseUser(user);
          setToken(idToken);
          setIsAuthenticated(true);
        } catch (err) {
          console.error('Failed to retrieve ID token:', err);
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    setAuthError(null);
    try {
      const result = await signInWithPopup(auth, googleAuthProvider);
      const idToken = await result.user.getIdToken();
      setFirebaseUser(result.user);
      setToken(idToken);
      setIsAuthenticated(true);
    } catch (error: any) {
      console.warn('Google popup sign-in notice:', error?.code || error?.message);
      setAuthError('Google popup was blocked in this preview window. Please sign in with your email address or create a new account.');
    }
  };

  const loginWithEmail = async (email: string, password?: string) => {
    setAuthError(null);
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to sign in with email.');
    }
    setFirebaseUser(null);
    setToken(data.token);
    setIsAuthenticated(true);
  };

  const signupWithProfile = async (payload: Record<string, any>) => {
    setAuthError(null);
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to create account.');
    }
    setFirebaseUser(null);
    setToken(data.token);
    setIsAuthenticated(true);
  };

  const enterWorkspaceAs = (persona: 'STUDENT' | 'ADMIN' | 'ORGANIZATION' = 'STUDENT') => {
    setAuthError(null);
    if (persona === 'ADMIN') {
      setToken('demo-session:demo-admin-uid:kartikchoudhary18122005@gmail.com:Kartik%20Choudhary');
    } else if (persona === 'ORGANIZATION') {
      setToken('demo-session:demo-org-uid:recruiting@stripe.com:Stripe%20University%20Recruiting');
    } else {
      setToken('demo-session:peer-priya-sharma:priya.sharma@iitd.ac.in:Priya%20Sharma');
    }
    setIsAuthenticated(true);
  };

  const logout = async () => {
    try {
      if (firebaseUser) {
        await signOut(auth);
      }
    } catch (err) {
      console.error('Sign out error:', err);
    }
    setFirebaseUser(null);
    setToken(null);
    setIsAuthenticated(false);
  };

  const authFetch = useCallback(
    async (url: string, options: RequestInit = {}) => {
      let activeToken = token;
      if (firebaseUser) {
        try {
          activeToken = await firebaseUser.getIdToken();
        } catch {
          // keep current token
        }
      }
      const headers = new Headers(options.headers || {});
      if (activeToken) {
        headers.set('Authorization', `Bearer ${activeToken}`);
      }
      if (!headers.has('Content-Type') && options.body) {
        headers.set('Content-Type', 'application/json');
      }
      return fetch(url, {
        ...options,
        headers,
      });
    },
    [token, firebaseUser]
  );

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        token,
        isAuthenticated,
        loading,
        authError,
        signInWithGoogle,
        loginWithEmail,
        signupWithProfile,
        enterWorkspaceAs,
        logout,
        authFetch,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
