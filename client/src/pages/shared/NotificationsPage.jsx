import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { Bell, Check, ArrowRight, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { useNotificationStore } from '../../store/notificationStore';

const TYPES = ['timetable', 'room', 'lostfound', 'attendance', 'visitor', 'complaint', 'event', 'system'];

const NotificationsPage = () => {
  const navigate = useNavigate();
  const { markAsRead, markAllAsRead } = useNotificationStore();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('');
  const [filterRead, setFilterRead] = useState('all'); // 'all' | 'unread'

  const fetchNotifs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/notifications?limit=50');
      setNotifications(res.data || []);
    } catch (err) {
      toast.error(err.message || 'Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, []);

  const filtered = notifications.filter((n) => {
    if (selectedType && n.type !== selectedType) return false;
    if (filterRead === 'unread' && n.isRead) return false;
    return true;
  });

  const handleItemClick = async (notif) => {
    if (!notif.isRead) {
      await markAsRead(notif._id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === notif._id ? { ...n, isRead: true } : n))
      );
    }
    if (notif.link) {
      navigate(notif.link);
    }
  };

  const handleMarkAll = async () => {
    await markAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    toast.success('All notifications marked as read');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Bell className="h-6 w-6 text-brand-600" /> Notification Center
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time multi-channel alerts across timetables, attendance, gate passes, complaints, and events.
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={handleMarkAll} className="gap-1.5">
          <Check className="h-4 w-4 text-emerald-600" /> Mark All as Read
        </Button>
      </div>

      {/* Filter Chips */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setSelectedType('')}
          className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
            !selectedType
              ? 'bg-brand-600 text-white'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
          }`}
        >
          All Categories
        </button>
        {TYPES.map((t) => (
          <button
            key={t}
            onClick={() => setSelectedType(t)}
            className={`px-3 py-1 rounded-full text-xs font-semibold capitalize transition ${
              selectedType === t
                ? 'bg-brand-600 text-white'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* List */}
      <Card>
        {loading ? (
          <LoadingSpinner />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="No notifications found"
            description="You are caught up with all campus activities."
          />
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
            {filtered.map((n) => (
              <div
                key={n._id}
                onClick={() => handleItemClick(n)}
                className={`p-4 transition cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60 text-xs flex items-start justify-between gap-4 ${
                  !n.isRead ? 'bg-brand-50/40 dark:bg-brand-950/20' : ''
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                      {n.title}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 capitalize">
                      {n.type}
                    </span>
                    {!n.isRead && (
                      <span className="h-2 w-2 rounded-full bg-brand-500 shrink-0" />
                    )}
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                    {n.message}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {format(new Date(n.createdAt), 'MMM d, yyyy - h:mm a')}
                  </p>
                </div>

                {n.link && (
                  <ArrowRight className="h-4 w-4 text-slate-400 shrink-0 mt-1" />
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default NotificationsPage;
