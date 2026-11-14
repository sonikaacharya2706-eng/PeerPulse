import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { CalendarDays, Plus, CheckCircle, XCircle, AlertCircle, Clock, Check, X } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { format } from 'date-fns';

const RoomBookings = () => {
  const user = useAuthStore((state) => state.user);
  const location = useLocation();

  const [bookings, setBookings] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [decisionModalOpen, setDecisionModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [decisionStatus, setDecisionStatus] = useState('approved');
  const [adminRemark, setAdminRemark] = useState('');

  // Conflict error banner state (409)
  const [conflictError, setConflictError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    classroom: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '14:00',
    endTime: '15:30',
    purpose: '',
    expectedStrength: '30',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [bookingsRes, roomsRes] = await Promise.all([
        api.get('/bookings'),
        api.get('/classrooms'),
      ]);
      setBookings(bookingsRes.data || []);
      setClassrooms(roomsRes.data || []);

      // Handle redirect prefill from FreeRoomFinder
      if (location.state?.prefillRoomId) {
        setForm((prev) => ({
          ...prev,
          classroom: location.state.prefillRoomId,
          date: location.state.prefillDate || prev.date,
          startTime: location.state.prefillStartTime || prev.startTime,
          endTime: location.state.prefillEndTime || prev.endTime,
        }));
        setRequestModalOpen(true);
      } else if (roomsRes.data && roomsRes.data.length > 0 && !form.classroom) {
        setForm((prev) => ({ ...prev, classroom: roomsRes.data[0]._id }));
      }
    } catch (err) {
      toast.error(err.message || 'Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateBooking = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setConflictError(null);

    try {
      const res = await api.post('/bookings', form);
      toast.success(res.message || 'Booking submitted successfully');
      setRequestModalOpen(false);
      setForm({
        classroom: classrooms[0]?._id || '',
        date: new Date().toISOString().split('T')[0],
        startTime: '14:00',
        endTime: '15:30',
        purpose: '',
        expectedStrength: '30',
      });
      fetchData();
    } catch (err) {
      // Acceptance Test 1 verification:
      if (err.status === 409) {
        setConflictError(err.message);
        toast.error('Booking conflict detected (HTTP 409)');
      } else {
        toast.error(err.message || 'Booking failed');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDecisionSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBooking) return;

    setSubmitting(true);
    try {
      const res = await api.patch(`/bookings/${selectedBooking._id}/decision`, {
        status: decisionStatus,
        adminRemark,
      });
      toast.success(res.message);
      setDecisionModalOpen(false);
      setSelectedBooking(null);
      setAdminRemark('');
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Decision update failed');
    } finally {
      setSubmitting(false);
    }
  };

  const openDecisionModal = (booking, status) => {
    setSelectedBooking(booking);
    setDecisionStatus(status);
    setAdminRemark('');
    setDecisionModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <CalendarDays className="h-6 w-6 text-brand-600" /> Room Bookings
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {user?.role === 'admin'
              ? 'Review, approve, or reject campus room reservation requests'
              : 'Reserve classroom facilities for guest lectures, workshops, and student activities'}
          </p>
        </div>

        {['faculty', 'admin'].includes(user?.role) && (
          <Button onClick={() => setRequestModalOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Request Room Booking
          </Button>
        )}
      </div>

      <Card>
        {loading ? (
          <LoadingSpinner />
        ) : bookings.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="No bookings recorded"
            description="You have no pending or past room reservations."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40 text-slate-500 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">Classroom</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Purpose</th>
                  <th className="py-3 px-4">Requested By</th>
                  <th className="py-3 px-4">Status</th>
                  {user?.role === 'admin' && (
                    <th className="py-3 px-4 text-right">Review Action</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {bookings.map((b) => (
                  <tr key={b._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-slate-100">
                      {b.classroom?.roomNo || 'Room'}
                      <span className="block text-[11px] font-normal text-slate-500">
                        {b.classroom?.building}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                        {format(new Date(b.date), 'EEE, MMM d, yyyy')}
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {b.startTime} - {b.endTime}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="font-medium text-slate-800 dark:text-slate-200 truncate">
                        {b.purpose}
                      </p>
                      <span className="text-[10px] text-slate-500">
                        Expected strength: {b.expectedStrength}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-medium text-slate-800 dark:text-slate-200 block">
                        {b.requestedBy?.name}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {b.requestedBy?.department}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                          b.status === 'approved'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                            : b.status === 'rejected'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
                        }`}
                      >
                        {b.status}
                      </span>
                      {b.adminRemark && (
                        <p className="text-[10px] text-slate-400 mt-1 italic">
                          Remark: {b.adminRemark}
                        </p>
                      )}
                    </td>

                    {user?.role === 'admin' && (
                      <td className="py-3.5 px-4 text-right">
                        {b.status === 'pending' ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openDecisionModal(b, 'approved')}
                              className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60"
                              title="Approve Booking"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => openDecisionModal(b, 'rejected')}
                              className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60"
                              title="Reject Booking"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400">Processed</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Booking Request Modal */}
      <Modal
        isOpen={requestModalOpen}
        onClose={() => setRequestModalOpen(false)}
        title="Request Room Reservation"
      >
        <form onSubmit={handleCreateBooking} className="space-y-3.5">
          {/* Conflict Error Notice (Acceptance Test 1) */}
          {conflictError && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">409 Conflict Detected</p>
                <p>{conflictError}</p>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Select Classroom *
            </label>
            <select
              required
              value={form.classroom}
              onChange={(e) => setForm({ ...form, classroom: e.target.value })}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              {classrooms.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.roomNo} ({c.building} - Capacity: {c.capacity})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Date *
              </label>
              <input
                type="date"
                required
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

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

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Purpose of Booking *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Guest Lecture on Cloud Computing"
              value={form.purpose}
              onChange={(e) => setForm({ ...form, purpose: e.target.value })}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Expected Strength *
            </label>
            <input
              type="number"
              min="1"
              required
              value={form.expectedStrength}
              onChange={(e) => setForm({ ...form, expectedStrength: e.target.value })}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <Button variant="ghost" onClick={() => setRequestModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              Submit Request
            </Button>
          </div>
        </form>
      </Modal>

      {/* Admin Decision Modal */}
      <Modal
        isOpen={decisionModalOpen}
        onClose={() => setDecisionModalOpen(false)}
        title={`${decisionStatus === 'approved' ? 'Approve' : 'Reject'} Booking Request`}
      >
        <form onSubmit={handleDecisionSubmit} className="space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-300">
            You are about to{' '}
            <strong className={decisionStatus === 'approved' ? 'text-emerald-600' : 'text-rose-600'}>
              {decisionStatus}
            </strong>{' '}
            the booking for <strong>{selectedBooking?.classroom?.roomNo}</strong> on{' '}
            {selectedBooking?.date ? format(new Date(selectedBooking.date), 'yyyy-MM-dd') : ''} (
            {selectedBooking?.startTime} - {selectedBooking?.endTime}) requested by{' '}
            {selectedBooking?.requestedBy?.name}.
          </p>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Admin Remark / Notes
            </label>
            <textarea
              rows="3"
              value={adminRemark}
              onChange={(e) => setAdminRemark(e.target.value)}
              placeholder="e.g. Approved. Please ensure projector is turned off."
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setDecisionModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant={decisionStatus === 'approved' ? 'primary' : 'danger'}
              loading={submitting}
            >
              Confirm {decisionStatus}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default RoomBookings;
