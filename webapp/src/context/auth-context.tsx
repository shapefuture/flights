import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { debug, error as logError } from '../utils/logger';
import { Session, User } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';

// Use TypeScript 'enum' for providers
export enum AuthProvider {
  GOOGLE = 'google',
  EMAIL = 'email'
}

// Subscription
export interface UserSubscription {
  tier: 'free' | 'basic' | 'premium' | 'enterprise';
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete';
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  monthlyQuota: number;
  remainingSearches: number;
}

// Context shape
interface AuthContextType {
  user: User | null;
  session: Session | null;
  status: string;
  isAuthenticated: boolean;
  signInWithGoogle: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  subscription: UserSubscription;
}

const DEFAULT_SUBSCRIPTION: UserSubscription = {
  tier: 'free',
  status: 'active',
  currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  cancelAtPeriodEnd: false,
  monthlyQuota: 5,
  remainingSearches: 5,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');
  const [subscription, setSubscription] = useState<UserSubscription>(DEFAULT_SUBSCRIPTION);
  const navigate = useNavigate();

  useEffect(() => {
    let unsub: (() => void) | undefined;
    let mount = true;
    (async () => {
      setStatus('loading');
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        setStatus('unauthenticated');
        setSession(null);
        setUser(null);
      } else {
        setSession(session);
        setUser(session?.user || null);
        setStatus(session?.user ? 'authenticated' : 'unauthenticated');
      }
      // Set up auth state change listener
      const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange(
        (event, newSession) => {
          setSession(newSession);
          setUser(newSession?.user || null);
          setStatus(newSession?.user ? 'authenticated' : 'unauthenticated');
        }
      );
      unsub = authSub.unsubscribe;
    })();
    return () => { unsub && unsub(); mount = false; };
  }, []);

  // Sign in with Google
  async function signInWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });
  }
  // Sign up with email/password
  async function signUp(email: string, password: string) {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` }
    });
    return { error: error?.message ? new Error(error.message) : null };
  }
  // Sign in with email/password
  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ? new Error(error.message) : null };
  }
  // Sign out
  async function signOut() {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setStatus('unauthenticated');
    navigate('/');
  }

  return (
    <AuthContext.Provider value={{
      user,
      session,
      status,
      isAuthenticated: status === 'authenticated',
      signInWithGoogle,
      signUp,
      signIn,
      signOut,
      subscription,
    }}>
      {children}
    </AuthContext.Provider>
  );
}
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}