import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';
import Button from '../../components/common/Button';
import GoogleAuthModal from '../../components/auth/GoogleAuthModal';

const Register = () => {
  const navigate = useNavigate();
  const { register, loginWithGoogle } = useAuthStore();
  const [showGoogleModal, setShowGoogleModal] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    department: 'ISE',
    year: '3',
    rollNo: '',
    phone: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (window.google?.accounts?.id && clientId) {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response) => {
          if (response.credential) {
            setLoading(true);
            const res = await loginWithGoogle(response.credential);
            setLoading(false);
            if (res.success) {
              toast.success(`Google verified! Welcome ${res.user.name}`);
              navigate('/dashboard');
            } else {
              toast.error(res.message || 'Google registration failed');
            }
          }
        },
      });

      const btnContainer = document.getElementById('googleSignUpBtn');
      if (btnContainer) {
        window.google.accounts.id.renderButton(btnContainer, {
          theme: 'outline',
          size: 'large',
          width: 360,
          text: 'signup_with',
          shape: 'rectangular',
        });
      }
    }
  }, [loginWithGoogle, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleGoogleClick = () => {
    setShowGoogleModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    const result = await register({
      ...formData,
      email: formData.email.trim().toLowerCase(),
      year: formData.year ? Number(formData.year) : undefined,
      rollNo: formData.rollNo || undefined,
    });
    setLoading(false);

    if (result.success) {
      toast.success('Registration successful! Welcome to Smart Campus.');
      navigate('/dashboard');
    } else {
      toast.error(result.message || 'Registration failed');
    }
  };

  return (
    <div>
      <div className="mb-6 text-center">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          Create an account
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Join Canara Engineering College Smart Campus network
        </p>
      </div>

      {/* Google Sign Up Container */}
      <div className="space-y-3 mb-5">
        <div id="googleSignUpBtn" className="flex justify-center min-h-[44px]">
          <button
            type="button"
            onClick={handleGoogleClick}
            className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-200 text-sm font-medium transition shadow-sm"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
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
            Sign up with Google
          </button>
        </div>

        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
          <span className="flex-shrink mx-3 text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
            Or register with email
          </span>
          <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Full Name *
          </label>
          <input
            type="text"
            required
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="John Doe"
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Campus Email *
          </label>
          <input
            type="email"
            required
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="john@campus.edu"
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Password (min 8 characters) *
          </label>
          <input
            type="password"
            required
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="••••••••"
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Department
            </label>
            <input
              type="text"
              name="department"
              value={formData.department}
              onChange={handleChange}
              placeholder="e.g. ISE, ECE"
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+91 9876543210"
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Year (1-4)
            </label>
            <select
              name="year"
              value={formData.year}
              onChange={handleChange}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="1">1st Year</option>
              <option value="2">2nd Year</option>
              <option value="3">3rd Year</option>
              <option value="4">4th Year</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Roll Number
            </label>
            <input
              type="text"
              name="rollNo"
              value={formData.rollNo}
              onChange={handleChange}
              placeholder="e.g. 21CS001"
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        <Button type="submit" loading={loading} className="w-full py-2.5 mt-2">
          Create Account
        </Button>
      </form>

      <div className="mt-5 text-center text-xs text-slate-500">
        Already registered?{' '}
        <Link to="/login" className="text-brand-600 dark:text-brand-400 font-semibold hover:underline">
          Sign in
        </Link>
      </div>

      <GoogleAuthModal
        isOpen={showGoogleModal}
        onClose={() => setShowGoogleModal(false)}
      />
    </div>
  );
};

export default Register;
