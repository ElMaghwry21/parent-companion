import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Session } from '@supabase/supabase-js';

export type UserRole = 'parent' | 'child';

export interface AppUser {
  id: string;
  name: string;
  role: UserRole;
  parent_id: string | null;
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
    const { data, error } = await supabase
      .from('profiles')
      .select('name, role, parent_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error("Profile fetch error:", error);
      return null;
    }
    
    if (!data) return null;
    
    return { 
      id: userId, 
      name: data.name, 
      role: data.role as UserRole,
      parent_id: data.parent_id
    };
  } catch (err) {
    console.error("Profile fetch failed:", err);
    return null;
  }
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  const handleSession = useCallback(async (session: Session | null) => {
    try {
      if (session?.user) {
        const profile = await fetchProfile(session.user.id);
        if (profile) {
          setUser({
            ...profile,
            role: profile.role || (session.user.user_metadata?.role as UserRole) || 'parent',
            name: profile.name || session.user.user_metadata?.name || 'User',
            parent_id: profile.parent_id || null
          });
        } else {
          // If no profile yet, but we have session, wait for it
          setUser({ 
            id: session.user.id, 
            name: session.user.user_metadata?.name || 'User', 
            role: (session.user.user_metadata?.role as UserRole) || 'parent',
            parent_id: null
          });
        }
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error("Handle session error:", err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    // Initial check
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) handleSession(session);
    }).catch(() => {
      if (mounted) handleSession(null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (mounted) {
        if (event === 'SIGNED_OUT') {
          setUser(null);
          setLoading(false);
        } else {
          handleSession(session);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [handleSession]);

  const signUp = async (email: string, password: string, name: string, role: UserRole): Promise<string | null> => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name, role } },
      });
      
      if (error) return error.message;
      return null;
    } catch (err) {
      const error = err as Error;
      return error.message || "Sign up failed.";
    }
  };

  const signIn = async (email: string, password: string): Promise<string | null> => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return error.message;
      return null;
    } catch (err) {
      const error = err as Error;
      return error.message || "Connection failed. Please try again.";
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn("Sign out failed");
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
