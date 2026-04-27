import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Session } from '@supabase/supabase-js';

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
    const { data, error } = await supabase
      .from('profiles')
      .select('name, role')
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
      role: data.role as UserRole 
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
          setUser(profile);
        } else {
          // Fallback for demo mode if profile fetch fails
          console.warn("Profile not found, using demo fallback");
          setUser({ id: session.user.id, name: 'Demo User', role: 'parent' });
        }
      } else {
        // Check for local guest session
        const localUser = localStorage.getItem('pc-guest-user');
        if (localUser) {
          setUser(JSON.parse(localUser));
        } else {
          setUser(null);
        }
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
      console.log("Auth Event:", event);
      if (mounted) {
        if (event === 'SIGNED_OUT') {
          localStorage.removeItem('pc-guest-user');
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
      return error?.message || null;
    } catch (err: any) {
      // Offline fallback
      if (err.message?.includes('fetch')) {
        const mockUser: AppUser = { id: 'guest-' + Math.random(), name, role };
        localStorage.setItem('pc-guest-user', JSON.stringify(mockUser));
        setUser(mockUser);
        return null;
      }
      return err.message;
    }
  };

  const signIn = async (email: string, password: string): Promise<string | null> => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return error?.message || null;
    } catch (err: any) {
      // Offline fallback
      if (err.message?.includes('fetch') || err.name === 'TypeError') {
        console.warn("Server unreachable, entering Demo Mode");
        const mockUser: AppUser = { 
          id: 'demo-parent', 
          name: 'Hero Parent', 
          role: email.includes('child') ? 'child' : 'parent' 
        };
        localStorage.setItem('pc-guest-user', JSON.stringify(mockUser));
        setUser(mockUser);
        return null;
      }
      return err.message || "Connection failed. Please try again.";
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn("Sign out failed, clearing local session");
    } finally {
      localStorage.removeItem('pc-guest-user');
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
