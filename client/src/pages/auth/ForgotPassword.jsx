import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import Button from '../../components/common/Button';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { email });
      setSent(true);
      toast.success(res.message || 'Reset link sent! Check your email / console.');
    } catch (err) {
      toast.error(err.message || 'Could not send reset link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6 text-center">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          Reset your password
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Enter your registered email address to receive recovery instructions.
        </p>
      </div>

      {sent ? (
        <div className="p-4 bg-teal-50 dark:bg-teal-950/30 rounded-xl border border-teal-200 dark:border-teal-800 text-center">
          <p className="text-xs text-teal-800 dark:text-teal-300 font-medium">
            Password reset instructions have been dispatched to <strong>{email}</strong>.
            If running locally without an external SMTP, check the server terminal console for the reset link!
          </p>
          <div className="mt-4">
            <Link
              to="/login"
              className="text-xs text-brand-600 dark:text-brand-400 font-semibold hover:underline"
            >
              Return to Login
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Campus Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@campus.edu"
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <Button type="submit" loading={loading} className="w-full py-2.5">
            Send Reset Link
          </Button>

          <div className="text-center">
            <Link
              to="/login"
              className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            >
              Back to Login
            </Link>
          </div>
        </form>
      )}
    </div>
  );
};

export default ForgotPassword;
