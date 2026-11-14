import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { Sliders, Plus, Trash2, Edit3, AlertCircle, Calendar } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const TimetableManager = () => {
  const user = useAuthStore((state) => state.user);

  const [entries, setEntries] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [conflictError, setConflictError] = useState(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    classroom: '',
    subject: '',
    faculty: user?.role === 'faculty' ? user._id : '',
    department: 'CSE',
    year: '2',
    section: 'A',
    dayOfWeek: '1',
    startTime: '09:00',
    endTime: '10:00',
    note: '',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ttRes, roomsRes, facRes] = await Promise.all([
        api.get('/timetable'),
        api.get('/classrooms'),
        api.get('/users?role=faculty&limit=50'),
      ]);
      setEntries(ttRes.data || []);
      setClassrooms(roomsRes.data || []);
      setFaculties(facRes.data || []);
      if (roomsRes.data && roomsRes.data.length > 0 && !form.classroom) {
        setForm((prev) => ({ ...prev, classroom: roomsRes.data[0]._id }));
      }
    } catch (err) {
      toast.error(err.message || 'Failed to load timetable data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    setEditingId(null);
    setConflictError(null);
    setForm({
      classroom: classrooms[0]?._id || '',
      subject: '',
      faculty: user?.role === 'faculty' ? user._id : faculties[0]?._id || '',
      department: user?.department || 'CSE',
      year: '2',
      section: 'A',
      dayOfWeek: '1',
      startTime: '09:00',
      endTime: '10:00',
      note: '',
    });
    setModalOpen(true);
  };

  const openEditModal = (entry) => {
    setEditingId(entry._id);
    setConflictError(null);
    setForm({
      classroom: entry.classroom?._id || entry.classroom,
      subject: entry.subject,
      faculty: entry.faculty?._id || entry.faculty,
      department: entry.department,
      year: String(entry.year),
      section: entry.section,
      dayOfWeek: String(entry.dayOfWeek),
      startTime: entry.startTime,
      endTime: entry.endTime,
      note: entry.note || '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setConflictError(null);

    try {
      if (editingId) {
        await api.put(`/timetable/${editingId}`, form);
        toast.success('Timetable entry updated');
      } else {
        await api.post('/timetable', form);
        toast.success('Timetable entry created');
      }
      setModalOpen(false);
      fetchData();
    } catch (err) {
      // Acceptance Test 1: Conflict message
      if (err.status === 409) {
        setConflictError(err.message);
        toast.error('Scheduling conflict detected (HTTP 409)');
      } else {
        toast.error(err.message || 'Operation failed');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this timetable slot?')) return;
    try {
      await api.delete(`/timetable/${id}`);
      toast.success('Timetable slot deleted');
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to delete slot');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Sliders className="h-6 w-6 text-brand-600" /> Timetable Manager
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Author and maintain campus class schedules with automated clash prevention.
          </p>
        </div>

        <Button onClick={openCreateModal} className="gap-2">
          <Plus className="h-4 w-4" /> Add Timetable Slot
        </Button>
      </div>

      <Card>
        {loading ? (
          <LoadingSpinner />
        ) : entries.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="No timetable entries"
            description="Create class timetable slots to populate room calendars."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40 text-slate-500 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">Day & Time</th>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Classroom</th>
                  <th className="py-3 px-4">Faculty</th>
                  <th className="py-3 px-4">Class</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {entries.map((e) => (
                  <tr key={e._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-900 dark:text-slate-100 block">
                        {DAYS[e.dayOfWeek]}
                      </span>
                      <span className="text-slate-500 text-[11px]">
                        {e.startTime} - {e.endTime}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-brand-600 dark:text-brand-400">
                      {e.subject}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {e.classroom?.roomNo || 'Room'}
                      </span>
                      <span className="block text-[10px] text-slate-400">
                        {e.classroom?.building}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                      {e.faculty?.name || 'Prof. Unassigned'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                        {e.department} Yr {e.year} Sec {e.section}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(e)}
                          className="p-1 rounded text-slate-500 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(e._id)}
                          className="p-1 rounded text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Edit Timetable Entry' : 'Schedule Timetable Slot'}
      >
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Conflict Error Notice (409) */}
          {conflictError && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Clash Conflict (HTTP 409)</p>
                <p>{conflictError}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Classroom *
              </label>
              <select
                required
                value={form.classroom}
                onChange={(e) => setForm({ ...form, classroom: e.target.value })}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {classrooms.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.roomNo} ({c.building} - Cap: {c.capacity})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Day of Week *
              </label>
              <select
                value={form.dayOfWeek}
                onChange={(e) => setForm({ ...form, dayOfWeek: e.target.value })}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {DAYS.map((name, idx) => (
                  <option key={idx} value={idx}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Subject Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Data Structures & Algorithms"
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Start Time *
              </label>
              <input
                type="time"
                required
                value={form.startTime}
                onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                End Time *
              </label>
              <input
                type="time"
                required
                value={form.endTime}
                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Dept *
              </label>
              <input
                type="text"
                required
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Year (1-4) *
              </label>
              <select
                value={form.year}
                onChange={(e) => setForm({ ...form, year: e.target.value })}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Section *
              </label>
              <input
                type="text"
                required
                value={form.section}
                onChange={(e) => setForm({ ...form, section: e.target.value })}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          {user?.role === 'admin' && (
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Assigned Faculty *
              </label>
              <select
                value={form.faculty}
                onChange={(e) => setForm({ ...form, faculty: e.target.value })}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {faculties.map((f) => (
                  <option key={f._id} value={f._id}>
                    {f.name} ({f.department})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              {editingId ? 'Save Changes' : 'Create Slot'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TimetableManager;
