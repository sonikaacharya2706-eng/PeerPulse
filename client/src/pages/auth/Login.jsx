import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';
import Button from '../../components/common/Button';

const Login = () => {
  const navigate = useNavigate();
  const { loginWithGoogle } = useAuthStore();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleReady, setGoogleReady] = useState(Boolean(window.google?.accounts?.oauth2));
  const [googleLoadFailed, setGoogleLoadFailed] = useState(false);

  useEffect(() => {
    if (window.google?.accounts?.oauth2) {
      setGoogleReady(true);
      return undefined;
    }

    let script = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (!script) {
      script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }

    let pollId;
    const timeoutId = window.setTimeout(() => {
      window.clearInterval(pollId);
      setGoogleLoadFailed(true);
    }, 10000);

    const checkReady = () => {
      if (window.google?.accounts?.oauth2) {
        window.clearInterval(pollId);
        window.clearTimeout(timeoutId);
        setGoogleReady(true);
        setGoogleLoadFailed(false);
      }
    };

    pollId = window.setInterval(checkReady, 100);
    checkReady();

    return () => {
      window.clearInterval(pollId);
      window.clearTimeout(timeoutId);
    };
  }, []);

  const handleSubmit = (event) => {
    event.preventDefault();
    const enteredEmail = email.trim().toLowerCase();
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || localStorage.getItem('google_client_id');
    const googleIdentity = window.google?.accounts?.oauth2;

    if (!clientId) {
      toast.error('Sign-in is currently unavailable. Please contact your administrator.');
      return;
    }

    if (!googleIdentity) {
      toast.error(
        googleLoadFailed
          ? 'Google sign-in could not load. Refresh the page and try again.'
          : 'Google sign-in is still loading. Please try again.'
      );
      return;
    }

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
    } catch (error) {
      setLoading(false);
      toast.error(error.message || 'Unable to open Google sign-in.');
    }
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
          loading={loading || (!googleReady && !googleLoadFailed)}
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
