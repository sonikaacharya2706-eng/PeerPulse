import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import {
  ClipboardList,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
  Star,
} from 'lucide-react';
import { format } from 'date-fns';

const STEPS = ['submitted', 'assigned', 'in_progress', 'resolved', 'closed'];

const MyComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const res = await api.get('/complaints');
      setComplaints(res.data || []);
    } catch (err) {
      toast.error(err.message || 'Failed to load complaints');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const getStepIndex = (status) => STEPS.indexOf(status);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-brand-600" /> My Maintenance Complaints
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Track real-time resolution stages, staff assignment, and SLA deadlines.
          </p>
        </div>

        <Link to="/m4/raise">
          <Button className="gap-2">
            <AlertTriangle className="h-4 w-4" /> Raise New Complaint
          </Button>
        </Link>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : complaints.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No complaints reported"
          description="You haven't reported any maintenance or campus infrastructure issues."
          action={
            <Link to="/m4/raise">
              <Button size="sm">Report Issue</Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          {complaints.map((c) => {
            const currentStepIdx = getStepIndex(c.status);
            const isEscalated = c.escalated;

            return (
              <Card key={c._id} className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-700/60">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-brand-600 dark:text-brand-400">
                        {c.ticketId}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          c.priority === 'critical'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                            : c.priority === 'high'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {c.priority} priority
                      </span>

                      {isEscalated && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-600 text-white animate-pulse">
                          <ShieldAlert className="h-3 w-3" /> SLA Escalated
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 mt-1 capitalize">
                      {c.category} Issue &bull; {c.building} ({c.room})
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 line-clamp-1">
                      {c.description}
                    </p>
                  </div>

                  <div className="text-right sm:shrink-0 text-xs text-slate-500">
                    <p>Reported: {format(new Date(c.createdAt), 'MMM d, yyyy')}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      SLA Due: {format(new Date(c.slaDueAt), 'MMM d, h:mm a')}
                    </p>
                  </div>
                </div>

                {/* Status Stepper */}
                <div className="py-5">
                  <div className="flex items-center justify-between relative">
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-slate-200 dark:bg-slate-700 w-full z-0" />
                    <div
                      className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-brand-600 transition-all duration-500 z-0"
                      style={{
                        width: `${(currentStepIdx / (STEPS.length - 1)) * 100}%`,
                      }}
                    />

                    {STEPS.map((step, idx) => {
                      const isCompleted = idx <= currentStepIdx;
                      const isCurrent = idx === currentStepIdx;

                      return (
                        <div
                          key={step}
                          className="flex flex-col items-center relative z-10 text-center"
                        >
                          <div
                            className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold transition ${
                              isCompleted
                                ? 'bg-brand-600 text-white ring-4 ring-white dark:ring-slate-800'
                                : 'bg-slate-300 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : idx + 1}
                          </div>
                          <span
                            className={`text-[10px] uppercase font-bold mt-1.5 whitespace-nowrap ${
                              isCurrent
                                ? 'text-brand-600 dark:text-brand-400'
                                : 'text-slate-400'
                            }`}
                          >
                            {step.replace('_', ' ')}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs">
                  <span className="text-slate-500">
                    {c.assignedTo
                      ? `Assigned to: ${c.assignedTo.name}`
                      : 'Awaiting technician assignment'}
                  </span>

                  <div className="flex items-center gap-2">
                    {c.status === 'resolved' && !c.feedback?.rating && (
                      <span className="text-emerald-600 font-semibold flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-current" /> Feedback Pending
                      </span>
                    )}

                    <Link to={`/m4/complaints/${c._id}`}>
                      <Button variant="outline" size="sm" className="gap-1">
                        View Detail & History <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyComplaints;
