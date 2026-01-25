import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../supabase';

const AuthCallbackPage: React.FC = () => {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const finalizeSignIn = async () => {
      try {
        // Check if there's a code in the URL (PKCE flow)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const queryParams = new URLSearchParams(window.location.search);
        const code = queryParams.get('code');

        if (code) {
          // PKCE flow - exchange code for session
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(window.location.href);
          if (exchangeError) {
            setError(exchangeError.message);
            return;
          }
        } else if (hashParams.get('access_token')) {
          // Implicit flow - session is already set by Supabase client
          // Just verify the session exists
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          if (sessionError || !session) {
            setError('Failed to establish session');
            return;
          }
        } else {
          setError('No authentication data found');
          return;
        }

        // Successfully authenticated, redirect to dashboard
        router.replace('/dashboard');
      } catch (err: any) {
        console.error('Auth callback error:', err);
        setError(err.message || 'Authentication failed');
      }
    };

    finalizeSignIn();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-700 text-lg font-medium">Finishing sign in...</p>
        {error && (
          <div className="mt-4 p-4 bg-red-50 rounded-lg max-w-md mx-auto">
            <p className="text-sm text-red-600">{error}</p>
            <button
              onClick={() => router.push('/auth')}
              className="mt-2 text-sm text-primary hover:text-secondary underline"
            >
              Back to login
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthCallbackPage;
