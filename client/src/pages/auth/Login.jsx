import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { useAuthStore } from '../../store/authStore';
import Button from '../../components/common/Button';

const Login = () => {
  const navigate = useNavigate();
  const { loginWithGoogle } = useAuthStore();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [serverClientId, setServerClientId] = useState('');

  // Load Google Client ID fallback from server if not set at build time
  useEffect(() => {
    const envClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || localStorage.getItem('google_client_id');
    if (!envClientId) {
      api
        .get('/auth/google-config')
        .then((res) => {
          if (res?.data?.clientId) {
            setServerClientId(res.data.clientId);
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

  // Handle OAuth 2.0 redirect callback (#access_token=...) if popup was bypassed or blocked
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
    const expectedEmail = sessionStorage.getItem('pending_google_email') || undefined;
    sessionStorage.removeItem('pending_google_email');

    // Clean URL hash immediately
    window.history.replaceState(null, '', window.location.pathname);

    if (!accessToken) return;

    const completeRedirectLogin = async () => {
      setLoading(true);
      try {
        const result = await loginWithGoogle({
          accessToken,
          ...(expectedEmail ? { expectedEmail } : {}),
        });

        if (!result.success) {
          toast.error(result.message || 'Google sign-in failed.');
          return;
        }

        toast.success(`Welcome, ${result.user.name}!`);
        navigate('/dashboard');
      } catch (error) {
        toast.error(error.message || 'Google sign-in failed.');
      } finally {
        setLoading(false);
      }
    };

    completeRedirectLogin();
  }, [loginWithGoogle, navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const enteredEmail = email.trim().toLowerCase();
    if (!enteredEmail) return;

    let clientId =
      import.meta.env.VITE_GOOGLE_CLIENT_ID ||
      localStorage.getItem('google_client_id') ||
      serverClientId;

    if (!clientId) {
      try {
        const res = await api.get('/auth/google-config');
        clientId = res?.data?.clientId || '';
      } catch {
        clientId = '';
      }
    }

    if (!clientId) {
      toast.error('Google Sign-In is not configured. Please set VITE_GOOGLE_CLIENT_ID or GOOGLE_CLIENT_ID.');
      return;
    }

    const googleIdentity = window.google?.accounts?.oauth2;

    // If GIS popup client is loaded, open the Google OAuth popup directly
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
                expectedEmail: enteredEmail,
              });

              if (!result.success) {
                toast.error(result.message || 'Google sign-in failed.');
                return;
              }

              toast.success(`Welcome, ${result.user.name}!`);
              navigate('/dashboard');
            } catch (error) {
              toast.error(error.message || 'Google sign-in failed.');
            } finally {
              setLoading(false);
            }
          },
        });

        tokenClient.requestAccessToken({ prompt: 'select_account', hint: enteredEmail });
        return;
      } catch (error) {
        // Fall through to standard OAuth 2.0 redirect if popup initialization fails
        setLoading(false);
      }
    }

    // Direct OAuth 2.0 redirect to accounts.google.com (works even if gsi/client is still loading or blocked)
    setLoading(true);
    sessionStorage.setItem('pending_google_email', enteredEmail);
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', `${window.location.origin}/login`);
    authUrl.searchParams.set('response_type', 'token');
    authUrl.searchParams.set('scope', 'openid email profile');
    authUrl.searchParams.set('login_hint', enteredEmail);
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

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="signin-email"
            className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
          >
            Email address
          </label>
          <input
            id="signin-email"
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <Button
          type="submit"
          loading={loading}
          className="w-full py-2.5"
        >
          Continue
        </Button>
      </form>

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
