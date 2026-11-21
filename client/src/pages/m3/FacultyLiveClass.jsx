import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import {
  QrCode,
  Users,
  Play,
  Square,
  Clock,
  RotateCw,
  MapPin,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useSocket } from '../../hooks/useSocket';

const FacultyLiveClass = () => {
  const socket = useSocket();

  const [classrooms, setClassrooms] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [qrDataURL, setQrDataURL] = useState('');
  const [countdown, setCountdown] = useState(20);
  const [attendees, setAttendees] = useState([]);
  const [starting, setStarting] = useState(false);
  const [ending, setEnding] = useState(false);

  // Form for starting a session
  const [form, setForm] = useState({
    subject: 'Data Structures & Algorithms',
    department: 'ISE',
    year: '2',
    section: 'A',
    classroom: '',
    geoRequired: false,
    lat: '',
    lng: '',
    radiusMeters: 50,
  });

  // Fetch classrooms on mount
  useEffect(() => {
    const loadRooms = async () => {
      try {
        const res = await api.get('/classrooms');
        setClassrooms(res.data || []);
        if (res.data?.length > 0) {
          setForm((prev) => ({ ...prev, classroom: res.data[0]._id }));
        }
      } catch (err) {
        console.error(err);
      }
    };
    loadRooms();
  }, []);

  // Poll Dynamic QR code every 20 seconds when session is active
  useEffect(() => {
    if (!activeSession) return;

    const fetchQR = async () => {
      try {
        const res = await api.get(`/attendance/sessions/${activeSession._id}/qr`);
        setQrDataURL(res.data?.qrDataURL);
        setCountdown(res.data?.refreshInSeconds || 20);
      } catch (err) {
        console.error('Error refreshing QR:', err);
      }
    };

    fetchQR();
    const interval = setInterval(fetchQR, 20000);

    // 1-second countdown ticker
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 1 ? prev - 1 : 20));
    }, 1000);

    return () => {
      clearInterval(interval);
      clearInterval(timer);
    };
  }, [activeSession]);

  // Real-time socket listener for live attendee count & list (Acceptance Test 4)
  useEffect(() => {
    if (!socket || !activeSession) return;

    socket.emit('join', `session:${activeSession._id}`);

    const handleAttendanceMarked = (newRecord) => {
      setAttendees((prev) => {
        if (prev.some((r) => r.student?._id === newRecord.student?._id)) return prev;
        return [newRecord, ...prev];
      });
      toast.success(
        `✓ ${newRecord.student?.name} (${newRecord.student?.rollNo || 'Roll N/A'}) marked attendance!`,
        { icon: '🎓' }
      );
    };

    socket.on('attendance:marked', handleAttendanceMarked);

    return () => {
      socket.off('attendance:marked', handleAttendanceMarked);
      socket.emit('leave', `session:${activeSession._id}`);
    };
  }, [socket, activeSession]);

  const handleStartSession = async (e) => {
    e.preventDefault();
    setStarting(true);
    try {
      const payload = {
        ...form,
        year: Number(form.year),
        geo: form.geoRequired
          ? {
              lat: Number(form.lat) || 12.9716,
              lng: Number(form.lng) || 77.5946,
              radiusMeters: Number(form.radiusMeters) || 50,
            }
          : undefined,
      };

      const res = await api.post('/attendance/sessions', payload);
      setActiveSession(res.data?.session);
      setQrDataURL(res.data?.qrDataURL);
      setAttendees([]);
      toast.success('Live attendance session started!');
    } catch (err) {
      toast.error(err.message || 'Failed to start session');
    } finally {
      setStarting(false);
    }
  };

  const handleEndSession = async () => {
    if (!window.confirm('Are you sure you want to end this attendance session?')) return;
    setEnding(true);
    try {
      await api.patch(`/attendance/sessions/${activeSession._id}/end`);
      toast.success('Attendance session concluded');
      setActiveSession(null);
      setQrDataURL('');
    } catch (err) {
      toast.error(err.message || 'Failed to end session');
    } finally {
      setEnding(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <QrCode className="h-6 w-6 text-brand-600" /> Start Live Classroom Session
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Dynamic HMAC-SHA256 auto-refreshing QR code (refreshes every 20s) with live attendee counter.
        </p>
      </div>

      {!activeSession ? (
        /* Configuration Form */
        <Card title="Class Session Parameters" subtitle="Configure subject, section, and geofence">
          <form onSubmit={handleStartSession} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Subject Name *
                </label>
                <input
                  type="text"
                  required
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

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
                      {c.roomNo} ({c.building})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Department *
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
                  Year *
                </label>
                <select
                  value={form.year}
                  onChange={(e) => setForm({ ...form, year: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="1">Year 1</option>
                  <option value="2">Year 2</option>
                  <option value="3">Year 3</option>
                  <option value="4">Year 4</option>
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

            {/* Optional Geofencing */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-900/30">
              <label className="flex items-center gap-2 cursor-pointer mb-2">
                <input
                  type="checkbox"
                  checked={form.geoRequired}
                  onChange={(e) => setForm({ ...form, geoRequired: e.target.checked })}
                  className="rounded text-brand-600 focus:ring-brand-500"
                />
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Enforce Physical Classroom Geofence (Haversine Verification)
                </span>
              </label>

              {form.geoRequired && (
                <div className="grid grid-cols-3 gap-3 pt-2 text-xs">
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">Latitude</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="e.g. 12.9716"
                      value={form.lat}
                      onChange={(e) => setForm({ ...form, lat: e.target.value })}
                      className="w-full rounded border border-slate-300 dark:border-slate-700 px-2 py-1 text-xs dark:bg-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">Longitude</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="e.g. 77.5946"
                      value={form.lng}
                      onChange={(e) => setForm({ ...form, lng: e.target.value })}
                      className="w-full rounded border border-slate-300 dark:border-slate-700 px-2 py-1 text-xs dark:bg-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">Radius (Meters)</label>
                    <input
                      type="number"
                      value={form.radiusMeters}
                      onChange={(e) => setForm({ ...form, radiusMeters: e.target.value })}
                      className="w-full rounded border border-slate-300 dark:border-slate-700 px-2 py-1 text-xs dark:bg-slate-800"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" loading={starting} className="gap-2">
                <Play className="h-4 w-4" /> Start Live Class
              </Button>
            </div>
          </form>
        </Card>
      ) : (
        /* Active Live Session Display */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left: Auto-Refreshing QR */}
          <Card className="flex flex-col items-center text-center p-6 bg-gradient-to-b from-white to-slate-50 dark:from-slate-800 dark:to-slate-900">
            <div className="flex items-center justify-between w-full mb-4">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 flex items-center gap-1.5 animate-pulse">
                <span className="h-2 w-2 rounded-full bg-emerald-500" /> LIVE SESSION
              </span>

              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono">
                <RotateCw className="h-3.5 w-3.5 animate-spin" />
                <span>Refreshes in {countdown}s</span>
              </div>
            </div>

            <div className="p-4 bg-white rounded-2xl shadow-xl border border-slate-200/80 my-2">
              {qrDataURL ? (
                <img
                  src={qrDataURL}
                  alt="Dynamic Attendance QR"
                  className="h-64 w-64 object-contain"
                />
              ) : (
                <LoadingSpinner />
              )}
            </div>

            <div className="mt-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {activeSession.subject}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Room {activeSession.classroom?.roomNo || 'Room'} &bull; {activeSession.department} Yr{' '}
                {activeSession.year} Sec {activeSession.section}
              </p>
            </div>

            <div className="mt-6 w-full">
              <Button
                variant="danger"
                onClick={handleEndSession}
                loading={ending}
                className="w-full gap-2 py-2.5"
              >
                <Square className="h-4 w-4 fill-current" /> End Attendance Session
              </Button>
            </div>
          </Card>

          {/* Right: Real-time Live Attendees Counter & List */}
          <Card
            title={`Present Attendees (${attendees.length})`}
            subtitle="Real-time check-ins streaming via WebSockets"
            className="flex flex-col"
          >
            <div className="flex-1 overflow-y-auto max-h-[420px] divide-y divide-slate-100 dark:divide-slate-700/60">
              {attendees.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400">
                  <Users className="h-8 w-8 mb-2 stroke-1" />
                  <p className="text-xs">Waiting for students to scan the live QR code...</p>
                </div>
              ) : (
                attendees.map((rec, i) => (
                  <div key={rec._id || i} className="py-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="h-7 w-7 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold flex items-center justify-center text-[10px]">
                        {i + 1}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-slate-100">
                          {rec.student?.name}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          Roll: {rec.student?.rollNo || 'N/A'} &bull; {rec.student?.email}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="h-3 w-3" /> Marked
                      </span>
                      <span className="block text-[10px] text-slate-400">
                        {new Date(rec.markedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default FacultyLiveClass;
