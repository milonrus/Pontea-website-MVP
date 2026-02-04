import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

const AuthCallbackPage: React.FC = () => {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const finalizeSignIn = async () => {
      try {
        console.log('[Callback] Starting auth finalization');
        console.log('[Callback] Full URL:', window.location.href);

        // Check if there's a code in the URL (PKCE flow)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const queryParams = new URLSearchParams(window.location.search);
        const code = queryParams.get('code');
        const accessToken = hashParams.get('access_token');

        console.log('[Callback] Code:', code);
        console.log('[Callback] Access token present:', !!accessToken);

        if (code) {
          // PKCE flow - exchange code for session
          console.log('[Callback] Using PKCE flow');
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            console.error('[Callback] Exchange error:', exchangeError);
            setError(exchangeError.message);
            return;
          }
          console.log('[Callback] Session established:', !!data.session);
        } else if (accessToken) {
          // Implicit flow - session should already be set
          console.log('[Callback] Using implicit flow');
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          if (sessionError || !session) {
            console.error('[Callback] Session error:', sessionError);
            setError('Failed to establish session');
            return;
          }
          console.log('[Callback] Session found:', !!session);
        } else {
          console.error('[Callback] No auth data in URL');
          setError('No authentication data found');
          return;
        }

        // Wait a moment for the auth state to propagate
        console.log('[Callback] Waiting for auth state...');
        await new Promise(resolve => setTimeout(resolve, 500));

        // Successfully authenticated, redirect to dashboard
        console.log('[Callback] Redirecting to dashboard');
        router.replace('/dashboard');
      } catch (err: any) {
        console.error('[Callback] Auth callback error:', err);
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
