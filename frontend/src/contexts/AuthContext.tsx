"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  updateProfile as updateFirebaseProfile
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { UserProfile } from '../types';

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  error: string | null;
  signup: (email: string, password: string, name: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  getIdToken: () => Promise<string | null>;
  refreshProfile: () => Promise<void>;
  setError: (msg: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get current environment API URL
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';

  // Helper to fetch user profile from Backend Express Service
  const fetchProfileFromBackend = async (firebaseUser: User) => {
    try {
      const token = await firebaseUser.getIdToken();
      const response = await fetch(`${apiBaseUrl}/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const resData = await response.json();
      if (resData.success) {
        setUserProfile(resData.data);
      } else {
        console.warn('Backend profile fetch failed, using fallback client parameters.');
        setUserProfile({
          uid: firebaseUser.uid,
          name: firebaseUser.displayName || 'Developer',
          email: firebaseUser.email || '',
          photoURL: firebaseUser.photoURL,
          role: 'user',
          totalAnalyses: 0,
          createdAt: null,
          updatedAt: null
        });
      }
    } catch (err) {
      console.error('Network error fetching backend profile:', err);
    }
  };

  const refreshProfile = async () => {
    if (currentUser) {
      await fetchProfileFromBackend(currentUser);
    }
  };

  const getIdToken = async (): Promise<string | null> => {
    if (!currentUser) return null;
    return currentUser.getIdToken();
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setError(null);
      if (user) {
        setCurrentUser(user);
        await fetchProfileFromBackend(user);
      } else {
        setCurrentUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signup = async (email: string, password: string, name: string) => {
    setLoading(true);
    setError(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // Set display name in Firebase auth
      await updateFirebaseProfile(userCredential.user, { displayName: name });
      
      // Initialize profile on Express backend
      await fetchProfileFromBackend(userCredential.user);
    } catch (err: any) {
      console.error('Auth signup failed:', err);
      let friendlyMessage = 'Sign up failed. Please try again.';
      if (err.code === 'auth/email-already-in-use') {
        friendlyMessage = 'This email address is already in use.';
      } else if (err.code === 'auth/weak-password') {
        friendlyMessage = 'The password is too weak. Must be at least 6 characters.';
      } else if (err.code === 'auth/invalid-email') {
        friendlyMessage = 'The email address format is invalid.';
      }
      setError(friendlyMessage);
      throw new Error(friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await fetchProfileFromBackend(userCredential.user);
    } catch (err: any) {
      console.error('Auth login failed:', err);
      let friendlyMessage = 'Invalid email or password.';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        friendlyMessage = 'Incorrect email address or password.';
      } else if (err.code === 'auth/too-many-requests') {
        friendlyMessage = 'Too many failed login attempts. Account temporarily locked.';
      }
      setError(friendlyMessage);
      throw new Error(friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    setError(null);
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Auth logout failed:', err);
      setError('Failed to log out. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    setError(null);
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (err: any) {
      console.error('Password reset failed:', err);
      let friendlyMessage = 'Failed to send password reset email.';
      if (err.code === 'auth/user-not-found') {
        friendlyMessage = 'No user account found with this email address.';
      }
      setError(friendlyMessage);
      throw new Error(friendlyMessage);
    }
  };

  const value = {
    currentUser,
    userProfile,
    loading,
    error,
    signup,
    login,
    logout,
    resetPassword,
    getIdToken,
    refreshProfile,
    setError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
