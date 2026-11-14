import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { ScanLine, CheckCircle2, QrCode, Users, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';

const EventCheckin = () => {
  const { id: paramId } = useParams();
  const navigate = useNavigate();

  const [myEvents, setMyEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState(paramId || '');
  const [registrations, setRegistrations] = useState([]);
  const [qrDataURL, setQrDataURL] = useState('');
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);

  // Load events organized by user
  useEffect(() => {
    const loadEvents = async () => {
      try {
        const res = await api.get('/events?mine=true');
        setMyEvents(res.data || []);
        if (!selectedEventId && res.data?.length > 0) {
          setSelectedEventId(res.data[0]._id);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadEvents();
  }, []);

  // Fetch attendees and QR for selected event
  const fetchAttendees = async () => {
    if (!selectedEventId) return;
    try {
      const [regRes, qrRes] = await Promise.all([
        api.get(`/events/${selectedEventId}/registrations`),
        api.get(`/events/${selectedEventId}/qr`),
      ]);
      setRegistrations(regRes.data || []);
      setQrDataURL(qrRes.data?.qrDataURL || '');
    } catch (err) {
      toast.error(err.message || 'Failed to load attendee roster');
    }
  };

  useEffect(() => {
    if (selectedEventId) {
      fetchAttendees();
    }
  }, [selectedEventId]);

  const handleManualCheckIn = async (userId) => {
    setCheckingIn(true);
    try {
      const res = await api.post(`/events/${selectedEventId}/checkin`, { userId });
      toast.success(res.message);
      fetchAttendees();
    } catch (err) {
      toast.error(err.message || 'Check-in failed');
    } finally {
      setCheckingIn(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <button
            onClick={() => navigate('/m5/events')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 mb-1"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Events
          </button>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <ScanLine className="h-6 w-6 text-brand-600" /> Event Check-In & Attendee Roster
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Verify attendees on arrival via QR scan or mark confirmed attendance in the live roster.
          </p>
        </div>

        {myEvents.length > 0 && (
          <div className="w-full sm:w-64">
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              {myEvents.map((evt) => (
                <option key={evt._id} value={evt._id}>
                  {evt.title}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Event QR Code */}
        <Card title="Attendee Check-In QR" subtitle="Display at entrance door" className="flex flex-col items-center text-center">
          {qrDataURL ? (
            <div className="p-3 bg-white rounded-xl shadow-md border border-slate-200 my-4">
              <img src={qrDataURL} alt="Event QR" className="h-48 w-48 object-contain" />
            </div>
          ) : (
            <div className="p-8 text-slate-400 text-xs">No QR available</div>
          )}

          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs">
            Attendees can scan this QR code or show their profile roll number for immediate check-in.
          </p>
        </Card>

        {/* Right Column: Attendee Table */}
        <div className="md:col-span-2">
          <Card
            title={`Registered Attendees (${registrations.length})`}
            subtitle="Live status of RSVPs and arrivals"
          >
            {registrations.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No attendees registered yet"
                description="Share your event link to start collecting student RSVPs."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40 text-slate-500 uppercase tracking-wider font-semibold">
                      <th className="py-2.5 px-3">Student</th>
                      <th className="py-2.5 px-3">Roll No</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Check-in Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {registrations.map((reg) => (
                      <tr key={reg._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                        <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-slate-100">
                          {reg.user?.name}
                          <span className="block font-normal text-[10px] text-slate-400">
                            {reg.user?.email}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-teal-600 dark:text-teal-400">
                          {reg.user?.rollNo || 'N/A'}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              reg.status === 'attended'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : reg.status === 'waitlisted'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {reg.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          {reg.status === 'attended' ? (
                            <span className="text-[11px] text-emerald-600 font-semibold flex items-center justify-end gap-1">
                              <CheckCircle2 className="h-3.5 w-3.5" /> Checked In
                            </span>
                          ) : (
                            <Button
                              size="sm"
                              variant="teal"
                              onClick={() => handleManualCheckIn(reg.user?._id)}
                              disabled={checkingIn}
                            >
                              Check In
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EventCheckin;
