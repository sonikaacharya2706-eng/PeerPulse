import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { CalendarCheck, Clock, MapPin, User, BookOpen } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const MySchedule = () => {
  const user = useAuthStore((state) => state.user);
  const [schedule, setSchedule] = useState({ today: [], weekly: [], currentDay: 1 });
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('today'); // 'today' | 'weekly'

  const fetchSchedule = async () => {
    setLoading(true);
    try {
      const res = await api.get('/timetable/my');
      setSchedule(res.data || { today: [], weekly: [], currentDay: 1 });
    } catch (err) {
      toast.error(err.message || 'Failed to fetch schedule');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedule();
  }, []);

  const todayName = DAYS[schedule.currentDay];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <CalendarCheck className="h-6 w-6 text-brand-600" /> My Schedule
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {user?.role === 'faculty' ? 'Your teaching timetable' : 'Your class lecture schedule'} &bull; Today is {todayName}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/m1/timetable">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <BookOpen className="h-3.5 w-3.5" /> Class Timetable Sheets
            </Button>
          </Link>

          <div className="flex rounded-lg border border-slate-300 dark:border-slate-700 p-1 bg-white dark:bg-slate-800">
            <button
              onClick={() => setViewMode('today')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
                viewMode === 'today'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Today's Classes ({schedule.today.length})
            </button>
            <button
              onClick={() => setViewMode('weekly')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
                viewMode === 'weekly'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Weekly Schedule
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : viewMode === 'today' ? (
        <div>
          {schedule.today.length === 0 ? (
            <EmptyState
              icon={CalendarCheck}
              title="No classes scheduled for today"
              description="Enjoy your free day or prepare for your upcoming lectures!"
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {schedule.today.map((slot) => (
                <div
                  key={slot._id}
                  className="rounded-xl border border-brand-200/80 dark:border-brand-900/40 bg-white dark:bg-slate-800 p-5 shadow-sm hover:shadow-md transition"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-brand-100 text-brand-800 dark:bg-brand-950/60 dark:text-brand-300">
                        {slot.department} &bull; Yr {slot.year} &bull; Sec {slot.section}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-2">
                        {slot.subject}
                      </h3>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-bold text-teal-600 dark:text-teal-400">
                        {slot.classroom?.roomNo}
                      </span>
                      <span className="block text-[11px] text-slate-400">
                        {slot.classroom?.building}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                    <div className="flex items-center gap-1.5 font-medium">
                      <Clock className="h-4 w-4 text-brand-500" />
                      <span>
                        {slot.startTime} &ndash; {slot.endTime}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-slate-500">
                      <User className="h-4 w-4" />
                      <span>{slot.faculty?.name}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Weekly view */
        <div className="space-y-4">
          {DAYS.map((dayName, dayIndex) => {
            const slots = schedule.weekly.filter((s) => s.dayOfWeek === dayIndex);
            if (slots.length === 0) return null;

            return (
              <Card key={dayIndex} title={`${dayName} (${slots.length} classes)`}>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {slots.map((s) => (
                    <div
                      key={s._id}
                      className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 text-xs"
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-slate-900 dark:text-slate-100 truncate">
                          {s.subject}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300">
                          {s.classroom?.roomNo}
                        </span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-400 font-medium text-[11px]">
                        {s.startTime} - {s.endTime}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-1 truncate">
                        Prof. {s.faculty?.name} &bull; Sec {s.section}
                      </p>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MySchedule;
