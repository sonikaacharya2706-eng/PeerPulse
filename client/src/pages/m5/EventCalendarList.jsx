import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import {
  Sparkles,
  Plus,
  Calendar,
  List,
  MapPin,
  Users,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { format } from 'date-fns';
import { useAuthStore } from '../../store/authStore';

const CATEGORIES = [
  'academic',
  'cultural',
  'sports',
  'technical',
  'workshop',
  'club',
  'other',
];

const EventCalendarList = () => {
  const user = useAuthStore((state) => state.user);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'calendar'
  const [category, setCategory] = useState('');

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        ...(category && { category }),
      });
      const res = await api.get(`/events?${params.toString()}`);
      setEvents(res.data || []);
    } catch (err) {
      toast.error(err.message || 'Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [category]);

  const apiBase =
    import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL.startsWith('http')
      ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '')
      : '';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-brand-600" /> Smart Campus Events & Activities
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Discover workshops, fests, technical hackathons, guest lectures, and student club activities.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex rounded-lg border border-slate-300 dark:border-slate-700 p-1 bg-white dark:bg-slate-800">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition ${
                viewMode === 'list'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <List className="h-4 w-4" /> Cards
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`p-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition ${
                viewMode === 'calendar'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <Calendar className="h-4 w-4" /> Timeline
            </button>
          </div>

          {['faculty', 'admin'].includes(user?.role) && (
            <Link to="/m5/manage">
              <Button size="sm" className="gap-1.5">
                <Plus className="h-4 w-4" /> Create Event
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setCategory('')}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
            !category
              ? 'bg-brand-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
          }`}
        >
          All Events
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition ${
              category === cat
                ? 'bg-brand-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Event Cards Grid */}
      {loading ? (
        <LoadingSpinner />
      ) : events.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="No events found"
          description="There are currently no scheduled events matching your category filter."
        />
      ) : viewMode === 'list' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {events.map((evt) => {
            const isFull = evt.registeredCount >= evt.capacity;
            const isRegistered = evt.userRegistration?.status === 'registered';
            const isWaitlisted = evt.userRegistration?.status === 'waitlisted';

            return (
              <div
                key={evt._id}
                className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/80 overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  {/* Poster or banner */}
                  <div className="h-44 w-full bg-slate-100 dark:bg-slate-700/40 relative overflow-hidden flex items-center justify-center">
                    {evt.poster ? (
                      <img
                        src={`${apiBase}${evt.poster}`}
                        alt={evt.title}
                        className="h-full w-full object-cover"
                        onError={(e) => (e.target.style.display = 'none')}
                      />
                    ) : (
                      <Sparkles className="h-10 w-10 text-slate-300 dark:text-slate-600" />
                    )}

                    <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-900/80 text-white backdrop-blur-sm">
                      {evt.category}
                    </span>

                    {/* Status badge */}
                    {isRegistered && (
                      <span className="absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white shadow-sm">
                        ✓ Registered
                      </span>
                    )}

                    {isWaitlisted && (
                      <span className="absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white shadow-sm">
                        ⏳ Waitlisted
                      </span>
                    )}
                  </div>

                  <div className="p-4">
                    <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 line-clamp-1">
                      {evt.title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 line-clamp-2">
                      {evt.description}
                    </p>

                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60 space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span>{format(new Date(evt.startAt), 'EEE, MMM d, yyyy • h:mm a')}</span>
                      </div>
                      <div className="flex items-center gap-1.5 truncate">
                        <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{evt.venue}</span>
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-1 text-[11px]">
                          <Users className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span>
                            {evt.registeredCount} / {evt.capacity} Seats Filled
                          </span>
                        </div>
                        {isFull && !isRegistered && (
                          <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                            ({evt.waitlistedCount} waitlisted)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 pt-0">
                  <Link
                    to={`/m5/events/${evt._id}`}
                    className="flex items-center justify-center w-full py-2 px-3 rounded-lg text-xs font-semibold bg-brand-50 hover:bg-brand-600 hover:text-white dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 dark:hover:bg-brand-600 dark:hover:text-white transition gap-1.5"
                  >
                    View Details & RSVP <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Timeline View */
        <div className="space-y-4">
          {events.map((evt) => (
            <Card key={evt._id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="h-14 w-14 rounded-xl bg-brand-100 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 font-bold flex flex-col items-center justify-center shrink-0">
                  <span className="text-[10px] uppercase">{format(new Date(evt.startAt), 'MMM')}</span>
                  <span className="text-lg leading-none">{format(new Date(evt.startAt), 'd')}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
                    {evt.category}
                  </span>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    {evt.title}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {format(new Date(evt.startAt), 'h:mm a')} &ndash; {format(new Date(evt.endAt), 'h:mm a')} &bull; {evt.venue}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 sm:shrink-0 w-full sm:w-auto justify-end">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  {evt.registeredCount}/{evt.capacity} Seats
                </span>
                <Link to={`/m5/events/${evt._id}`}>
                  <Button size="sm">RSVP</Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default EventCalendarList;
