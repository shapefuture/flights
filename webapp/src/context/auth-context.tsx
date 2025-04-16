import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

// Define your auth types
export type AuthMethod = 'GOOGLE' | 'EMAIL';

// Updated user subscription type with monthlyQuota
export interface UserSubscription {
  level: 'free' | 'premium' | 'pro';
  expiresAt: string | null;
  monthlyQuota: number;
  remaining: number;
}

export interface User {
  id: string;
  email: string;
  name: string | null;
  avatar: string | null;
  subscription: UserSubscription | null;
}

// Define context type
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (method: AuthMethod) => Promise<void>;
  signOut: () => Promise<void>;
}

// Create context without default values
const AuthContextInit = createContext<AuthContextType | null>(null);

// Use a custom hook to access the context
export function useAuth() {
  const context = useContext(AuthContextInit);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// The provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const checkSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        
        if (data?.session) {
          // Get user details from your database
          const { data: userData } = await supabase
            .from('users')
            .select('*')
            .eq('id', data.session.user.id)
            .single();
            
          if (userData) {
            setUser({
              id: userData.id,
              email: userData.email,
              name: userData.name,
              avatar: userData.avatar_url,
              subscription: userData.subscription ? {
                level: userData.subscription.level,
                expiresAt: userData.subscription.expires_at,
                monthlyQuota: userData.subscription.monthly_quota || 10, // Default value if missing
                remaining: userData.subscription.remaining
              } : null
            });
          }
        }
      } catch (error) {
        console.error('Auth session check failed', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkSession();
  }, []);

  // Auth methods
  const signIn = async (method: 'GOOGLE' | 'EMAIL') => {
    try {
      if (method === 'GOOGLE') {
        await supabase.auth.signInWithOAuth({ provider: 'google' });
      } else {
        // Implement email sign in logic
      }
    } catch (error) {
      console.error('Sign in failed', error);
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
    } catch (error) {
      console.error('Sign out failed', error);
    }
  };

  // Context value
  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    signIn,
    signOut
  };

  return (
    <AuthContextInit.Provider value={value}>
      {children}
    </AuthContextInit.Provider>
  );
};