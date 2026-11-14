import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { Users, Search, Clock, ShieldCheck, Download, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';

const VisitorsOnCampus = () => {
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('onCampus'); // 'onCampus' | 'all'
  const [search, setSearch] = useState('');

  const fetchVisitors = async () => {
    setLoading(true);
    try {
      if (tab === 'onCampus') {
        const res = await api.get('/visitors/on-campus');
        setVisitors(res.data || []);
      } else {
        const params = new URLSearchParams({
          limit: 50,
          ...(search && { search }),
        });
        const res = await api.get(`/visitors?${params.toString()}`);
        setVisitors(res.data || []);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to fetch visitors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisitors();
  }, [tab]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchVisitors();
  };

  const apiBase =
    import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL.startsWith('http')
      ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '')
      : '';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Users className="h-6 w-6 text-brand-600" /> Visitors On Campus
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time tracking of active campus visitors and security gate log history.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex rounded-lg border border-slate-300 dark:border-slate-700 p-1 bg-white dark:bg-slate-800">
          <button
            onClick={() => setTab('onCampus')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
              tab === 'onCampus'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Currently On-Campus
          </button>
          <button
            onClick={() => setTab('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
              tab === 'all'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Full Visitor Log History
          </button>
        </div>
      </div>

      {tab === 'all' && (
        <Card className="p-3">
          <form onSubmit={handleSearchSubmit} className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by visitor name, phone, passcode..."
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </form>
        </Card>
      )}

      <Card>
        {loading ? (
          <LoadingSpinner />
        ) : visitors.length === 0 ? (
          <EmptyState
            icon={Users}
            title={tab === 'onCampus' ? 'No visitors currently on campus' : 'No visitor records found'}
            description="Guest check-ins recorded at security gate scanner will display here."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40 text-slate-500 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">Visitor</th>
                  <th className="py-3 px-4">Pass Code</th>
                  <th className="py-3 px-4">Host / Purpose</th>
                  <th className="py-3 px-4">Check-In Time</th>
                  <th className="py-3 px-4">Check-Out Time</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Pass QR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {visitors.map((v) => (
                  <tr key={v._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900 dark:text-slate-100 block">
                        {v.name}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {v.phone} {v.email ? `• ${v.email}` : ''}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-brand-600 dark:text-brand-400">
                      {v.passCode}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                        {v.personToMeet?.name || 'Faculty / Staff'}
                      </span>
                      <span className="text-[10px] text-slate-500 truncate max-w-xs block">
                        {v.purpose}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                      {v.checkInAt ? format(new Date(v.checkInAt), 'MMM d, h:mm a') : '—'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                      {v.checkOutAt ? format(new Date(v.checkOutAt), 'MMM d, h:mm a') : '—'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          v.status === 'checked_in'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 animate-pulse'
                            : v.status === 'checked_out'
                            ? 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                        }`}
                      >
                        {v.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <a
                        href={`${apiBase}/api/visitors/${v._id}/pass`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 inline-block text-brand-600 dark:text-brand-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
                        title="Download Pass QR"
                      >
                        <Download className="h-4 w-4" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default VisitorsOnCampus;
