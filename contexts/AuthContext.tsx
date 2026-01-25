import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../supabase';
import { UserProfile } from '../types';

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  profileLoading: boolean;
  isAdmin: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  userProfile: null,
  loading: true,
  profileLoading: false,
  isAdmin: false,
  refreshProfile: async () => {}
});

export const useAuth = () => useContext(AuthContext);

// List of emails that should automatically get Admin privileges
const ADMIN_EMAILS = ['my.mulyar@gmail.com'];
// DEV MODE: Set this to true to treat all users as admins during development
const DEV_AUTO_ADMIN = false;

const mapUserRow = (row: any): UserProfile => ({
  uid: row.id,
  email: row.email || '',
  displayName: row.display_name || 'Student',
  role: row.role || 'student',
  createdAt: row.created_at || new Date().toISOString(),
  settings: row.settings || { showResultAfterEach: false }
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const fetchingProfile = React.useRef<string | null>(null);

  const fetchProfile = async (user: User, abortSignal?: AbortSignal) => {
    // Prevent multiple simultaneous fetches for the same user
    if (fetchingProfile.current === user.id) {
      console.log('[AuthContext] Already fetching profile for:', user.id);
      return;
    }
    fetchingProfile.current = user.id;

    // Check if aborted before starting
    if (abortSignal?.aborted) {
      console.log('[AuthContext] Fetch aborted before start');
      fetchingProfile.current = null;
      return;
    }

    setProfileLoading(true);

    try {
      console.log('[AuthContext] Fetching profile for user:', user.id);
      const shouldBeAdmin = DEV_AUTO_ADMIN || (!!user.email && ADMIN_EMAILS.includes(user.email));

      console.log('[AuthContext] Querying Supabase...');

      // Add timeout to prevent infinite hanging
      const queryPromise = supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Query timeout after 30s')), 30000)
      );

      const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as any;

      // Check if aborted after query completes
      if (abortSignal?.aborted) {
        console.log('[AuthContext] Fetch aborted after query');
        fetchingProfile.current = null;
        return;
      }

      console.log('[AuthContext] Query result:', { data, error });

      if (error && error.code !== 'PGRST116') {
        console.error('[AuthContext] Error fetching profile:', error);
        throw error;
      }

      if (data) {
        console.log('[AuthContext] Profile found:', data);
        if (shouldBeAdmin && data.role !== 'admin') {
          console.log('[AuthContext] Updating role to admin...');
          await supabase.from('users').update({ role: 'admin' }).eq('id', user.id);
          data.role = 'admin';
        }

        // Check if aborted before setState
        if (abortSignal?.aborted) {
          console.log('[AuthContext] Fetch aborted before setState');
          fetchingProfile.current = null;
          return;
        }

        console.log('[AuthContext] Setting user profile...');
        setUserProfile(mapUserRow(data));
        console.log('[AuthContext] Profile set successfully');
        return;
      }

      console.log('[AuthContext] No profile found, creating new one');
      const newProfileRow = {
        id: user.id,
        email: user.email || '',
        display_name: user.user_metadata?.full_name || user.email || 'Student',
        role: shouldBeAdmin ? 'admin' : 'student',
        created_at: new Date().toISOString(),
        settings: {
          showResultAfterEach: false
        }
      };

      console.log('[AuthContext] Inserting new profile...');
      const { data: inserted, error: insertError } = await supabase
        .from('users')
        .insert(newProfileRow)
        .select('*')
        .single();

      if (insertError) {
        console.error('[AuthContext] Error inserting profile:', insertError);
        throw insertError;
      }

      // Check if aborted before setState
      if (abortSignal?.aborted) {
        console.log('[AuthContext] Fetch aborted before setState (new profile)');
        fetchingProfile.current = null;
        return;
      }

      console.log('[AuthContext] Profile created:', inserted);
      setUserProfile(mapUserRow(inserted));
    } catch (error: any) {
      console.warn('[AuthContext] Could not fetch/create user profile in Supabase. Using local fallback.', error?.message || error);

      // Check if aborted before using fallback
      if (abortSignal?.aborted) {
        console.log('[AuthContext] Fetch aborted in error handler');
        fetchingProfile.current = null;
        return;
      }

      const shouldBeAdmin = DEV_AUTO_ADMIN || (!!user.email && ADMIN_EMAILS.includes(user.email || ''));
      const fallbackProfile: UserProfile = {
        uid: user.id,
        email: user.email || '',
        displayName: user.user_metadata?.full_name || user.email || 'Student',
        role: shouldBeAdmin ? 'admin' : 'student',
        createdAt: new Date().toISOString(),
        settings: {
          showResultAfterEach: false
        }
      };
      console.log('[AuthContext] Using fallback profile:', fallbackProfile);
      setUserProfile(fallbackProfile);
    } finally {
      console.log('[AuthContext] Cleaning up fetch lock');
      // Only clear lock if this is still the current fetch
      if (fetchingProfile.current === user.id) {
        fetchingProfile.current = null;
        setProfileLoading(false);
      }
    }
  };

  useEffect(() => {
    let active = true;
    let authListener: { subscription: { unsubscribe: () => void } } | null = null;
    const abortController = new AbortController();

    const init = async () => {
      try {
        console.log('[AuthContext] Initializing auth...');

        // Set up auth state listener first
        const { data: listenerData } = supabase.auth.onAuthStateChange(async (event, session) => {
          if (!active || abortController.signal.aborted) return;
          console.log('[AuthContext] Auth state changed:', event);
          const user = session?.user ?? null;
          setCurrentUser(user);
          if (user) {
            fetchProfile(user, abortController.signal).catch((err) => {
              console.error('[AuthContext] Error in auth listener fetchProfile:', err);
            });
          } else {
            setUserProfile(null);
          }
          if (active) {
            setLoading(false);
          }
        });
        authListener = listenerData;

        // Then get the current session
        const { data, error } = await supabase.auth.getSession();
        if (!active) return;

        if (error) {
          console.error('[AuthContext] Error getting session:', error);
          // Continue anyway, let user be null
        }

        const user = data.session?.user ?? null;
        console.log('[AuthContext] Current user:', user?.email || 'none');
        setCurrentUser(user);
        if (user) {
          void fetchProfile(user, abortController.signal);
        } else {
          setUserProfile(null);
        }
      } catch (error: any) {
        if (error.name === 'AbortError') {
          console.log('[AuthContext] Init aborted (likely React Strict Mode)');
          // This is expected in React Strict Mode, ignore it
          return;
        }
        console.error('[AuthContext] Init error:', error);
      } finally {
        if (active) {
          console.log('[AuthContext] Setting loading to false');
          setLoading(false);
        }
      }
    };

    init();

    return () => {
      active = false;
      abortController.abort();
      fetchingProfile.current = null;
      if (authListener) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  const refreshProfile = async () => {
    if (currentUser) {
      await fetchProfile(currentUser);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary to-secondary">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{
      currentUser,
      userProfile,
      loading,
      profileLoading,
      isAdmin: userProfile?.role === 'admin',
      refreshProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};
