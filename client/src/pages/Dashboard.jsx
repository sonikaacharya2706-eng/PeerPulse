import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/axios';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import LoadingSpinner from '../components/common/LoadingSpinner';
import {
  LayoutDashboard,
  Calendar,
  PackageSearch,
  QrCode,
  Wrench,
  Sparkles,
  Users,
  ShieldCheck,
  AlertTriangle,
  Clock,
  ArrowRight,
  CheckCircle2,
  Bell,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { format } from 'date-fns';

const Dashboard = () => {
  const user = useAuthStore((state) => state.user);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get('/dashboard/summary');
        setData(res.data);
      } catch (err) {
        toast.error(err.message || 'Failed to load dashboard summary');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) return <LoadingSpinner />;

  const role = user?.role || 'student';
  const stats = data?.stats || {};

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-brand-700 via-brand-600 to-teal-600 text-white shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase font-bold tracking-wider text-teal-200">
            {role} Portal &bull; Today is {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-1">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-xs text-brand-100 mt-1 max-w-xl">
            Smart Campus Solutions keeps you synchronized across classrooms, attendance, maintenance, and college events.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/m1/rooms/status">
            <Button variant="secondary" size="sm" className="bg-white/10 hover:bg-white/20 text-white border-0">
              Live Room Board
            </Button>
          </Link>
          <Link to="/notifications">
            <Button variant="secondary" size="sm" className="bg-white/10 hover:bg-white/20 text-white border-0">
              Notifications
            </Button>
          </Link>
        </div>
      </div>

      {/* ADMIN DASHBOARD */}
      {role === 'admin' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-l-4 border-l-brand-600 p-4">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Campus Users</span>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{stats.totalUsers}</p>
            </Card>
            <Card className="border-l-4 border-l-teal-500 p-4">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Active Classrooms</span>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{stats.totalClassrooms}</p>
            </Card>
            <Card className="border-l-4 border-l-amber-500 p-4">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Pending Bookings</span>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{stats.pendingBookings}</p>
            </Card>
            <Card className="border-l-4 border-l-rose-500 p-4">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">SLA Escalations</span>
              <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">{stats.escalatedComplaints}</p>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card title="Quick Admin Navigation" className="md:col-span-2">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <Link to="/admin/users" className="p-3 rounded-lg border bg-slate-50 dark:bg-slate-900 hover:bg-brand-50 transition">
                  <Users className="h-5 w-5 text-brand-600 mb-1" />
                  <p className="font-bold">Manage Users</p>
                  <p className="text-[10px] text-slate-400">Roles, accounts, status</p>
                </Link>
                <Link to="/m1/bookings" className="p-3 rounded-lg border bg-slate-50 dark:bg-slate-900 hover:bg-brand-50 transition">
                  <Calendar className="h-5 w-5 text-teal-600 mb-1" />
                  <p className="font-bold">Room Bookings</p>
                  <p className="text-[10px] text-slate-400">Review {stats.pendingBookings} pending</p>
                </Link>
                <Link to="/m4/manager" className="p-3 rounded-lg border bg-slate-50 dark:bg-slate-900 hover:bg-brand-50 transition">
                  <Wrench className="h-5 w-5 text-amber-600 mb-1" />
                  <p className="font-bold">Complaint Desk</p>
                  <p className="text-[10px] text-slate-400">Dispatch technicians</p>
                </Link>
                <Link to="/m2/moderation" className="p-3 rounded-lg border bg-slate-50 dark:bg-slate-900 hover:bg-brand-50 transition">
                  <PackageSearch className="h-5 w-5 text-purple-600 mb-1" />
                  <p className="font-bold">Lost & Found Claims</p>
                  <p className="text-[10px] text-slate-400">Verify handover proof</p>
                </Link>
                <Link to="/m3/visitors/on-campus" className="p-3 rounded-lg border bg-slate-50 dark:bg-slate-900 hover:bg-brand-50 transition">
                  <ShieldCheck className="h-5 w-5 text-emerald-600 mb-1" />
                  <p className="font-bold">Visitor Gate Log</p>
                  <p className="text-[10px] text-slate-400">{stats.onCampusVisitors} on campus</p>
                </Link>
                <Link to="/admin/audit-logs" className="p-3 rounded-lg border bg-slate-50 dark:bg-slate-900 hover:bg-brand-50 transition">
                  <Clock className="h-5 w-5 text-rose-600 mb-1" />
                  <p className="font-bold">System Audit Logs</p>
                  <p className="text-[10px] text-slate-400">Immutable security trace</p>
                </Link>
              </div>
            </Card>

            <Card title="Campus Overview">
              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1.5 border-b">
                  <span className="text-slate-500">Upcoming Events:</span>
                  <span className="font-bold">{stats.activeEvents}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b">
                  <span className="text-slate-500">Reported Items:</span>
                  <span className="font-bold">{stats.reportedLostFound}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b">
                  <span className="text-slate-500">Open Complaints:</span>
                  <span className="font-bold">{stats.openComplaints}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-500">Visitors on Campus:</span>
                  <span className="font-bold">{stats.onCampusVisitors}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* FACULTY DASHBOARD */}
      {role === 'faculty' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-l-4 border-l-brand-600 p-4">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Today's Lectures</span>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{stats.todayClassesCount}</p>
            </Card>
            <Card className="border-l-4 border-l-teal-500 p-4">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">My Events</span>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{stats.myEventsCount}</p>
            </Card>
            <Card className="border-l-4 border-l-purple-500 p-4">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Active Classrooms</span>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{stats.totalClassrooms}</p>
            </Card>
            <Card className="border-l-4 border-l-emerald-500 p-4">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Campus Events</span>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{stats.activeEvents}</p>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card title="Today's Teaching Schedule" action={<Link to="/m3/faculty/live"><Button size="sm">Start Class QR</Button></Link>}>
              {data.todayClasses?.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">No lectures scheduled for today.</p>
              ) : (
                <div className="space-y-2.5">
                  {data.todayClasses.map((cls) => (
                    <div key={cls._id} className="p-3 rounded-lg border bg-slate-50 dark:bg-slate-900 text-xs flex justify-between items-center">
                      <div>
                        <p className="font-bold text-slate-900 dark:text-slate-100">{cls.subject}</p>
                        <p className="text-[11px] text-slate-500">Room {cls.classroom?.roomNo} &bull; Sec {cls.section} (Yr {cls.year})</p>
                      </div>
                      <span className="font-mono text-brand-600 font-bold">{cls.startTime} - {cls.endTime}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card title="Quick Faculty Actions">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <Link to="/m3/faculty/live" className="p-4 rounded-xl border bg-slate-50 dark:bg-slate-900 hover:bg-brand-50 transition">
                  <QrCode className="h-6 w-6 text-brand-600 mb-2" />
                  <p className="font-bold">Start Class Session</p>
                  <p className="text-[10px] text-slate-400">Auto-refreshing QR code</p>
                </Link>
                <Link to="/m1/bookings" className="p-4 rounded-xl border bg-slate-50 dark:bg-slate-900 hover:bg-brand-50 transition">
                  <Calendar className="h-6 w-6 text-teal-600 mb-2" />
                  <p className="font-bold">Book a Classroom</p>
                  <p className="text-[10px] text-slate-400">Reserve lab/lecture hall</p>
                </Link>
                <Link to="/m3/reports" className="p-4 rounded-xl border bg-slate-50 dark:bg-slate-900 hover:bg-brand-50 transition">
                  <Users className="h-6 w-6 text-purple-600 mb-2" />
                  <p className="font-bold">Attendance Reports</p>
                  <p className="text-[10px] text-slate-400">Export CSV and PDF</p>
                </Link>
                <Link to="/m5/manage" className="p-4 rounded-xl border bg-slate-50 dark:bg-slate-900 hover:bg-brand-50 transition">
                  <Sparkles className="h-6 w-6 text-pink-600 mb-2" />
                  <p className="font-bold">Host an Event</p>
                  <p className="text-[10px] text-slate-400">Publish to college body</p>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* STUDENT DASHBOARD */}
      {role === 'student' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-l-4 border-l-brand-600 p-4">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Today's Classes</span>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{stats.todayClassesCount}</p>
            </Card>
            <Card className="border-l-4 border-l-emerald-500 p-4">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">My Complaints</span>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{stats.myComplaintsCount}</p>
            </Card>
            <Card className="border-l-4 border-l-pink-500 p-4">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Event RSVPs</span>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{stats.myRegistrationsCount}</p>
            </Card>
            <Card className="border-l-4 border-l-teal-500 p-4">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Upcoming Events</span>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{stats.activeEvents}</p>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card title="Today's Timetable" action={<Link to="/m1/my-schedule"><Button size="sm" variant="outline">Full Schedule</Button></Link>}>
              {data.todayClasses?.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">No lectures scheduled today!</p>
              ) : (
                <div className="space-y-2.5">
                  {data.todayClasses.map((cls) => (
                    <div key={cls._id} className="p-3 rounded-lg border bg-slate-50 dark:bg-slate-900 text-xs flex justify-between items-center">
                      <div>
                        <p className="font-bold text-slate-900 dark:text-slate-100">{cls.subject}</p>
                        <p className="text-[11px] text-slate-500">Room {cls.classroom?.roomNo} &bull; Prof. {cls.faculty?.name}</p>
                      </div>
                      <span className="font-mono text-brand-600 font-bold">{cls.startTime} - {cls.endTime}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card title="Student Action Center">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <Link to="/m3/student/scan" className="p-4 rounded-xl border bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 hover:scale-[1.02] transition">
                  <QrCode className="h-6 w-6 text-brand-600 mb-2" />
                  <p className="font-bold">Scan Attendance QR</p>
                  <p className="text-[10px] opacity-80">Mark present in class</p>
                </Link>
                <Link to="/m3/student/my-attendance" className="p-4 rounded-xl border bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 hover:scale-[1.02] transition">
                  <CheckCircle2 className="h-6 w-6 text-teal-600 mb-2" />
                  <p className="font-bold">My Attendance %</p>
                  <p className="text-[10px] opacity-80">Check 75% threshold</p>
                </Link>
                <Link to="/m2/board" className="p-4 rounded-xl border bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 hover:scale-[1.02] transition">
                  <PackageSearch className="h-6 w-6 text-purple-600 mb-2" />
                  <p className="font-bold">Lost & Found</p>
                  <p className="text-[10px] opacity-80">Search or report item</p>
                </Link>
                <Link to="/m4/raise" className="p-4 rounded-xl border bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:scale-[1.02] transition">
                  <AlertTriangle className="h-6 w-6 text-amber-600 mb-2" />
                  <p className="font-bold">Raise Complaint</p>
                  <p className="text-[10px] opacity-80">Report campus defect</p>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* SECURITY DASHBOARD */}
      {role === 'security' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="border-l-4 border-l-emerald-600 p-4">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Visitors On-Campus</span>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{stats.onCampusVisitors}</p>
            </Card>
            <Card className="border-l-4 border-l-brand-600 p-4">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Expected Visitors</span>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{stats.expectedVisitors}</p>
            </Card>
            <Card className="border-l-4 border-l-purple-600 p-4">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Found Items at Gate</span>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{stats.reportedFoundItems}</p>
            </Card>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link to="/m3/visitors/scan">
              <Card className="p-6 border-2 border-dashed hover:border-brand-500 cursor-pointer text-center">
                <ShieldCheck className="h-10 w-10 text-brand-600 mx-auto mb-2" />
                <h3 className="font-bold text-base">Open Gate Pass Scanner</h3>
                <p className="text-xs text-slate-400 mt-1">Scan visitor QR codes to check-in and check-out</p>
              </Card>
            </Link>

            <Link to="/m3/visitors/register">
              <Card className="p-6 border-2 border-dashed hover:border-teal-500 cursor-pointer text-center">
                <Users className="h-10 w-10 text-teal-600 mx-auto mb-2" />
                <h3 className="font-bold text-base">Register Walk-in Visitor</h3>
                <p className="text-xs text-slate-400 mt-1">Issue new gate pass and alert host faculty</p>
              </Card>
            </Link>
          </div>
        </div>
      )}

      {/* MAINTENANCE DASHBOARD */}
      {role === 'maintenance' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="border-l-4 border-l-brand-600 p-4">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Assigned Work Orders</span>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{stats.assignedTasks}</p>
            </Card>
            <Card className="border-l-4 border-l-amber-500 p-4">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">In Progress Tasks</span>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{stats.inProgressTasks}</p>
            </Card>
            <Card className="border-l-4 border-l-rose-600 p-4">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">SLA Breached / Urgent</span>
              <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">{stats.overdueTasks}</p>
            </Card>
          </div>

          <Card title="Pending Work Orders" action={<Link to="/m4/maintenance-board"><Button size="sm">Task Board</Button></Link>}>
            {data.assignedList?.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No assigned repair tickets.</p>
            ) : (
              <div className="space-y-2.5">
                {data.assignedList.map((t) => (
                  <div key={t._id} className="p-3 rounded-lg border bg-slate-50 dark:bg-slate-900 text-xs flex justify-between items-center">
                    <div>
                      <span className="font-bold font-mono text-brand-600">{t.ticketId}</span>
                      <p className="font-bold text-slate-900 dark:text-slate-100 mt-0.5 capitalize">{t.category} in {t.building} ({t.room})</p>
                      <p className="text-[10px] text-slate-400">Due: {format(new Date(t.slaDueAt), 'MMM d, h:mm a')}</p>
                    </div>
                    <Link to={`/m4/complaints/${t._id}`}>
                      <Button size="sm" variant="outline">Action &rarr;</Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
