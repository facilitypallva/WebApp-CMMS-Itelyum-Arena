import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { setRememberSession } from '@/lib/authStorage';
import { AppRole, UserProfile } from '@/types';
import { withRequestTimeout } from '@/lib/resilientRequest';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  role: AppRole;
  loading: boolean;
  isAdmin: boolean;
  isActive: boolean;
  refreshProfile: () => Promise<void>;
  signIn: (email: string, password: string, rememberSession?: boolean) => Promise<{ error: Error | null }>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fallbackRole = ((user?.app_metadata?.role ?? '') as string).toUpperCase() as AppRole | '';
  const role = profile?.role ?? (fallbackRole || 'LETTURA');
  const isAdmin = role === 'ADMIN';
  const isActive = profile?.is_active ?? true;

  const loadProfile = async (nextUser: User | null) => {
    if (!nextUser) {
      setProfile(null);
      return;
    }

    try {
      const { data, error } = await withRequestTimeout(
        () => supabase
          .from('profiles')
          .select('*')
          .eq('id', nextUser.id)
          .maybeSingle(),
        8_000,
        'Timeout durante il caricamento del profilo utente'
      );

      if (error) {
        throw error;
      }

      setProfile((data as UserProfile | null) ?? null);
    } catch (error) {
      console.error('Profile load failed', error);
      setProfile(null);
    }
  };

  useEffect(() => {
    let mounted = true;

    const applySession = async (nextSession: Session | null) => {
      if (!mounted) return;

      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      await loadProfile(nextSession?.user ?? null);
    };

    void withRequestTimeout(
      () => supabase.auth.getSession(),
      8_000,
      'Timeout durante il recupero della sessione utente'
    )
      .then(async ({ data: { session } }) => {
        await applySession(session);
      })
      .catch((error) => {
        console.error('Session bootstrap failed', error);
        if (!mounted) return;
        setSession(null);
        setUser(null);
        setProfile(null);
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      void applySession(nextSession).catch((error) => {
        console.error('Auth state sync failed', error);
      });
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!loading && user && profile && !profile.is_active) {
      void supabase.auth.signOut();
    }
  }, [loading, profile, user]);

  const refreshProfile = async () => {
    await loadProfile(user);
  };

  const signIn = async (email: string, password: string, rememberSession = true) => {
    setRememberSession(rememberSession);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const resetPassword = async (email: string) => {
    const redirectTo = `${window.location.origin}/reset-password`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    return { error };
  };

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, role, loading, isAdmin, isActive, refreshProfile, signIn, resetPassword, updatePassword, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
