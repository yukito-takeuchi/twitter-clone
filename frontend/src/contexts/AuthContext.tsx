'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User as FirebaseUser,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { userApi } from '@/lib/api';
import type { User } from '@/types';

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  user: User | null;
  loading: boolean;
  signup: (email: string, password: string, username: string, displayName: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setFirebaseUser(firebaseUser);

      if (firebaseUser) {
        try {
          // Get user data from backend using Firebase UID
          const userData = await userApi.getByFirebaseUid(firebaseUser.uid);
          console.log('[AuthContext] User data fetched:', {
            id: userData.user.id,
            firebase_uid: userData.user.firebase_uid,
            username: userData.user.username,
            avatar_url: userData.profile?.avatar_url,
          });
          // Merge avatar_url from profile into user object
          const userWithAvatar = {
            ...userData.user,
            avatar_url: userData.profile?.avatar_url || null
          };
          setUser(userWithAvatar);
        } catch (error) {
          console.error('Failed to fetch user data:', error);
          setUser(null);
        }
      } else {
        setUser(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signup = async (email: string, password: string, username: string, displayName: string) => {
    // Create Firebase user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

    // Create user in backend
    const user = await userApi.create({
      firebase_uid: firebaseUser.uid,
      email,
      username,
      display_name: displayName,
    });

    console.log('[AuthContext] User created:', {
      id: user.id,
      firebase_uid: user.firebase_uid,
      username: user.username,
    });
    setUser(user);
  };

  const login = async (email: string, password: string) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

    // Fetch user data from backend using Firebase UID
    const userData = await userApi.getByFirebaseUid(firebaseUser.uid);
    console.log('[AuthContext] User logged in:', {
      id: userData.user.id,
      firebase_uid: userData.user.firebase_uid,
      username: userData.user.username,
    });
    setUser(userData.user);
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
  };

  const value: AuthContextType = {
    firebaseUser,
    user,
    loading,
    signup,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
