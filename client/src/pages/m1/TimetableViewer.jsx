import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { BookOpen, Calendar, Filter, User, Building } from 'lucide-react';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const TimetableViewer = () => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  const [classrooms, setClassrooms] = useState([]);
  const [faculties, setFaculties] = useState([]);

  const [filters, setFilters] = useState({
    department: 'CSE',
    year: '2',
    section: 'A',
    faculty: '',
    classroom: '',
  });

  const fetchDropdowns = async () => {
    try {
      const [roomsRes, usersRes] = await Promise.all([
        api.get('/classrooms'),
        api.get('/users?role=faculty&limit=50'),
      ]);
      setClassrooms(roomsRes.data || []);
      setFaculties(usersRes.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTimetable = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.department) params.append('department', filters.department);
      if (filters.year) params.append('year', filters.year);
      if (filters.section) params.append('section', filters.section);
      if (filters.faculty) params.append('faculty', filters.faculty);
      if (filters.classroom) params.append('classroom', filters.classroom);

      const res = await api.get(`/timetable?${params.toString()}`);
      setEntries(res.data || []);
    } catch (err) {
      toast.error(err.message || 'Failed to fetch timetable');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDropdowns();
  }, []);

  useEffect(() => {
    fetchTimetable();
  }, [filters]);

  // Group entries by Day of Week (0-6)
  const groupedByDay = DAYS.map((dayName, dayIndex) => {
    return {
      dayIndex,
      dayName,
      slots: entries.filter((e) => e.dayOfWeek === dayIndex),
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-brand-600" /> Timetable Viewer
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Browse weekly classroom schedules, subject slots, and faculty allocations.
          </p>
        </div>
      </div>

      {/* Filter Header */}
      <Card title="Filter Schedule" subtitle="Select Class or Faculty / Room">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div>
            <label className="block text-[11px] font-semibold uppercase text-slate-500 mb-1">
              Department
            </label>
            <input
              type="text"
              value={filters.department}
              onChange={(e) => setFilters({ ...filters, department: e.target.value })}
              placeholder="e.g. CSE"
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase text-slate-500 mb-1">
              Year
            </label>
            <select
              value={filters.year}
              onChange={(e) => setFilters({ ...filters, year: e.target.value })}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">Any Year</option>
              <option value="1">Year 1</option>
              <option value="2">Year 2</option>
              <option value="3">Year 3</option>
              <option value="4">Year 4</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase text-slate-500 mb-1">
              Section
            </label>
            <input
              type="text"
              value={filters.section}
              onChange={(e) => setFilters({ ...filters, section: e.target.value })}
              placeholder="e.g. A"
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase text-slate-500 mb-1">
              Faculty
            </label>
            <select
              value={filters.faculty}
              onChange={(e) => setFilters({ ...filters, faculty: e.target.value })}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">All Faculty</option>
              {faculties.map((f) => (
                <option key={f._id} value={f._id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase text-slate-500 mb-1">
              Classroom
            </label>
            <select
              value={filters.classroom}
              onChange={(e) => setFilters({ ...filters, classroom: e.target.value })}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">All Classrooms</option>
              {classrooms.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.roomNo} ({c.building})
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Weekly Schedule Grid */}
      {loading ? (
        <LoadingSpinner />
      ) : entries.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No timetable schedule found"
          description="Try broadening your department, year, section, or faculty filter."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {groupedByDay.map(({ dayIndex, dayName, slots }) => {
            // Exclude Sunday if no slots
            if (dayIndex === 0 && slots.length === 0) return null;

            return (
              <div
                key={dayIndex}
                className="bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm flex flex-col"
              >
                <div className="bg-slate-100 dark:bg-slate-700/50 px-4 py-2.5 border-b border-slate-200 dark:border-slate-700">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    {dayName}
                  </h3>
                  <span className="text-[10px] text-slate-500">{slots.length} classes</span>
                </div>

                <div className="p-3 space-y-2.5 flex-1">
                  {slots.length === 0 ? (
                    <p className="text-[11px] text-slate-400 text-center py-6">
                      No classes scheduled
                    </p>
                  ) : (
                    slots.map((slot) => (
                      <div
                        key={slot._id}
                        className="p-3 rounded-lg border border-brand-200/70 dark:border-brand-900/40 bg-brand-50/40 dark:bg-brand-950/20 text-xs transition hover:shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-1 mb-1">
                          <span className="font-bold text-brand-900 dark:text-brand-200 line-clamp-1">
                            {slot.subject}
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-white dark:bg-slate-800 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800 shrink-0">
                            {slot.classroom?.roomNo || 'Room'}
                          </span>
                        </div>

                        <p className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
                          {slot.startTime} &ndash; {slot.endTime}
                        </p>

                        <div className="mt-2 pt-2 border-t border-brand-100 dark:border-brand-900/40 text-[10px] text-slate-500 flex items-center justify-between">
                          <span className="truncate">Prof. {slot.faculty?.name || 'Faculty'}</span>
                          <span>Sec {slot.section}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TimetableViewer;
