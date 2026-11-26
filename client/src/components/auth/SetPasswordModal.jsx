import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { KeyRound, CheckCircle2, Lock } from 'lucide-react';
import Modal from '../common/Modal';
import api from '../../api/axios';
import { useAuthStore } from '../../store/authStore';

const SetPasswordModal = ({ isOpen, onClose, initialEmail = '' }) => {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (initialEmail) {
      setEmail(initialEmail);
    }
  }, [initialEmail]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      toast.error('Please enter your email');
      return;
    }

    if (!password || password.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/set-password', {
        email: email.trim().toLowerCase(),
        password,
      });

      if (res.success && res.data) {
        setAuth(res.data.user, res.data.token);
        toast.success(`Password saved! Welcome ${res.data.user.name}`);
        onClose();
        navigate('/dashboard');
      } else {
        toast.error(res.message || 'Failed to update password');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to set password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Set / Match Personal Password" maxWidth="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300 text-xs space-y-1">
          <p className="font-semibold flex items-center gap-1.5">
            <Lock className="h-4 w-4" /> Personal Password Matching
          </p>
          <p className="text-[11px] leading-relaxed">
            Set your campus account password to match your preferred password (or Google password).
            Once saved, you can log in anytime with your email and this password!
          </p>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Account Email *
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="sonikaacharya2706@gmail.com"
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            New Password (min 8 chars) *
          </label>
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Confirm Password *
          </label>
          <input
            type="password"
            required
            minLength={8}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 px-4 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <CheckCircle2 className="h-4 w-4" />
          {loading ? 'Saving & Logging in...' : 'Save Password & Sign In'}
        </button>
      </form>
    </Modal>
  );
};

export default SetPasswordModal;
