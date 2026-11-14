import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import {
  Sparkles,
  Calendar,
  MapPin,
  Users,
  CheckCircle2,
  Clock,
  ArrowLeft,
  XCircle,
  Star,
  QrCode,
  ShieldAlert,
} from 'lucide-react';
import { format } from 'date-fns';
import { useAuthStore } from '../../store/authStore';

const EventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Feedback State
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  const fetchEvent = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/events/${id}`);
      setEvent(res.data);
    } catch (err) {
      toast.error(err.message || 'Failed to load event details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvent();
  }, [id]);

  const handleRegister = async () => {
    setActionLoading(true);
    try {
      const res = await api.post(`/events/${id}/register`);
      toast.success(res.message);
      fetchEvent();
    } catch (err) {
      toast.error(err.message || 'Failed to register for event');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelRegistration = async () => {
    if (!window.confirm('Cancel your registration for this event? If registered, a waitlisted attendee will be promoted.')) return;
    setActionLoading(true);
    try {
      const res = await api.delete(`/events/${id}/register`);
      toast.success(res.message);
      fetchEvent();
    } catch (err) {
      toast.error(err.message || 'Failed to cancel registration');
    } finally {
      setActionLoading(false);
    }
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    setSubmittingFeedback(true);
    try {
      const res = await api.post(`/events/${id}/feedback`, {
        rating,
        comment: feedbackComment,
      });
      toast.success(res.message);
      setFeedbackModalOpen(false);
      fetchEvent();
    } catch (err) {
      toast.error(err.message || 'Failed to submit feedback');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!event) return <div className="p-8 text-center">Event not found</div>;

  const isOrganizer = user?._id === event.organizer?._id || user?.role === 'admin';
  const isRegistered = event.userRegistration?.status === 'registered';
  const isWaitlisted = event.userRegistration?.status === 'waitlisted';
  const isAttended = event.userRegistration?.status === 'attended';
  const isFull = event.registeredCount >= event.capacity;
  const deadlinePassed = new Date() > new Date(event.registrationDeadline);

  const apiBase =
    import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL.startsWith('http')
      ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '')
      : '';

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Events
        </button>

        {isOrganizer && (
          <Link to={`/m5/events/${event._id}/checkin`}>
            <Button variant="outline" size="sm" className="gap-1.5">
              <QrCode className="h-4 w-4 text-brand-600" /> Check-in Attendees & Pass
            </Button>
          </Link>
        )}
      </div>

      <Card>
        {/* Poster */}
        {event.poster && (
          <div className="h-64 w-full rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-700/40 mb-6 border border-slate-200 dark:border-slate-700">
            <img
              src={`${apiBase}${event.poster}`}
              alt={event.title}
              className="h-full w-full object-cover"
              onError={(e) => (e.target.style.display = 'none')}
            />
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-700/60">
          <div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-brand-100 text-brand-800 dark:bg-brand-950/60 dark:text-brand-300">
              {event.category}
            </span>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2">
              {event.title}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Organized by {event.organizer?.name} ({event.organizer?.department})
            </p>
          </div>

          {/* Registration Status Pill */}
          <div>
            {isAttended && (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" /> Attended Event
              </span>
            )}
            {isRegistered && (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" /> RSVP Confirmed
              </span>
            )}
            {isWaitlisted && (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 flex items-center gap-1">
                <Clock className="h-4 w-4" /> On Priority Waitlist
              </span>
            )}
          </div>
        </div>

        {/* Schedule & Venue Meta */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-4 border-b border-slate-100 dark:border-slate-700/60 text-xs">
          <div className="flex items-start gap-2.5 text-slate-700 dark:text-slate-300">
            <Calendar className="h-4 w-4 text-brand-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-900 dark:text-slate-100">Date & Time</p>
              <p>{format(new Date(event.startAt), 'EEEE, MMMM d, yyyy')}</p>
              <p className="text-slate-500">
                {format(new Date(event.startAt), 'h:mm a')} &ndash; {format(new Date(event.endAt), 'h:mm a')}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 text-slate-700 dark:text-slate-300">
            <MapPin className="h-4 w-4 text-brand-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-900 dark:text-slate-100">Venue</p>
              <p>{event.venue}</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 text-slate-700 dark:text-slate-300">
            <Users className="h-4 w-4 text-brand-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-900 dark:text-slate-100">Capacity & RSVP</p>
              <p>
                {event.registeredCount} / {event.capacity} Registered
              </p>
              {isFull && (
                <p className="text-amber-600 dark:text-amber-400 font-medium">
                  {event.waitlistedCount} waitlisted
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Description & Target audience */}
        <div className="py-4 space-y-4 text-xs">
          <div>
            <h4 className="font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px] mb-1">
              About This Event
            </h4>
            <p className="text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-line text-sm">
              {event.description}
            </p>
          </div>

          {/* Target constraints */}
          {(event.targetDepartments?.length > 0 || event.targetYears?.length > 0 || event.targetClubs?.length > 0) && (
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 space-y-1 text-slate-600 dark:text-slate-400 text-xs">
              <p className="font-semibold text-slate-800 dark:text-slate-200">
                Target Audience Restrictions:
              </p>
              {event.targetDepartments?.length > 0 && (
                <p>&bull; Departments: {event.targetDepartments.join(', ')}</p>
              )}
              {event.targetYears?.length > 0 && (
                <p>&bull; Eligible Years: {event.targetYears.join(', ')}</p>
              )}
              {event.targetClubs?.length > 0 && (
                <p>&bull; Participating Clubs: {event.targetClubs.join(', ')}</p>
              )}
            </div>
          )}

          {/* RSVP Actions Bar */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100 dark:border-slate-700/60">
            <div>
              <span className="text-[11px] text-slate-400 block">Registration Deadline</span>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {format(new Date(event.registrationDeadline), 'MMM d, yyyy - h:mm a')}
              </span>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              {!isRegistered && !isWaitlisted && !isAttended && (
                <Button
                  onClick={handleRegister}
                  loading={actionLoading}
                  disabled={deadlinePassed}
                  variant={isFull ? 'teal' : 'primary'}
                  className="w-full sm:w-auto"
                >
                  {deadlinePassed
                    ? 'Registration Closed'
                    : isFull
                    ? 'Join Priority Waitlist'
                    : 'Register for Event'}
                </Button>
              )}

              {(isRegistered || isWaitlisted) && (
                <Button
                  onClick={handleCancelRegistration}
                  loading={actionLoading}
                  variant="outline"
                  className="w-full sm:w-auto text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                >
                  Cancel Registration
                </Button>
              )}

              {(isRegistered || isAttended) && (
                <Button
                  variant="ghost"
                  onClick={() => setFeedbackModalOpen(true)}
                  className="gap-1.5"
                >
                  <Star className="h-4 w-4 text-amber-500 fill-current" />
                  {event.userRegistration?.feedback?.rating ? 'Update Feedback' : 'Give Feedback'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Feedback Modal */}
      <Modal
        isOpen={feedbackModalOpen}
        onClose={() => setFeedbackModalOpen(false)}
        title="Event Attendee Feedback"
      >
        <form onSubmit={handleFeedbackSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
              How would you rate this event? (1 to 5 Stars) *
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
              Your Feedback / Highlights
            </label>
            <textarea
              rows="3"
              value={feedbackComment}
              onChange={(e) => setFeedbackComment(e.target.value)}
              placeholder="What did you learn? What should be improved in the next edition?"
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setFeedbackModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={submittingFeedback}>
              Save Feedback
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default EventDetail;
