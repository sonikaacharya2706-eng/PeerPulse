import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Search, KeyRound, ExternalLink, ShieldCheck, CheckCircle2 } from 'lucide-react';
import Modal from '../common/Modal';
import { useAuthStore } from '../../store/authStore';

export const WHITELISTED_ACCOUNTS = [
  // Canara Faculty
  {
    name: 'Dr. Sandeep Kini',
    email: 'sandeepkini@canaraengineering.in',
    role: 'Faculty (HOD ISE)',
    type: 'faculty',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=SandeepKini',
  },
  {
    name: 'Prof. Pradeep M',
    email: 'pradeepm@canaraengineering.in',
    role: 'Faculty (Asst. Prof)',
    type: 'faculty',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=PradeepM',
  },
  {
    name: 'Prof. Geetha Laxmi',
    email: 'geetha.laxmi@canaraengineering.in',
    role: 'Faculty (Asst. Prof)',
    type: 'faculty',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=GeethaLaxmi',
  },
  {
    name: 'Prof. Yashaswini',
    email: 'yashaswini@canaraengineering.in',
    role: 'Faculty (Asst. Prof)',
    type: 'faculty',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Yashaswini',
  },
  // ISE Students
  {
    name: 'Sonika Acharya',
    email: 'sonikaacharya2706@gmail.com',
    role: 'ISE Student (4CA21IS048)',
    type: 'student',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=SonikaAcharya',
  },
  {
    name: 'Shwetha S P',
    email: 'mgssp3014@gmail.com',
    role: 'ISE Student (4CA21IS047)',
    type: 'student',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Shwetha',
  },
  {
    name: 'Shreya Gouda',
    email: 'shreyagouda722@gmail.com',
    role: 'ISE Student (4CA21IS046)',
    type: 'student',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Shreya',
  },
  {
    name: 'Spoorthi J Gatty',
    email: 'spoorthijgatty2@gmail.com',
    role: 'ISE Student (4CA21IS050)',
    type: 'student',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Spoorthi',
  },
  {
    name: 'Soukhya',
    email: 'soukhya0510@gmail.com',
    role: 'ISE Student (4CA21IS049)',
    type: 'student',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Soukhya',
  },
  {
    name: 'Rashmi Shetty',
    email: 'rashmishetty310@gmail.com',
    role: 'ISE Student (4CA21IS037)',
    type: 'student',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rashmi',
  },
  {
    name: 'Pramod S',
    email: 'pramodsmg05@gmail.com',
    role: 'ISE Student (4CA21IS034)',
    type: 'student',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=PramodS',
  },
  {
    name: 'Prathamesh',
    email: 'prathameshprathamesh198@gmail.com',
    role: 'ISE Student (4CA21IS035)',
    type: 'student',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Prathamesh',
  },
  {
    name: 'Shriguru Naik',
    email: 'shrigurunaik14@gmail.com',
    role: 'ISE Student (4CA21IS045)',
    type: 'student',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Shriguru',
  },
  {
    name: 'Prajwal Kulal',
    email: 'kulalprajwal309@gmail.com',
    role: 'ISE Student (4CA21IS033)',
    type: 'student',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Prajwal',
  },
  {
    name: 'Sachin Byndoor',
    email: 'sachinbyndoor05@gmail.com',
    role: 'ISE Student (4CA21IS041)',
    type: 'student',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sachin',
  },
  {
    name: 'Harshith K',
    email: 'gjehehdhzzzhzhx7656@gmail.com',
    role: 'ISE Student (4CA21IS017)',
    type: 'student',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Harshith',
  },
  {
    name: 'Pramod V',
    email: 'pramodvishakanta796@gmail.com',
    role: 'ISE Student (4CA21IS036)',
    type: 'student',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=PramodV',
  },
  {
    name: 'Vaibhav Netta',
    email: 'vaibhavnetta@gmail.com',
    role: 'ISE Student (4CA21IS053)',
    type: 'student',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Vaibhav',
  },
  {
    name: 'Rathnam',
    email: 'rathnamskjk@gmail.com',
    role: 'ISE Student (4CA21IS039)',
    type: 'student',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rathnam',
  },
];

const GoogleAuthModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { loginWithGoogle } = useAuthStore();

  const [activeTab, setActiveTab] = useState('accounts'); // 'accounts' | 'custom' | 'oauth'
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingEmail, setLoadingEmail] = useState(null);
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [googleClientId, setGoogleClientId] = useState(
    () => localStorage.getItem('google_client_id') || import.meta.env.VITE_GOOGLE_CLIENT_ID || ''
  );

  const filteredAccounts = WHITELISTED_ACCOUNTS.filter(
    (acc) =>
      acc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acc.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectAccount = (account) => {
    const clientId = googleClientId.trim();
    if (!clientId) {
      setActiveTab('oauth');
      toast(
        'Google authentication requires a Google OAuth 2.0 Client ID. Please configure it below, or sign in using your account password.',
        { icon: 'ℹ️', duration: 6000 }
      );
      return;
    }
    handleLaunchGoogleOAuthPopup(account.email);
  };

  const handleCustomGoogleSubmit = (e) => {
    e.preventDefault();
    if (!customEmail) {
      toast.error('Please enter your Google email');
      return;
    }
    const clientId = googleClientId.trim();
    if (!clientId) {
      setActiveTab('oauth');
      toast(
        'Google authentication requires a Google OAuth 2.0 Client ID. Please configure it below, or sign in using your account password.',
        { icon: 'ℹ️', duration: 6000 }
      );
      return;
    }
    handleLaunchGoogleOAuthPopup(customEmail.trim().toLowerCase());
  };

  const handleLaunchGoogleOAuthPopup = (hintEmail = null) => {
    const clientId = googleClientId.trim();
    if (!clientId) {
      toast.error('Please enter a Google OAuth 2.0 Client ID from Google Cloud Console');
      return;
    }

    localStorage.setItem('google_client_id', clientId);

    if (!window.google?.accounts?.oauth2) {
      toast.error('Google Identity Services script is still loading. Please refresh and try again.');
      return;
    }

    try {
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'email profile openid',
        callback: async (tokenResponse) => {
          if (tokenResponse.error) {
            toast.error(
              `Google Sign-In error: ${tokenResponse.error_description || tokenResponse.error}`
            );
            return;
          }

          setLoadingEmail('oauth_popup');
          try {
            const res = await loginWithGoogle({
              accessToken: tokenResponse.access_token,
            });

            if (res.success) {
              toast.success(`Google OAuth Verified! Welcome ${res.user.name}`);
              onClose();
              navigate('/dashboard');
            } else {
              toast.error(res.message || 'Google verification failed');
            }
          } catch (err) {
            toast.error('Google verification error: ' + (err.message || 'Network error'));
          } finally {
            setLoadingEmail(null);
          }
        },
      });

      const options = hintEmail
        ? { prompt: 'select_account', hint: hintEmail }
        : { prompt: 'select_account' };

      tokenClient.requestAccessToken(options);
    } catch (err) {
      toast.error('Could not open Google popup: ' + (err.message || 'Origin mismatch'));
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Sign in with Google" maxWidth="max-w-xl">
      <div className="space-y-4">
        {/* Header Branding */}
        <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
          <svg className="h-7 w-7 flex-shrink-0" viewBox="0 0 24 24">
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
          <div className="flex-1">
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              Google Identity Verification
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Choose your verified Google account or connect via Google OAuth popup
            </p>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-200 dark:border-slate-700 text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('accounts')}
            className={`pb-2 px-3 border-b-2 transition ${
              activeTab === 'accounts'
                ? 'border-brand-600 text-brand-600 dark:border-brand-400 dark:text-brand-400 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            Choose Google Account ({WHITELISTED_ACCOUNTS.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('custom')}
            className={`pb-2 px-3 border-b-2 transition ${
              activeTab === 'custom'
                ? 'border-brand-600 text-brand-600 dark:border-brand-400 dark:text-brand-400 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            Custom Google Email
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('oauth')}
            className={`pb-2 px-3 border-b-2 transition ${
              activeTab === 'oauth'
                ? 'border-brand-600 text-brand-600 dark:border-brand-400 dark:text-brand-400 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            Google Cloud OAuth Popup ↗
          </button>
        </div>

        {/* Tab 1: Whitelisted Accounts */}
        {activeTab === 'accounts' && (
          <div className="space-y-3">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name or email (e.g., Sonika, Sandeep Kini)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            {/* Accounts Scroll Area */}
            <div className="max-h-[320px] overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-100 dark:divide-slate-800">
              {filteredAccounts.map((account) => (
                <button
                  key={account.email}
                  type="button"
                  onClick={() => handleSelectAccount(account)}
                  disabled={loadingEmail === account.email}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700/60 transition text-left group border border-transparent hover:border-slate-200 dark:hover:border-slate-600 disabled:opacity-50"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={account.avatar}
                      alt={account.name}
                      className="h-9 w-9 rounded-full bg-slate-200 dark:bg-slate-700 flex-shrink-0 border border-slate-200 dark:border-slate-700"
                    />
                    <div className="truncate">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition truncate">
                          {account.name}
                        </span>
                        {account.type === 'faculty' ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
                            Faculty
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                            Student
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {account.email}
                      </p>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0 ml-2">
                    {loadingEmail === account.email ? (
                      <span className="text-[11px] text-brand-600 font-medium animate-pulse">
                        Verifying...
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 font-medium">
                        Sign in →
                      </span>
                    )}
                  </div>
                </button>
              ))}

              {filteredAccounts.length === 0 && (
                <div className="py-6 text-center text-xs text-slate-400">
                  No accounts found matching "{searchTerm}"
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Custom Google Email */}
        {activeTab === 'custom' && (
          <form onSubmit={handleCustomGoogleSubmit} className="space-y-3.5 py-2">
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Sign in with your personal Google email. If this is your first time, your student
              account will be automatically provisioned with verified Google identity.
            </p>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Google Email *
              </label>
              <input
                type="email"
                required
                value={customEmail}
                onChange={(e) => setCustomEmail(e.target.value)}
                placeholder="youremail@gmail.com or @canaraengineering.in"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Your Full Name (optional)
              </label>
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="E.g., Sonika Acharya"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <button
              type="submit"
              disabled={loadingEmail === customEmail}
              className="w-full py-2.5 px-4 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-semibold transition disabled:opacity-50"
            >
              {loadingEmail === customEmail ? 'Verifying with Google...' : 'Continue with Google'}
            </button>
          </form>
        )}

        {/* Tab 3: Official Google OAuth 2.0 Popup */}
        {activeTab === 'oauth' && (
          <div className="space-y-3.5 py-2 text-xs text-slate-600 dark:text-slate-300">
            <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-900 text-blue-800 dark:text-blue-300 space-y-1">
              <p className="font-semibold flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4" /> Live Google OAuth Popup Mode
              </p>
              <p className="text-[11px] leading-relaxed">
                This triggers the official <code>accounts.google.com</code> popup window where you
                enter your real Google password. Requires an authorized Google OAuth Client ID for{' '}
                <code>{window.location.origin}</code>.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Google OAuth 2.0 Client ID:
              </label>
              <input
                type="text"
                value={googleClientId}
                onChange={(e) => setGoogleClientId(e.target.value)}
                placeholder="xxxx-xxxxxxxxxx.apps.googleusercontent.com"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Obtain from Google Cloud Console &gt; APIs &amp; Services &gt; Credentials &gt; OAuth
                2.0 Client IDs.
              </p>
            </div>

            <button
              type="button"
              onClick={handleLaunchGoogleOAuthPopup}
              disabled={loadingEmail === 'oauth_popup'}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition disabled:opacity-50"
            >
              <ExternalLink className="h-4 w-4" />
              {loadingEmail === 'oauth_popup'
                ? 'Waiting for Google Login...'
                : 'Open Google Accounts Popup'}
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default GoogleAuthModal;
