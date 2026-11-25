import React from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap,
  Calendar,
  PackageSearch,
  QrCode,
  Wrench,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  Users,
} from 'lucide-react';
import Button from '../components/common/Button';
import { useAuthStore } from '../store/authStore';

const LandingPage = () => {
  const { isAuthenticated, user } = useAuthStore();

  const modules = [
    {
      num: 'M1',
      name: 'Smart Classroom Availability and Timetable Assistant',
      description:
        'Live occupancy status board, clash-free room finder, automated scheduling, and faculty room reservations.',
      icon: Calendar,
      color: 'from-blue-600 to-indigo-600',
      link: '/m1/rooms/status',
    },
    {
      num: 'M2',
      name: 'Digital Lost-and-Found Management System',
      description:
        'AI keyword and location match scoring (Algorithm G), automated multi-party notifications, and secure claim verifications.',
      icon: PackageSearch,
      color: 'from-teal-600 to-emerald-600',
      link: '/m2/board',
    },
    {
      num: 'M3',
      name: 'QR-Based Classroom Attendance and Visitor Management',
      description:
        '20-second dynamic HMAC-SHA256 QR codes, real-time check-in stream, low-attendance alerts, and security gate visitor pass scanning.',
      icon: QrCode,
      color: 'from-violet-600 to-purple-600',
      link: '/m3/student/my-attendance',
    },
    {
      num: 'M4',
      name: 'Campus Maintenance and Complaint Reporting Application',
      description:
        'Defect reporting with photo proofs, auto-escalating SLA timers (4h to 120h), technician dispatching, and feedback closing.',
      icon: Wrench,
      color: 'from-amber-600 to-orange-600',
      link: '/m4/raise',
    },
    {
      num: 'M5',
      name: 'Smart College Event and Activity Notification System',
      description:
        'Campus activity discovery, targeted audience quotas, automatic waitlist promotion, 24h & 1h reminders, and QR check-ins.',
      icon: Sparkles,
      color: 'from-pink-600 to-rose-600',
      link: '/m5/events',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between">
      {/* Top Navigation */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-brand-600 to-teal-400 flex items-center justify-center text-white shadow-md font-bold">
              SC
            </div>
            <span className="font-bold text-lg text-slate-900 dark:text-slate-100 tracking-tight">
              Smart Campus Solutions
            </span>
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link to="/dashboard">
                <Button className="gap-2">
                  Go to Dashboard <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="outline" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link to="/register">
                  <Button size="sm">Get Started</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="py-16 sm:py-24 text-center max-w-4xl mx-auto px-4 sm:px-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-brand-100 text-brand-800 dark:bg-brand-950 dark:text-brand-300 mb-6">
            <span className="h-2 w-2 rounded-full bg-brand-600 animate-ping" />
            Theme 1 &bull; Integrated College Operating Platform
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 leading-tight">
            One Unified Web Platform for Modern{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 via-teal-500 to-brand-700">
              Smart Campuses
            </span>
          </h1>

          <p className="mt-5 text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Eliminating administrative silos through real-time classroom availability, AI lost-and-found matching, dynamic QR attendance, automated SLA maintenance, and smart event waitlists.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to={isAuthenticated ? '/dashboard' : '/login'} className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto gap-2 px-8 py-3.5 shadow-lg shadow-brand-500/20">
                Launch Portal <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link to="/m1/rooms/status" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full sm:w-auto px-6 py-3.5">
                Live Room Status Board &rarr;
              </Button>
            </Link>
          </div>
        </section>

        {/* Five Distinct Modules Grid */}
        <section className="py-12 bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
                The Five Core Smart Campus Modules
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2">
                Engineered with strict zero-clash algorithms, cryptographic verification, and reactive WebSockets.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {modules.map((m) => (
                <div
                  key={m.num}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 p-6 bg-slate-50/50 dark:bg-slate-950/40 hover:shadow-xl transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="h-10 w-10 rounded-xl bg-gradient-to-tr text-white flex items-center justify-center shadow-md font-bold text-sm bg-brand-600">
                        <m.icon className="h-5 w-5" />
                      </span>
                      <span className="font-mono text-xs font-bold text-teal-600 dark:text-teal-400">
                        {m.num}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition">
                      {m.name}
                    </h3>

                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                      {m.description}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-200/80 dark:border-slate-800">
                    <Link
                      to={m.link}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline"
                    >
                      Open Module <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              ))}

              {/* Demo Credentials Card */}
              <div className="rounded-2xl border border-brand-200 dark:border-brand-900/60 p-6 bg-brand-50/40 dark:bg-brand-950/20 flex flex-col justify-between">
                <div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-brand-200 dark:bg-brand-900 text-brand-800 dark:text-brand-300 mb-3 inline-block">
                    Instant Evaluation
                  </span>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Ready-to-Test Demo Roles
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                    Use these seeded accounts to explore each role:
                  </p>
                  <dl className="mt-3 space-y-1.5 text-xs">
                    <div className="flex justify-between gap-2">
                      <dt className="font-semibold text-slate-700 dark:text-slate-300">Admin</dt>
                      <dd className="font-mono text-slate-600 dark:text-slate-400">admin@campus.edu</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="font-semibold text-slate-700 dark:text-slate-300">Faculty (Canara)</dt>
                      <dd className="font-mono text-slate-600 dark:text-slate-400">sandeepkini@canaraengineering.in</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="font-semibold text-slate-700 dark:text-slate-300">Student (ISE)</dt>
                      <dd className="font-mono text-slate-600 dark:text-slate-400">sonikaacharya2706@gmail.com</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="font-semibold text-slate-700 dark:text-slate-300">Security</dt>
                      <dd className="font-mono text-slate-600 dark:text-slate-400">security@campus.edu</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="font-semibold text-slate-700 dark:text-slate-300">Maintenance</dt>
                      <dd className="font-mono text-slate-600 dark:text-slate-400">maintenance@campus.edu</dd>
                    </div>
                  </dl>
                  <p className="text-xs font-mono font-semibold text-brand-700 dark:text-brand-300 mt-3">
                    Password for all: Campus@123
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-brand-200/60 dark:border-brand-900/40">
                  <Link to="/login">
                    <Button variant="primary" size="sm" className="w-full">
                      Sign in with Demo Account
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 py-8 text-center text-xs text-slate-500">
        <p>Smart Campus Solutions &bull; Integrated College Operating Platform &bull; ES Modules Full Stack</p>
      </footer>
    </div>
  );
};

export default LandingPage;
