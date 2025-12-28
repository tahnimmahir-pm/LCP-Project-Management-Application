import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type User = Database['public']['Tables']['users']['Row'];

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, userData: SignUpData) => Promise<{ success: boolean; error?: string }>;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

interface SignUpData {
  full_name: string;
  role: string;
  department: string;
  phone?: string;
  line_manager_id?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_KEY = 'lcp_user_session';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    const sessionData = localStorage.getItem(SESSION_KEY);
    if (sessionData) {
      try {
        const userData = JSON.parse(sessionData);
        const { data } = await supabase
          .from('users')
          .select('*')
          .eq('id', userData.id)
          .maybeSingle();

        if (data) {
          setUser(data);
        } else {
          localStorage.removeItem(SESSION_KEY);
          setUser(null);
        }
      } catch (error) {
        localStorage.removeItem(SESSION_KEY);
        setUser(null);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const signUp = async (email: string, password: string, userData: SignUpData) => {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: userData.full_name,
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('No user returned from signup');

      const { error: dbError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email,
          password_hash: 'managed_by_supabase',
          full_name: userData.full_name,
          role: userData.role as any,
          department: userData.department,
          phone: userData.phone,
          line_manager_id: userData.line_manager_id,
          status: 'Pending'
        });

      if (dbError) throw dbError;

      await supabase.auth.signOut();

      return { success: true };
    } catch (error: any) {
      console.error('Signup error:', error);
      return { success: false, error: error.message };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .maybeSingle();

      if (userError) throw userError;
      if (!userData) throw new Error('User data not found');

      if (userData.status !== 'Active') {
        await supabase.auth.signOut();
        if (userData.status === 'Pending') {
          throw new Error('Your account is pending approval. Please wait for your manager to approve your registration.');
        } else if (userData.status === 'Rejected') {
          throw new Error('Your account has been rejected. Please contact your manager.');
        } else {
          throw new Error('Your account is inactive. Please contact support.');
        }
      }

      await supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', data.user.id);

      localStorage.setItem(SESSION_KEY, JSON.stringify(userData));
      setUser(userData);

      return { success: true };
    } catch (error: any) {
      console.error('Sign in error:', error);
      return { success: false, error: error.message };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut, refreshUser }}>
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
