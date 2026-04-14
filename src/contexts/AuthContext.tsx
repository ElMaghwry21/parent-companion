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
  try {
    // Add a strict 4s timeout to the database call
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('DB Timeout')), 4000));
    const fetchPromise = supabase
      .from('profiles')
      .select('name, role')
      .eq('user_id', userId)
      .single();

    const { data } = await Promise.race([fetchPromise, timeoutPromise]) as any;
    if (!data) return null;
    return { id: userId, name: data.name, role: data.role as UserRole };
  } catch (err) {
    console.error("Profile fetch failed or timed out:", err);
    return null;
  }
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const safetyTimeout = setTimeout(() => {
      if (mounted) setLoading(false);
    }, 5000);

    const handleSession = async (session: any) => {
      if (!mounted) return;
      try {
        if (session?.user) {
          const profile = await fetchProfile(session.user.id);
          if (mounted) setUser(profile);
        } else {
          if (mounted) setUser(null);
        }
      } catch (err) {
        if (mounted) setUser(null);
      } finally {
        if (mounted) {
          setLoading(false);
          clearTimeout(safetyTimeout);
        }
      }
    };

    // Initial check
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth Event:", event);
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setLoading(false);
      } else {
        await handleSession(session);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
      clearTimeout(safetyTimeout);
    };
  }, []);

  const signUp = async (email: string, password: string, name: string, role: UserRole): Promise<string | null> => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name, role } },
      });
      return error?.message || null;
    } catch (err: any) {
      return err.message;
    }
  };

  const signIn = async (email: string, password: string): Promise<string | null> => {
    try {
      // Step 1: Nuclear clear in memory state if possible
      // Step 2: Attempt login with 8s timeout
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('SignIn Timeout')), 8000));
      const signInPromise = supabase.auth.signInWithPassword({ email, password });
      
      const result = await Promise.race([signInPromise, timeoutPromise]) as any;
      return result.error?.message || null;
    } catch (err: any) {
      return err.message || "Connection failed. Please try Repair.";
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } finally {
      setUser(null);
      localStorage.clear(); // Complete wipe on logout for total safety
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
