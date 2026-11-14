import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import Card from '../../components/common/Card';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { UserCheck, AlertTriangle, CheckCircle, BookOpen } from 'lucide-react';

const MyAttendance = () => {
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const res = await api.get('/attendance/my-summary');
      setSummary(res.data || []);
    } catch (err) {
      toast.error(err.message || 'Failed to load attendance summary');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const lowCount = summary.filter((s) => s.isLow).length;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <UserCheck className="h-6 w-6 text-brand-600" /> My Attendance Record
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Per-subject cumulative percentage. Academic regulations mandate &ge; 75% attendance for all coursework.
        </p>
      </div>

      {lowCount > 0 && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-start gap-3 shadow-sm">
          <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-sm">Low Attendance Warning</p>
            <p className="mt-0.5">
              You are currently below 75% attendance in <strong>{lowCount}</strong> subject(s). Please attend all upcoming lectures to avoid detention from end-semester exams.
            </p>
          </div>
        </div>
      )}

      {loading ? (
        <LoadingSpinner />
      ) : summary.length === 0 ? (
        <EmptyState
          icon={UserCheck}
          title="No attendance sessions recorded"
          description="Your classes have not conducted any attendance sessions yet."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {summary.map((sub, i) => (
            <Card
              key={i}
              className={`border ${
                sub.isLow
                  ? 'border-rose-300 dark:border-rose-800 bg-rose-50/20'
                  : 'border-slate-200 dark:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    {sub.subject}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {sub.faculty}
                  </p>
                </div>

                <span
                  className={`text-lg font-bold font-mono px-2.5 py-1 rounded-lg ${
                    sub.isLow
                      ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                      : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                  }`}
                >
                  {sub.percentage}%
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden mb-3">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    sub.isLow ? 'bg-rose-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, sub.percentage)}%` }}
                />
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs py-2 bg-slate-50 dark:bg-slate-900/40 rounded-lg">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">Total</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {sub.totalSessions}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-emerald-600 uppercase block">Attended</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {sub.attended}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-rose-500 uppercase block">Missed</span>
                  <span className="font-bold text-rose-600 dark:text-rose-400">
                    {sub.absent}
                  </span>
                </div>
              </div>

              {sub.isLow && (
                <p className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 mt-3 text-center">
                  ⚠️ Critical: Below 75% Minimum Threshold
                </p>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyAttendance;
