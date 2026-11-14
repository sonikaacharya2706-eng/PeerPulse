import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';
import Button from '../../components/common/Button';

const Login = () => {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter both email and password');
      return;
    }

    setLoading(true);
    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      toast.success(`Welcome back, ${result.user.name}!`);
      navigate('/dashboard');
    } else {
      toast.error(result.message || 'Login failed');
    }
  };

  const fillDemo = (demoEmail, demoPass = 'Campus@123') => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div>
      <div className="mb-6 text-center">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          Sign in to your account
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Access your Smart Campus dashboard
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Email address
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

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
              Password
            </label>
            <Link
              to="/forgot-password"
              className="text-xs text-brand-600 dark:text-brand-400 hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <Button type="submit" loading={loading} className="w-full py-2.5">
          Sign in
        </Button>
      </form>

      {/* Quick Demo Credentials */}
      <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800">
        <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2 text-center">
          Demo Accounts (Password: Campus@123)
        </p>
        <div className="grid grid-cols-2 gap-1.5 text-xs">
          <button
            type="button"
            onClick={() => fillDemo('admin@campus.edu')}
            className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded text-slate-700 dark:text-slate-300 text-left font-medium transition"
          >
            🔑 Admin
          </button>
          <button
            type="button"
            onClick={() => fillDemo('faculty1@campus.edu')}
            className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded text-slate-700 dark:text-slate-300 text-left font-medium transition"
          >
            🎓 Faculty (CSE)
          </button>
          <button
            type="button"
            onClick={() => fillDemo('student1@campus.edu')}
            className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded text-slate-700 dark:text-slate-300 text-left font-medium transition"
          >
            📚 Student (CSE)
          </button>
          <button
            type="button"
            onClick={() => fillDemo('security@campus.edu')}
            className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded text-slate-700 dark:text-slate-300 text-left font-medium transition"
          >
            🛡️ Security
          </button>
          <button
            type="button"
            onClick={() => fillDemo('maintenance1@campus.edu')}
            className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded text-slate-700 dark:text-slate-300 text-left font-medium transition col-span-2 text-center"
          >
            🔧 Maintenance Staff
          </button>
        </div>
      </div>

      <div className="mt-5 text-center text-xs text-slate-500">
        Don't have an account?{' '}
        <Link to="/register" className="text-brand-600 dark:text-brand-400 font-semibold hover:underline">
          Create account
        </Link>
      </div>
    </div>
  );
};

export default Login;
