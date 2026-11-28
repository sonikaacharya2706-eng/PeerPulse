import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { useAuthStore } from '../../store/authStore';

const isValidGoogleClientId = (id) =>
  typeof id === 'string' && id.trim().endsWith('.apps.googleusercontent.com');

const Login = () => {
  const navigate = useNavigate();
  const { loginWithGoogle } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [serverClientId, setServerClientId] = useState('');

  // Clean any invalid cached client ID and fetch valid Client ID from server if needed
  useEffect(() => {
    const cached = localStorage.getItem('google_client_id');
    if (cached && !isValidGoogleClientId(cached)) {
      localStorage.removeItem('google_client_id');
    }

    const envClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!isValidGoogleClientId(envClientId)) {
      api
        .get('/auth/google-config')
        .then((res) => {
          if (isValidGoogleClientId(res?.data?.clientId)) {
            setServerClientId(res.data.clientId.trim());
          }
        })
        .catch(() => {});
    }
  }, []);

  // Ensure Google Identity Services script is present
  useEffect(() => {
    if (window.google?.accounts?.oauth2) return;

    let script = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (!script) {
      script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
  }, []);

  // Handle OAuth 2.0 redirect callback (#access_token=...)
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash || !hash.includes('access_token=')) {
      if (hash && hash.includes('error=')) {
        const params = new URLSearchParams(hash.substring(1));
        const err = params.get('error_description') || params.get('error');
        toast.error(err || 'Google sign-in was cancelled.');
        window.history.replaceState(null, '', window.location.pathname);
      }
      return;
    }

    const params = new URLSearchParams(hash.substring(1));
    const accessToken = params.get('access_token');

    // Clean URL hash immediately
    window.history.replaceState(null, '', window.location.pathname);

    if (!accessToken) return;

    const completeRedirectLogin = async () => {
      setLoading(true);
      try {
        const result = await loginWithGoogle({ accessToken });

        if (!result.success) {
          toast.error(result.message || 'Invalid email');
          return;
        }

        toast.success(`Welcome, ${result.user.name}!`);
        navigate('/dashboard');
      } catch (error) {
        toast.error(error.message || 'Invalid email');
      } finally {
        setLoading(false);
      }
    };

    completeRedirectLogin();
  }, [loginWithGoogle, navigate]);

  const handleGoogleSignIn = async () => {
    let clientId = '';

    if (isValidGoogleClientId(import.meta.env.VITE_GOOGLE_CLIENT_ID)) {
      clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID.trim();
    } else if (isValidGoogleClientId(localStorage.getItem('google_client_id'))) {
      clientId = localStorage.getItem('google_client_id').trim();
    } else if (isValidGoogleClientId(serverClientId)) {
      clientId = serverClientId.trim();
    } else {
      try {
        const res = await api.get('/auth/google-config');
        if (isValidGoogleClientId(res?.data?.clientId)) {
          clientId = res.data.clientId.trim();
        }
      } catch {
        clientId = '';
      }
    }

    if (!clientId) {
      toast.error(
        'Google OAuth Client ID is not configured or invalid. Please set a valid *.apps.googleusercontent.com Client ID in environment variables.'
      );
      return;
    }

    const googleIdentity = window.google?.accounts?.oauth2;

    if (googleIdentity) {
      setLoading(true);
      try {
        const tokenClient = googleIdentity.initTokenClient({
          client_id: clientId,
          scope: 'email profile openid',
          callback: async (tokenResponse) => {
            if (tokenResponse.error || !tokenResponse.access_token) {
              setLoading(false);
              toast.error(
                tokenResponse.error_description || tokenResponse.error || 'Google sign-in was not completed.'
              );
              return;
            }

            try {
              const result = await loginWithGoogle({
                accessToken: tokenResponse.access_token,
              });

              if (!result.success) {
                toast.error(result.message || 'Invalid email');
                return;
              }

              toast.success(`Welcome, ${result.user.name}!`);
              navigate('/dashboard');
            } catch (error) {
              toast.error(error.message || 'Invalid email');
            } finally {
              setLoading(false);
            }
          },
        });

        tokenClient.requestAccessToken({ prompt: 'select_account' });
        return;
      } catch (error) {
        setLoading(false);
      }
    }

    // Direct OAuth 2.0 redirect to Google account chooser
    setLoading(true);
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', `${window.location.origin}/login`);
    authUrl.searchParams.set('response_type', 'token');
    authUrl.searchParams.set('scope', 'openid email profile');
    authUrl.searchParams.set('prompt', 'select_account');
    window.location.href = authUrl.toString();
  };

  return (
    <div>
      <div className="mb-6 text-center">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          Sign in to your account
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Access Canara Engineering College Smart Campus Portal
        </p>
      </div>

      <button
        type="button"
        disabled={loading}
        onClick={handleGoogleSignIn}
        className="w-full flex items-center justify-center gap-3 py-2.5 px-4 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-200 text-sm font-semibold transition shadow-sm disabled:opacity-60"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          />
        </svg>
        {loading ? 'Signing in...' : 'Sign in with Google'}
      </button>

      <div className="mt-5 text-center text-xs text-slate-500">
        Don&apos;t have an account?{' '}
        <Link to="/register" className="text-brand-600 dark:text-brand-400 font-semibold hover:underline">
          Create account
        </Link>
      </div>
    </div>
  );
};

export default Login;
