import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  Search,
  BookOpen,
  CalendarCheck,
  PackageSearch,
  PlusCircle,
  ShieldCheck,
  QrCode,
  ScanLine,
  BarChart3,
  UserCheck,
  Users,
  Wrench,
  AlertTriangle,
  ClipboardList,
  Sparkles,
  CalendarDays,
  FileText,
  Sliders,
  History,
  CheckCircle2,
  X,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';

const Sidebar = ({ isOpen, onClose }) => {
  const user = useAuthStore((state) => state.user);
  const role = user?.role || 'student';

  // Navigation schema configured by role
  const navSections = [
    {
      title: 'Overview',
      items: [
        {
          name: 'Dashboard',
          path: '/dashboard',
          icon: LayoutDashboard,
          roles: ['admin', 'faculty', 'student', 'security', 'maintenance'],
        },
      ],
    },
    {
      title: 'M1. Smart Classroom Availability and Timetable Assistant',
      items: [
        {
          name: 'Room Status Board',
          path: '/m1/rooms/status',
          icon: Calendar,
          roles: ['admin', 'faculty', 'maintenance'],
        },
        {
          name: 'Free Room Finder',
          path: '/m1/rooms/finder',
          icon: Search,
          roles: ['admin', 'faculty', 'student', 'maintenance'],
        },
        {
          name: 'Timetable Viewer',
          path: '/m1/timetable',
          icon: BookOpen,
          roles: ['admin', 'faculty', 'student'],
        },
        {
          name: 'My Schedule',
          path: '/m1/my-schedule',
          icon: CalendarCheck,
          roles: ['faculty', 'student'],
        },
        {
          name: 'Room Bookings',
          path: '/m1/bookings',
          icon: CalendarDays,
          roles: ['faculty', 'admin'],
        },
        {
          name: 'Timetable Manager',
          path: '/m1/timetable/manage',
          icon: Sliders,
          roles: ['admin', 'faculty'],
        },
      ],
    },
    {
      title: 'M2. Digital Lost-and-Found Management System',
      items: [
        {
          name: 'Lost & Found Board',
          path: '/m2/board',
          icon: PackageSearch,
          roles: ['admin', 'faculty', 'student', 'security', 'maintenance'],
        },
        {
          name: 'Report Item',
          path: '/m2/report',
          icon: PlusCircle,
          roles: ['admin', 'faculty', 'student', 'security'],
        },
        {
          name: 'Claims & Moderation',
          path: '/m2/moderation',
          icon: ShieldCheck,
          roles: ['admin', 'security'],
        },
      ],
    },
    {
      title: 'M3. QR-Based Classroom Attendance and Visitor Management',
      items: [
        {
          name: 'Start Class (QR Live)',
          path: '/m3/faculty/live',
          icon: QrCode,
          roles: ['faculty'],
        },
        {
          name: 'Scan Attendance QR',
          path: '/m3/student/scan',
          icon: ScanLine,
          roles: ['student'],
        },
        {
          name: 'My Attendance',
          path: '/m3/student/my-attendance',
          icon: UserCheck,
          roles: ['student', 'faculty'],
        },
        {
          name: 'Attendance Reports',
          path: '/m3/reports',
          icon: BarChart3,
          roles: ['faculty', 'admin'],
        },
        {
          name: 'Visitor Pass Register',
          path: '/m3/visitors/register',
          icon: Users,
          roles: ['security', 'faculty', 'student'],
        },
        {
          name: 'Visitor Pass Scanner',
          path: '/m3/visitors/scan',
          icon: CheckCircle2,
          roles: ['security'],
        },
        {
          name: 'Visitors On Campus',
          path: '/m3/visitors/on-campus',
          icon: History,
          roles: ['security', 'admin'],
        },
      ],
    },
    {
      title: 'M4. Campus Maintenance and Complaint Reporting Application',
      items: [
        {
          name: 'Raise Complaint',
          path: '/m4/raise',
          icon: AlertTriangle,
          roles: ['student', 'faculty'],
        },
        {
          name: 'My Complaints',
          path: '/m4/my-complaints',
          icon: ClipboardList,
          roles: ['student', 'faculty'],
        },
        {
          name: 'Maintenance Staff Tasks',
          path: '/m4/maintenance-board',
          icon: Wrench,
          roles: ['maintenance', 'admin'],
        },
        {
          name: 'Complaint Manager',
          path: '/m4/manager',
          icon: Sliders,
          roles: ['admin'],
        },
        {
          name: 'Complaint Analytics',
          path: '/m4/analytics',
          icon: BarChart3,
          roles: ['admin', 'maintenance'],
        },
      ],
    },
    {
      title: 'M5. Smart College Event and Activity Notification System',
      items: [
        {
          name: 'Event Calendar & List',
          path: '/m5/events',
          icon: Sparkles,
          roles: ['admin', 'faculty', 'student', 'security', 'maintenance'],
        },
        {
          name: 'Create / Manage Event',
          path: '/m5/manage',
          icon: PlusCircle,
          roles: ['faculty', 'admin'],
        },
        {
          name: 'My Registrations',
          path: '/m5/my-events',
          icon: CalendarCheck,
          roles: ['student', 'faculty'],
        },
        {
          name: 'Event Check-in QR',
          path: '/m5/checkin',
          icon: ScanLine,
          roles: ['faculty', 'admin'],
        },
      ],
    },
    {
      title: 'Administration',
      items: [
        {
          name: 'User Management',
          path: '/admin/users',
          icon: Users,
          roles: ['admin'],
        },
        {
          name: 'Audit Logs',
          path: '/admin/audit-logs',
          icon: FileText,
          roles: ['admin'],
        },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-slate-900 text-slate-300 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-brand-600 to-teal-400 flex items-center justify-center text-white font-bold text-lg shadow-md">
              SC
            </div>
            <div>
              <h1 className="font-bold text-white text-sm tracking-wide">
                Smart Campus
              </h1>
              <p className="text-[10px] text-teal-400 font-medium tracking-wider uppercase">
                {role} portal
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
          {navSections.map((section, idx) => {
            const filteredItems = section.items.filter((item) =>
              item.roles.includes(role)
            );
            if (filteredItems.length === 0) return null;

            return (
              <div key={idx} className="space-y-1">
                <h3 className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  {section.title}
                </h3>
                {filteredItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => onClose && onClose()}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-brand-600 text-white shadow-sm'
                          : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                      }`
                    }
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{item.name}</span>
                  </NavLink>
                ))}
              </div>
            );
          })}
        </div>

        {/* User preview footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40">
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-full bg-brand-700 text-white flex items-center justify-center font-bold text-xs uppercase shadow-inner">
              {user?.name ? user.name.slice(0, 2) : 'US'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-white truncate">
                {user?.name || 'User'}
              </p>
              <p className="text-[11px] text-slate-400 truncate">
                {user?.email || 'user@campus.edu'}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
