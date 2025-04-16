import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase, getUserSubscription, UserSubscription } from '../lib/supabase';
import { debug, error, info } from '../utils/logger';

interface AuthContextProps {
  session: Session | null;
  user: User | null;
  subscription: UserSubscription | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, metadata?: object) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  sendPasswordResetEmail: (email: string) => Promise<{ error: Error | null }>;
  loadSubscription: () => Promise<void>;
  updateUser: (data: object) => Promise<{ error: Error | null }>;
  isAuthenticated: boolean;
  canPerformSearch: boolean;
  remainingQueries: number;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Check if the user can perform a search based on subscription status
  const canPerformSearch = !subscription ? false : 
    subscription.queriesUsed < subscription.monthlyQuota;
  
  // Calculate remaining queries
  const remainingQueries = subscription ? 
    Math.max(0, subscription.monthlyQuota - subscription.queriesUsed) : 0;
  
  // Load the user's subscription data
  const loadSubscription = async () => {
    if (!user) return;
    
    try {
      const sub = await getUserSubscription(user.id);
      setSubscription(sub);
    } catch (err) {
      error('Failed to load user subscription:', err);
    }
  };

  // Initialize the auth context
  useEffect(() => {
    const initAuth = async () => {
      try {
        setIsLoading(true);
        
        // Get the current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw sessionError;
        }
        
        if (session) {
          setSession(session);
          setUser(session.user);
          await loadSubscription();
          info('User authenticated:', session.user.id);
        }
      } catch (err) {
        error('Error initializing auth:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        debug('Auth state changed:', event);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await loadSubscription();
        } else {
          setSubscription(null);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        error('Sign in error:', signInError);
        return { error: signInError };
      }

      info('User signed in successfully');
      return { error: null };
    } catch (err) {
      error('Sign in exception:', err);
      return { error: err instanceof Error ? err : new Error('Unknown sign in error') };
    }
  };

  // Sign up with email and password
  const signUp = async (email: string, password: string, metadata = {}) => {
    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata
        }
      });

      if (signUpError) {
        error('Sign up error:', signUpError);
        return { error: signUpError };
      }

      info('User signed up successfully');
      return { error: null };
    } catch (err) {
      error('Sign up exception:', err);
      return { error: err instanceof Error ? err : new Error('Unknown sign up error') };
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      info('User signed out');
    } catch (err) {
      error('Sign out error:', err);
    }
  };

  // Send password reset email
  const sendPasswordResetEmail = async (email: string) => {
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email);
      
      if (resetError) {
        error('Password reset error:', resetError);
        return { error: resetError };
      }
      
      info('Password reset email sent');
      return { error: null };
    } catch (err) {
      error('Password reset exception:', err);
      return { error: err instanceof Error ? err : new Error('Unknown password reset error') };
    }
  };

  // Update user data
  const updateUser = async (data: object) => {
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        data
      });
      
      if (updateError) {
        error('Update user error:', updateError);
        return { error: updateError };
      }
      
      info('User updated successfully');
      return { error: null };
    } catch (err) {
      error('Update user exception:', err);
      return { error: err instanceof Error ? err : new Error('Unknown update user error') };
    }
  };

  const value = {
    session,
    user,
    subscription,
    isLoading,
    signIn,
    signUp,
    signOut,
    sendPasswordResetEmail,
    loadSubscription,
    updateUser,
    isAuthenticated: !!user,
    canPerformSearch,
    remainingQueries
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};