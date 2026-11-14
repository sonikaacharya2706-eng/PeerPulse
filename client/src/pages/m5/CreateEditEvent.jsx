import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { PlusCircle, Sparkles, Calendar, MapPin, Users, Trash2, Edit3, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';

const CATEGORIES = [
  'academic',
  'cultural',
  'sports',
  'technical',
  'workshop',
  'club',
  'other',
];

const CreateEditEvent = () => {
  const navigate = useNavigate();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    title: '',
    category: 'technical',
    description: '',
    venue: '',
    startAt: '',
    endAt: '',
    capacity: '100',
    registrationDeadline: '',
    targetDepartments: '',
    targetYears: '',
    targetClubs: '',
  });

  const [posterFile, setPosterFile] = useState(null);

  const fetchMyEvents = async () => {
    setLoading(true);
    try {
      const res = await api.get('/events?mine=true');
      setEvents(res.data || []);
    } catch (err) {
      toast.error(err.message || 'Failed to load your events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyEvents();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.venue || !form.startAt || !form.endAt || !form.registrationDeadline) {
      toast.error('Please fill in all mandatory event fields');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      Object.keys(form).forEach((k) => formData.append(k, form[k]));
      if (posterFile) formData.append('poster', posterFile);

      const res = await api.post('/events', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success(res.message || 'Event created successfully');
      setForm({
        title: '',
        category: 'technical',
        description: '',
        venue: '',
        startAt: '',
        endAt: '',
        capacity: '100',
        registrationDeadline: '',
        targetDepartments: '',
        targetYears: '',
        targetClubs: '',
      });
      setPosterFile(null);
      fetchMyEvents();
    } catch (err) {
      toast.error(err.message || 'Failed to create event');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelEvent = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this event? Registered attendees will be notified.')) return;
    try {
      await api.delete(`/events/${id}`);
      toast.success('Event cancelled');
      fetchMyEvents();
    } catch (err) {
      toast.error(err.message || 'Failed to cancel event');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <PlusCircle className="h-6 w-6 text-brand-600" /> Host & Manage Campus Events
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Publish activities, set registration quotas, specify target student audiences, and monitor check-ins.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Create Form */}
        <div className="lg:col-span-2">
          <Card title="Publish New Event" subtitle="Fill in schedule and capacity constraints">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Event Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Annual Campus Hackathon 2026"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Category *
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500 capitalize"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Event Description *
                </label>
                <textarea
                  required
                  rows="3"
                  placeholder="Outline event agenda, speaker details, rules, prizes..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Venue *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Main Auditorium / Lab 3"
                    value={form.venue}
                    onChange={(e) => setForm({ ...form, venue: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Capacity (Seats) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={form.capacity}
                    onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Start Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={form.startAt}
                    onChange={(e) => setForm({ ...form, startAt: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    End Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={form.endAt}
                    onChange={(e) => setForm({ ...form, endAt: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    RSVP Deadline *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={form.registrationDeadline}
                    onChange={(e) => setForm({ ...form, registrationDeadline: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Target Depts (csv)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. CSE, ECE"
                    value={form.targetDepartments}
                    onChange={(e) => setForm({ ...form, targetDepartments: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Target Years (csv)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 2, 3"
                    value={form.targetYears}
                    onChange={(e) => setForm({ ...form, targetYears: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Target Clubs (csv)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Coding Club"
                    value={form.targetClubs}
                    onChange={(e) => setForm({ ...form, targetClubs: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Event Poster Photo
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPosterFile(e.target.files[0])}
                  className="text-xs text-slate-500"
                />
              </div>

              <div className="flex justify-end pt-3">
                <Button type="submit" loading={submitting}>
                  Create Event
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Right: My Managed Events List */}
        <div>
          <Card title="My Events Portfolio" subtitle="Events you have organized">
            {loading ? (
              <LoadingSpinner />
            ) : events.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">
                You haven't published any events yet.
              </p>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700/60">
                {events.map((evt) => (
                  <div key={evt._id} className="pt-3 first:pt-0 text-xs">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-bold text-slate-900 dark:text-slate-100 truncate">
                        {evt.title}
                      </h4>
                      <button
                        onClick={() => handleCancelEvent(evt._id)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded"
                        title="Cancel Event"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <p className="text-slate-500 text-[11px] mt-0.5">
                      {format(new Date(evt.startAt), 'MMM d, yyyy • h:mm a')}
                    </p>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <span className="font-semibold text-teal-600 dark:text-teal-400">
                        {evt.registeredCount}/{evt.capacity} RSVP
                      </span>

                      <Link
                        to={`/m5/events/${evt._id}/checkin`}
                        className="text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1 font-medium"
                      >
                        Check-in & Pass &rarr;
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CreateEditEvent;
