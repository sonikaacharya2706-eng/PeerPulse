import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';

// Layouts
import DashboardLayout from './layouts/DashboardLayout';
import AuthLayout from './layouts/AuthLayout';
import ProtectedRoute from './components/ProtectedRoute';

// Public Pages
import LandingPage from './pages/LandingPage';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';

// Common / Shared Pages
import Dashboard from './pages/Dashboard';
import Profile from './pages/shared/Profile';
import NotificationsPage from './pages/shared/NotificationsPage';
import GlobalSearchPage from './pages/shared/GlobalSearchPage';

// M1 Pages
import RoomStatusBoard from './pages/m1/RoomStatusBoard';
import FreeRoomFinder from './pages/m1/FreeRoomFinder';
import TimetableViewer from './pages/m1/TimetableViewer';
import TimetableManager from './pages/m1/TimetableManager';
import MySchedule from './pages/m1/MySchedule';
import RoomBookings from './pages/m1/RoomBookings';

// M2 Pages
import LostFoundBoard from './pages/m2/LostFoundBoard';
import ReportItem from './pages/m2/ReportItem';
import ItemDetail from './pages/m2/ItemDetail';
import AdminModeration from './pages/m2/AdminModeration';

// M3 Pages
import FacultyLiveClass from './pages/m3/FacultyLiveClass';
import StudentScanQR from './pages/m3/StudentScanQR';
import MyAttendance from './pages/m3/MyAttendance';
import AttendanceReports from './pages/m3/AttendanceReports';
import VisitorRegister from './pages/m3/VisitorRegister';
import VisitorScanner from './pages/m3/VisitorScanner';
import VisitorsOnCampus from './pages/m3/VisitorsOnCampus';

// M4 Pages
import RaiseComplaint from './pages/m4/RaiseComplaint';
import MyComplaints from './pages/m4/MyComplaints';
import ComplaintDetail from './pages/m4/ComplaintDetail';
import ComplaintManager from './pages/m4/ComplaintManager';
import MaintenanceTaskBoard from './pages/m4/MaintenanceTaskBoard';
import ComplaintAnalytics from './pages/m4/ComplaintAnalytics';

// M5 Pages
import EventCalendarList from './pages/m5/EventCalendarList';
import EventDetail from './pages/m5/EventDetail';
import CreateEditEvent from './pages/m5/CreateEditEvent';
import MyEvents from './pages/m5/MyEvents';
import EventCheckin from './pages/m5/EventCheckin';

// Admin Pages
import UserManagement from './pages/admin/UserManagement';
import AuditLogs from './pages/admin/AuditLogs';

function App() {
  const { fetchMe, token } = useAuthStore();

  useEffect(() => {
    if (token) {
      fetchMe();
    }
  }, [token, fetchMe]);

  return (
    <Routes>
      {/* Public Pages */}
      <Route path="/" element={<LandingPage />} />

      {/* Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
      </Route>

      {/* Protected App Routes */}
      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/search" element={<GlobalSearchPage />} />

        {/* M1: Smart Classroom Availability and Timetable Assistant */}
        <Route path="/m1/rooms/status" element={<RoomStatusBoard />} />
        <Route path="/m1/rooms/finder" element={<FreeRoomFinder />} />
        <Route path="/m1/timetable" element={<TimetableViewer />} />
        <Route
          path="/m1/my-schedule"
          element={
            <ProtectedRoute allowedRoles={['faculty', 'student']}>
              <MySchedule />
            </ProtectedRoute>
          }
        />
        <Route
          path="/m1/bookings"
          element={
            <ProtectedRoute allowedRoles={['faculty', 'admin']}>
              <RoomBookings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/m1/timetable/manage"
          element={
            <ProtectedRoute allowedRoles={['faculty', 'admin']}>
              <TimetableManager />
            </ProtectedRoute>
          }
        />

        {/* M2: Digital Lost-and-Found Management System */}
        <Route path="/m2/board" element={<LostFoundBoard />} />
        <Route path="/m2/report" element={<ReportItem />} />
        <Route path="/m2/items/:id" element={<ItemDetail />} />
        <Route
          path="/m2/moderation"
          element={
            <ProtectedRoute allowedRoles={['security', 'admin']}>
              <AdminModeration />
            </ProtectedRoute>
          }
        />

        {/* M3: QR-Based Classroom Attendance and Visitor Management */}
        <Route
          path="/m3/faculty/live"
          element={
            <ProtectedRoute allowedRoles={['faculty', 'admin']}>
              <FacultyLiveClass />
            </ProtectedRoute>
          }
        />
        <Route
          path="/m3/student/scan"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentScanQR />
            </ProtectedRoute>
          }
        />
        <Route
          path="/m3/student/my-attendance"
          element={
            <ProtectedRoute allowedRoles={['student', 'faculty']}>
              <MyAttendance />
            </ProtectedRoute>
          }
        />
        <Route
          path="/m3/reports"
          element={
            <ProtectedRoute allowedRoles={['faculty', 'admin']}>
              <AttendanceReports />
            </ProtectedRoute>
          }
        />
        <Route path="/m3/visitors/register" element={<VisitorRegister />} />
        <Route
          path="/m3/visitors/scan"
          element={
            <ProtectedRoute allowedRoles={['security', 'admin']}>
              <VisitorScanner />
            </ProtectedRoute>
          }
        />
        <Route path="/m3/visitors/on-campus" element={<VisitorsOnCampus />} />

        {/* M4: Campus Maintenance and Complaint Reporting Application */}
        <Route path="/m4/raise" element={<RaiseComplaint />} />
        <Route
          path="/m4/my-complaints"
          element={
            <ProtectedRoute allowedRoles={['student', 'faculty']}>
              <MyComplaints />
            </ProtectedRoute>
          }
        />
        <Route path="/m4/complaints/:id" element={<ComplaintDetail />} />
        <Route
          path="/m4/manager"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <ComplaintManager />
            </ProtectedRoute>
          }
        />
        <Route
          path="/m4/maintenance-board"
          element={
            <ProtectedRoute allowedRoles={['maintenance', 'admin']}>
              <MaintenanceTaskBoard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/m4/analytics"
          element={
            <ProtectedRoute allowedRoles={['admin', 'maintenance']}>
              <ComplaintAnalytics />
            </ProtectedRoute>
          }
        />

        {/* M5: Smart College Event and Activity Notification System */}
        <Route path="/m5/events" element={<EventCalendarList />} />
        <Route path="/m5/events/:id" element={<EventDetail />} />
        <Route
          path="/m5/manage"
          element={
            <ProtectedRoute allowedRoles={['faculty', 'admin']}>
              <CreateEditEvent />
            </ProtectedRoute>
          }
        />
        <Route
          path="/m5/my-events"
          element={
            <ProtectedRoute allowedRoles={['student', 'faculty']}>
              <MyEvents />
            </ProtectedRoute>
          }
        />
        <Route
          path="/m5/events/:id/checkin"
          element={
            <ProtectedRoute allowedRoles={['faculty', 'admin']}>
              <EventCheckin />
            </ProtectedRoute>
          }
        />
        <Route
          path="/m5/checkin"
          element={
            <ProtectedRoute allowedRoles={['faculty', 'admin']}>
              <EventCheckin />
            </ProtectedRoute>
          }
        />

        {/* Administration */}
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <UserManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/audit-logs"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AuditLogs />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Catch-all redirect to / */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
