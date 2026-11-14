import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import {
  AlertTriangle,
  ArrowLeft,
  Clock,
  ShieldAlert,
  User,
  Star,
  CheckCircle2,
  Calendar,
  Image as ImageIcon,
} from 'lucide-react';
import { format } from 'date-fns';
import { useAuthStore } from '../../store/authStore';

const ComplaintDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);

  // Feedback Modal
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  const fetchComplaint = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/complaints/${id}`);
      setComplaint(res.data);
    } catch (err) {
      toast.error(err.message || 'Failed to load complaint');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaint();
  }, [id]);

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    setSubmittingFeedback(true);
    try {
      const res = await api.post(`/complaints/${id}/feedback`, {
        rating,
        comment: feedbackComment,
      });
      toast.success(res.message);
      setFeedbackModalOpen(false);
      fetchComplaint();
    } catch (err) {
      toast.error(err.message || 'Failed to submit feedback');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!complaint) return <div className="p-8 text-center">Ticket not found</div>;

  const isComplainant = user?._id === complaint.raisedBy?._id;
  const apiBase =
    import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL.startsWith('http')
      ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '')
      : '';

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Complaints
        </button>

        <div className="flex items-center gap-2">
          {complaint.escalated && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-rose-600 text-white animate-pulse">
              <ShieldAlert className="h-3.5 w-3.5" /> Auto-Escalated (SLA Breached)
            </span>
          )}

          <span
            className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
              complaint.status === 'closed'
                ? 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200'
                : complaint.status === 'resolved'
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                : 'bg-brand-100 text-brand-800 dark:bg-brand-950/60 dark:text-brand-300'
            }`}
          >
            {complaint.status.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* Ticket Summary Card */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-700/60">
          <div>
            <span className="font-mono text-xs font-bold text-brand-600 dark:text-brand-400">
              {complaint.ticketId}
            </span>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1 capitalize">
              {complaint.category} Issue in {complaint.building} ({complaint.room})
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Raised by {complaint.raisedBy?.name} ({complaint.raisedBy?.email})
            </p>
          </div>

          <div className="text-right text-xs text-slate-500 space-y-1">
            <p>Priority: <strong className="uppercase text-slate-800 dark:text-slate-200">{complaint.priority}</strong></p>
            <p>SLA Deadline: {format(new Date(complaint.slaDueAt), 'MMM d, h:mm a')}</p>
          </div>
        </div>

        <div className="py-4 space-y-3 text-xs">
          <h4 className="font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px]">
            Description of Problem
          </h4>
          <p className="text-slate-800 dark:text-slate-200 leading-relaxed bg-slate-50 dark:bg-slate-900/40 p-3.5 rounded-lg border border-slate-200/80 dark:border-slate-800">
            {complaint.description}
          </p>

          {/* Issue photos */}
          {complaint.images && complaint.images.length > 0 && (
            <div>
              <h5 className="font-semibold text-slate-600 dark:text-slate-400 mb-2">
                Attached Damage Photos:
              </h5>
              <div className="flex flex-wrap gap-2">
                {complaint.images.map((img, i) => (
                  <a
                    key={i}
                    href={`${apiBase}${img}`}
                    target="_blank"
                    rel="noreferrer"
                    className="h-20 w-20 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700"
                  >
                    <img src={`${apiBase}${img}`} alt="damage" className="h-full w-full object-cover" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Feedback Display if already closed */}
          {complaint.feedback?.rating && (
            <div className="mt-4 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
              <div className="flex items-center gap-1.5 text-amber-500 font-bold mb-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < complaint.feedback.rating
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-300 dark:text-slate-600'
                    }`}
                  />
                ))}
                <span className="text-xs text-amber-800 dark:text-amber-200 ml-1">
                  ({complaint.feedback.rating} / 5 Stars)
                </span>
              </div>
              <p className="text-xs text-amber-900 dark:text-amber-200 italic">
                "{complaint.feedback.comment || 'No written feedback'}"
              </p>
            </div>
          )}

          {/* Feedback Prompt button if resolved and not rated */}
          {isComplainant && complaint.status === 'resolved' && (
            <div className="mt-4 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
              <div>
                <p className="font-bold text-emerald-800 dark:text-emerald-300">
                  Technician marked this ticket as Resolved!
                </p>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                  Please confirm work quality and rate the resolution to close the ticket.
                </p>
              </div>
              <Button onClick={() => setFeedbackModalOpen(true)} className="gap-2">
                <Star className="h-4 w-4" /> Rate & Close
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Timeline Audit Stepper (Acceptance Test 7: records each step with timestamp and user) */}
      <Card title="Ticket Progression Timeline" subtitle="Immutable audit trail of actions taken on this complaint">
        <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-700">
          {complaint.timeline && complaint.timeline.map((step, idx) => (
            <div key={idx} className="relative">
              <div className="absolute -left-[27px] top-1 h-3.5 w-3.5 rounded-full bg-brand-600 ring-4 ring-white dark:ring-slate-800" />
              <div className="bg-slate-50 dark:bg-slate-900/50 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                    {step.status.replace('_', ' ')}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {format(new Date(step.at), 'MMM d, yyyy - h:mm:ss a')}
                  </span>
                </div>

                <p className="text-slate-800 dark:text-slate-200 font-medium">
                  {step.remark}
                </p>

                {step.by && (
                  <p className="text-[11px] text-slate-500 mt-1">
                    Action by: <strong>{step.by.name}</strong> ({step.by.role})
                  </p>
                )}

                {/* Step Images if maintenance uploaded completion proof */}
                {step.images && step.images.length > 0 && (
                  <div className="flex gap-2 mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                    {step.images.map((img, i) => (
                      <a
                        key={i}
                        href={`${apiBase}${img}`}
                        target="_blank"
                        rel="noreferrer"
                        className="h-14 w-14 rounded overflow-hidden border border-slate-300 dark:border-slate-700"
                      >
                        <img src={`${apiBase}${img}`} alt="step-proof" className="h-full w-full object-cover" />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Feedback Modal */}
      <Modal
        isOpen={feedbackModalOpen}
        onClose={() => setFeedbackModalOpen(false)}
        title="Submit Resolution Feedback"
      >
        <form onSubmit={handleFeedbackSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
              Rate Service Quality (1 to 5 Stars) *
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  className="p-1 hover:scale-110 transition"
                >
                  <Star
                    className={`h-7 w-7 ${
                      star <= rating
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-300 dark:text-slate-600'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Comments / Handover Satisfaction
            </label>
            <textarea
              rows="3"
              value={feedbackComment}
              onChange={(e) => setFeedbackComment(e.target.value)}
              placeholder="e.g. Work was completed quickly and area left clean!"
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setFeedbackModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={submittingFeedback}>
              Submit & Close Ticket
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ComplaintDetail;
