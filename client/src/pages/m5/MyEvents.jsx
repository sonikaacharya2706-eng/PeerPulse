import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { CalendarCheck, MapPin, Calendar, CheckCircle2, Clock, Star, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';

const MyEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMyEvents = async () => {
    setLoading(true);
    try {
      const res = await api.get('/events');
      // Filter events where user has an active registration
      const myRegistered = (res.data || []).filter(
        (e) => e.userRegistration && e.userRegistration.status !== 'cancelled'
      );
      setEvents(myRegistered);
    } catch (err) {
      toast.error(err.message || 'Failed to fetch registered events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyEvents();
  }, []);

  const handleCancelRegistration = async (eventId) => {
    if (!window.confirm('Cancel registration for this event?')) return;
    try {
      const res = await api.delete(`/events/${eventId}/register`);
      toast.success(res.message);
      fetchMyEvents();
    } catch (err) {
      toast.error(err.message || 'Failed to cancel registration');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <CalendarCheck className="h-6 w-6 text-brand-600" /> My Event Registrations
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Upcoming activities, confirmed RSVP passes, priority waitlist standings, and feedback.
        </p>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : events.length === 0 ? (
        <EmptyState
          icon={CalendarCheck}
          title="No registered events"
          description="Explore the campus event calendar and register for upcoming sessions!"
          action={
            <Link to="/m5/events">
              <Button size="sm">Browse Events</Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          {events.map((evt) => {
            const reg = evt.userRegistration;
            const isConfirmed = reg?.status === 'registered';
            const isWaitlisted = reg?.status === 'waitlisted';
            const isAttended = reg?.status === 'attended';

            return (
              <Card key={evt._id} className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
                        {evt.category}
                      </span>

                      {isAttended && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                          ✓ Attended
                        </span>
                      )}

                      {isConfirmed && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                          ✓ Confirmed Seat
                        </span>
                      )}

                      {isWaitlisted && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                          ⏳ Waitlisted
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 mt-1">
                      {evt.title}
                    </h3>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-2">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        <span>{format(new Date(evt.startAt), 'EEE, MMM d, yyyy • h:mm a')}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-slate-400" />
                        <span>{evt.venue}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:shrink-0">
                    <Link to={`/m5/events/${evt._id}`}>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </Link>

                    {(isConfirmed || isWaitlisted) && (
                      <button
                        onClick={() => handleCancelRegistration(evt._id)}
                        className="text-xs text-rose-600 hover:underline px-2 py-1 font-medium"
                      >
                        Cancel RSVP
                      </button>
                    )}
                  </div>
                </div>

                {reg?.feedback?.rating && (
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center gap-2 text-xs text-amber-600">
                    <Star className="h-4 w-4 fill-current" />
                    <span>You rated this event {reg.feedback.rating}/5 stars: "{reg.feedback.comment}"</span>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyEvents;
