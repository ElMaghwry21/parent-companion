import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';

export type UserRole = 'parent' | 'child';

export interface AppUser {
  id: string;
  name: string;
  role: UserRole;
}

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string, role: UserRole) => Promise<string | null>;
  signIn: (email: string, password: string) => Promise<string | null>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signUp: async () => null,
  signIn: async () => null,
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

async function fetchProfile(userId: string): Promise<AppUser | null> {
  const { data } = await supabase
    .from('profiles')
    .select('name, role')
    .eq('user_id', userId)
    .single();
  if (!data) return null;
  return { id: userId, name: data.name, role: data.role as UserRole };
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const profile = await fetchProfile(session.user.id);
        setUser(profile);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const profile = await fetchProfile(session.user.id);
        setUser(profile);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, name: string, role: UserRole): Promise<string | null> => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, role } },
    });
    return error?.message || null;
  };

  const signIn = async (email: string, password: string): Promise<string | null> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error?.message || null;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
