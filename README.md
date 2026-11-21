# Smart Campus Solutions

An enterprise-grade, unified web platform designed to streamline higher-education academic administration, student services, campus facilities, physical security, and extracurricular student life.

Built with a modern full-stack JavaScript architecture (**Node.js 18+**, **Express 4**, **MongoDB / Mongoose 8**, **Socket.io**, and **React 18 + Vite** with **Tailwind CSS**), this system eliminates fragmented campus tools by consolidating 5 core modules into a single, cohesive, real-time environment.

---

## 🏛️ Five Integrated Core Modules

The platform implements the following five modules with complete end-to-end functionality:

1. **M1. Smart Classroom Availability and Timetable Assistant**
   - **Real-time Status Board**: Live occupancy status (`Available`, `Occupied`, `Upcoming`) for every classroom, lecture hall, and lab with auto-refresh every 60s and an interactive **Time Simulator** to inspect any weekday and time.
   - **Clash Detection Engine (Algorithm B)**: Enforces academic constraints blocking overlapping timetable slots or room bookings with `HTTP 409 Conflict`, while preventing faculty members from being scheduled in two rooms simultaneously.
   - **Free Room Finder (Algorithm C)**: Instant search filtering by date, time window, capacity, room type, and required facilities; results are sorted intelligently by smallest sufficient capacity.
   - **Faculty Room Booking Workflow**: Faculty submit ad-hoc booking requests; administrators review, approve, or reject with audit remarks.
   - **Personalized Schedules**: Filterable views of master departmental timetables alongside faculty personal teaching calendars.

2. **M2. Digital Lost-and-Found Management System**
   - **Automated Match Scoring Engine (Algorithm G)**: Automatically runs upon item reporting, evaluating reciprocal `lost` vs `found` items with a 100-point composite score:
     - 40% Category identity
     - 25% Keyword Jaccard token overlap (English stopword filtering applied)
     - 20% Location string similarity (Levenshtein ratio)
     - 15% Date proximity (within 7-day sliding scale)
   - **Real-time Match Alerts**: When match score is $\ge 50$, both reporting parties receive in-app and email notifications, and items surface in a "Suggested Matches" admin/user panel.
   - **Verification & Claim Workflow**: Claimants submit descriptions and proof photos; administrators review claims and confirm matches, smoothly transitioning items to `claimed` or `returned`.

3. **M3. QR-Based Classroom Attendance and Visitor Management**
   - **Dynamic Anti-Proxy Attendance (Algorithm D)**: Faculty initiate live sessions generating ephemeral QR codes signed with HMAC-SHA256 tokens refreshed every 20 seconds. The server accepts only the current and immediately preceding time windows.
   - **Geofencing & Duplicate Enforcement**: Enforces student department/year eligibility, optional GPS boundary validation (Haversine formula), and atomic compound indexes (`session`, `student`) returning `HTTP 409 Conflict` on duplicate scan attempts.
   - **Live Attendance Dashboard**: Faculty observe real-time student check-ins over WebSocket (`attendance:marked`), with automatic low-attendance ($\lt 75\%$) warning badges and notifications.
   - **Export Facilities**: Comprehensive attendance summaries exportable directly to **CSV** (via `json2csv`) and **PDF** report sheets (via `pdfkit`).
   - **Visitor Pass System (Algorithm F)**: Generates unique 10-character alphanumeric passes with printable QR passes. Security checkpoint gates execute a 3-state finite state machine:
     1. First scan $\rightarrow$ `checked_in` (notifies host in real-time)
     2. Second scan $\rightarrow$ `checked_out` (records exit timestamp)
     3. Third scan $\rightarrow$ Blocks with "Pass already used" error

4. **M4. Campus Maintenance and Complaint Reporting Application**
   - **Automated SLA Engine (Algorithm H)**: Automatically calculates strict resolution deadlines based on ticket priority:
     - `critical`: 4 hours
     - `high`: 24 hours
     - `medium`: 72 hours
     - `low`: 120 hours
   - **Background Cron Escalation**: A background daemon (`node-cron`) audits active tickets every 15 minutes, automatically flagging breached SLAs as `escalated = true` and dispatching urgent administrator alerts.
   - **Strict Linear Status Pipeline**: Tickets advance strictly forward (`submitted` $\rightarrow$ `assigned` $\rightarrow$ `in_progress` $\rightarrow$ `resolved` $\rightarrow$ `closed`). Every state transition logs immutable actor, timestamp, remarks, and attachments to the audit timeline.
   - **Feedback Loop**: Tickets can be closed with 1-5 star ratings and satisfaction comments by the student or administrator.

5. **M5. Smart College Event and Activity Notification System**
   - **Capacity & Automatic Waitlist Engine (Algorithm I)**: When event capacity is exhausted, additional registrants are queued as `waitlisted`. When any confirmed registrant cancels, the engine automatically promotes the earliest waitlisted user to `registered` and dispatches immediate notification.
   - **Targeted Audiences & Deadlines**: Registration gates based on department, student year, affiliated clubs, and strict registration deadline cutoffs.
   - **Automated Event Reminders (Algorithm J)**: A 5-minute background cron evaluates upcoming events, dispatching multi-channel (in-app + email) notifications at the $\sim 24$-hour and $\sim 1$-hour milestones without duplication.
   - **Organizer Event Check-in**: Organizers scan student attendance passes via camera QR or manual lookup, tracking live turnout rates.

---

## ⚡ Quick Start

The entire application runs with **zero external cloud accounts required**:
- Local MongoDB database (or custom `MONGO_URI` via `.env`).
- Local disk file uploads (served via Express static routing under `/uploads`).
- Email notifications automatically fall back to console logging and Ethereal virtual SMTP test accounts if standard SMTP credentials are not configured.

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **MongoDB**: v5.0+ running locally on default port `27017` (e.g., `mongodb://127.0.0.1:27017/smart_campus`) or a remote MongoDB Atlas URI.

### Step-by-Step Execution

1. **Install All Dependencies (Root, Server, and Client)**:
   ```bash
   npm run install:all
   ```

2. **Seed the Database**:
   Seeds 17 user accounts across 5 roles, 12 classrooms, full departmental weekly timetables, test bookings, lost-and-found items with pre-calculated matching pairs, historical attendance sessions, active visitor passes, SLA-tracked complaints, and events with capacity/waitlist configurations.
   ```bash
   npm run seed
   ```

3. **Start Development Servers (Server on :5000 + Client on :5173)**:
   ```bash
   npm run dev
   ```
   - **Client Application**: [http://localhost:5173](http://localhost:5173)
   - **Backend API Service**: [http://localhost:5000](http://localhost:5000)

---

## 🔑 Demo Credentials

All seeded accounts share the common password: **`Campus@123`**

| Role | Email | Password | Primary Testing Focus |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@campus.edu` | `Campus@123` | Full system control, user CRUD, audit logs, room booking approval, match confirmation, complaint reassignment & analytics |
| **Faculty** | `faculty1@campus.edu` | `Campus@123` | Teaching schedule, room booking requests, live attendance QR session, attendance PDF/CSV export, event creation |
| **Faculty (Alternate)** | `faculty2@campus.edu` | `Campus@123` | Clash detection testing (scheduling conflicts in same room / time) |
| **Student 1 (ISE, Year 3)** | `student1@campus.edu` | `Campus@123` | Free room finder, dynamic QR attendance scanner, reporting lost items, raising complaints, registering for events |
| **Student 2 (ISE, Year 2)** | `student2@campus.edu` | `Campus@123` | Low attendance (<75%) alert verification, waitlisted event registration testing |
| **Security** | `security@campus.edu` | `Campus@123` | Visitor pass generation, QR gate check-in / check-out scanner, on-campus active visitor monitoring, gate found-item registration |
| **Maintenance** | `maintenance@campus.edu` | `Campus@123` | Assigned demo work order, task board, advancing ticket status (`assigned` $\rightarrow$ `in_progress` $\rightarrow$ `resolved`), uploading completion remarks |
| **Maintenance 1** | `maintenance1@campus.edu` | `Campus@123` | Assigned electrical maintenance technician workflow |

The seeded demo data gives each role dashboard sample details: admin campus metrics, pending queues, audit logs, and ownership claims; faculty schedule, room requests, events, and attendance reports; student timetable, complaints, attendance, and event registrations; security visitor activity and found items; and maintenance assigned work orders. Attendance fixtures cover ISE Years 2 and 3, including 100%, 66%, and 33% examples. When there are no classes today, faculty and student dashboards show the next scheduled classes instead.

> [!TIP]
> The login screen at [http://localhost:5173/login](http://localhost:5173/login) includes **1-click quick-fill buttons** for each role to facilitate rapid testing and evaluation.

---

## 📂 Monorepo Folder Structure

```text
/smart-campus
├── .env.example                     # Root environment configuration template
├── .gitignore                       # Ignored node_modules, logs, and uploads
├── package.json                     # Monorepo orchestrator (install:all, seed, dev via concurrently)
├── README.md                        # Primary developer documentation & setup guide
│
├── client/                          # React 18 + Vite Frontend Application
│   ├── index.html                   # HTML5 shell
│   ├── vite.config.js               # Vite bundler configuration & proxy settings
│   ├── tailwind.config.js           # Tailwind theme, typography, & custom color palettes
│   ├── postcss.config.js            # PostCSS Autoprefixer plugin
│   ├── package.json                 # Client dependencies & scripts
│   └── src/
│       ├── main.jsx                 # Application entrypoint
│       ├── App.jsx                  # React Router 6 configuration (30+ routes)
│       ├── index.css                # Global CSS styles & Tailwind directives
│       ├── api/
│       │   └── axios.js             # Central Axios instance with JWT interceptor & 401 handler
│       ├── components/
│       │   ├── common/              # Button, Card, Modal, LoadingSpinner, EmptyState
│       │   └── layout/              # Sidebar (role-filtered), Navbar, ProtectedRoute, DashboardLayout
│       ├── hooks/
│       │   └── useSocket.js         # Socket.io client hook for real-time room & user events
│       ├── pages/
│       │   ├── LandingPage.jsx      # Public landing page presenting all 5 modules
│       │   ├── Dashboard.jsx        # Role-customized dashboard (Admin/Faculty/Student/Security/Maintenance)
│       │   ├── NotificationsPage.jsx# Multi-type notification filter & management
│       │   ├── GlobalSearchPage.jsx # Multi-entity search across rooms, complaints, items, and events
│       │   ├── auth/                # Login, Register, ForgotPassword, ResetPassword, Profile
│       │   ├── admin/               # UserManagement, AuditLogs, ComplaintAnalytics
│       │   ├── m1_timetable/        # RoomStatusBoard, FreeRoomFinder, TimetableViewer, MySchedule, TimetableManager, RoomBookings
│       │   ├── m2_lostfound/        # LostFoundBoard, ReportItem, ItemDetail, AdminModeration
│       │   ├── m3_attendance/       # FacultyLiveClass, StudentScanQR, MyAttendance, AttendanceReports, VisitorRegister, VisitorScanner, VisitorsOnCampus
│       │   ├── m4_complaints/       # RaiseComplaint, MyComplaints, ComplaintDetail, ComplaintManager, MaintenanceTaskBoard
│       │   └── m5_events/           # EventCalendarList, EventDetail, CreateEditEvent, MyEvents, EventCheckin
│       └── store/
│           ├── authStore.js         # Zustand persistent authentication store
│           ├── notificationStore.js # Zustand real-time notification store
│           └── themeStore.js        # Light / Dark mode toggle store
│
├── server/                          # Node.js 18+ & Express 4 Backend REST API
│   ├── server.js                    # HTTP & Socket.io server bootstrap, rate limiting & error handling
│   ├── package.json                 # Server dependencies & scripts
│   ├── config/
│   │   └── db.js                    # Mongoose MongoDB connection handler
│   ├── controllers/                 # Business logic for all 5 modules & shared features
│   ├── middleware/
│   │   ├── auth.js                  # JWT Bearer verification middleware
│   │   ├── rbac.js                  # Role-based access control (authorize(...roles))
│   │   ├── errorHandler.js          # Central error & 404 response formatter
│   │   ├── validate.js              # express-validator request validation middleware
│   │   ├── upload.js                # Multer disk storage for images with mimetype & size limits
│   │   └── audit.js                 # Automatic audit logging middleware
│   ├── models/                      # 14 Mongoose Data Schemas with timestamps & indexing
│   ├── routes/                      # Express route definitions grouped by domain
│   ├── services/
│   │   ├── socket.js                # Socket.io room management & broadcast hub
│   │   ├── notificationService.js   # Unified notify() service (DB + Socket.io + Email)
│   │   ├── emailService.js          # Nodemailer transporter (SMTP with Ethereal fallback)
│   │   ├── matchingService.js       # Algorithm G lost-and-found composite matching engine
│   │   ├── attendanceCrypto.js      # Algorithm D HMAC-SHA256 token & Haversine formula
│   │   ├── slaCron.js               # Algorithm H 15-minute complaint SLA escalation cron
│   │   └── eventReminderCron.js     # Algorithm J 5-minute event reminder cron
│   ├── seed/
│   │   └── seed.js                  # Realistic production seed script
│   └── uploads/                     # Local disk media storage
│
└── docs/                            # Project Documentation & Testing Artifacts
    ├── PROJECT_REPORT.md            # Comprehensive Academic & Technical Project Report
    └── postman_collection.json      # Complete Postman v2.1 Test & API Suite
```

---

## 📡 API Endpoints Reference

All endpoints return standardized JSON structures: `{ "success": boolean, "data": any, "message": string }`.

### Authentication & User Management
| Method | Endpoint | Allowed Roles | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Register new student or faculty account |
| `POST` | `/api/auth/login` | Public | Authenticate user & return JWT token (1 day validity) |
| `POST` | `/api/auth/forgot-password`| Public | Request password reset token via email |
| `POST` | `/api/auth/reset-password/:token`| Public | Reset password with valid token |
| `GET` | `/api/auth/me` | Authenticated | Retrieve current user profile |
| `PUT` | `/api/auth/profile` | Authenticated | Update user profile details |
| `PUT` | `/api/auth/change-password` | Authenticated | Change current password |
| `GET` | `/api/users` | `admin` | List all system users with filters |
| `POST` | `/api/users` | `admin` | Create a new user with specific role |
| `PUT` | `/api/users/:id` | `admin` | Update user details or role |
| `PATCH`| `/api/users/:id/toggle` | `admin` | Activate or deactivate user account |

### M1. Smart Classroom Availability & Timetable Assistant
| Method | Endpoint | Allowed Roles | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/classrooms` | Authenticated | List all classrooms |
| `POST` | `/api/classrooms` | `admin` | Create new classroom |
| `GET` | `/api/classrooms/status` | Authenticated | Real-time status for all rooms at timestamp `?time=` (Algorithm A) |
| `GET` | `/api/timetable` | Authenticated | View timetable filtered by department, year, room, or faculty |
| `GET` | `/api/timetable/my` | Authenticated | View current user's schedule (today and weekly) |
| `POST` | `/api/timetable` | `admin`, `faculty` | Add timetable slot with clash validation (Algorithm B) |
| `DELETE`| `/api/timetable/:id` | `admin` | Remove timetable slot |
| `GET` | `/api/rooms/free-search` | Authenticated | Search available rooms without clashes (Algorithm C) |
| `POST` | `/api/bookings` | `faculty` | Request room booking |
| `GET` | `/api/bookings` | Authenticated | List room bookings (faculty sees own, admin sees all) |
| `PATCH`| `/api/bookings/:id/decision`| `admin` | Approve or reject room booking request |

### M2. Digital Lost-and-Found Management System
| Method | Endpoint | Allowed Roles | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/lostfound` | Authenticated | List items with search, filters (`category`, `type`, `status`) |
| `POST` | `/api/lostfound` | Authenticated | Report lost/found item with up to 3 image uploads (Multer) |
| `GET` | `/api/lostfound/:id` | Authenticated | Retrieve item details and history |
| `GET` | `/api/lostfound/:id/matches` | Authenticated | Compute match candidates score $\ge 50$ (Algorithm G) |
| `POST` | `/api/lostfound/:id/confirm-match`| `admin`, Item Owner | Confirm match linking lost & found items |
| `POST` | `/api/lostfound/:id/claims` | Authenticated | Submit ownership claim with proof images |
| `GET` | `/api/claims` | `admin` | List all submitted ownership claims |
| `PATCH`| `/api/claims/:id/decision` | `admin` | Approve or reject ownership claim |

### M3. QR-Based Classroom Attendance & Visitor Management
| Method | Endpoint | Allowed Roles | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/attendance/sessions` | `faculty` | Start attendance session with dynamic QR secret |
| `GET` | `/api/attendance/sessions/:id/qr` | `faculty` | Poll dynamic 20-second QR token (Algorithm D) |
| `GET` | `/api/attendance/sessions/:id/live` | `faculty` | Live session status and student check-in list |
| `PATCH`| `/api/attendance/sessions/:id/end` | `faculty` | Terminate attendance session |
| `POST` | `/api/attendance/mark` | `student` | Mark attendance via scanned QR payload (Algorithm D) |
| `POST` | `/api/attendance/manual-mark`| `faculty` | Manually mark student present/absent/late |
| `GET` | `/api/attendance/my` | `student` | Student personal attendance percentages with $<75\%$ alert |
| `GET` | `/api/attendance/reports/export-csv`| `faculty`, `admin` | Export class attendance records to CSV format |
| `GET` | `/api/attendance/reports/export-pdf`| `faculty`, `admin` | Generate formatted attendance PDF sheet |
| `POST` | `/api/visitors` | `security`, `admin` | Register pre-registered or walk-in campus visitor |
| `POST` | `/api/visitors/scan` | `security` | Scan visitor pass (Check-in $\rightarrow$ Check-out $\rightarrow$ Blocked) |
| `GET` | `/api/visitors/on-campus` | `security`, `admin` | List visitors currently checked in inside campus |

### M4. Campus Maintenance & Complaint Reporting Application
| Method | Endpoint | Allowed Roles | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/complaints` | `student`, `faculty`| Raise maintenance complaint with auto SLA (Algorithm H) |
| `GET` | `/api/complaints` | Authenticated | List complaints (role-scoped or all for admin) |
| `GET` | `/api/complaints/:id` | Authenticated | View complaint details with complete audit timeline |
| `PATCH`| `/api/complaints/:id/status`| `maintenance`, `admin` | Advance complaint status linearly with remarks & images |
| `POST` | `/api/complaints/:id/feedback`| Ticket Owner, `admin`| Submit 1-5 star rating and close ticket |
| `GET` | `/api/complaints/analytics/overview`| `admin` | View SLA breach rates, MTTR, category breakdowns |

### M5. Smart College Event & Activity Notification System
| Method | Endpoint | Allowed Roles | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/events` | Authenticated | List published upcoming events with audience filters |
| `POST` | `/api/events` | `admin`, `faculty` | Create new college event with capacity & audience rules |
| `GET` | `/api/events/:id` | Authenticated | View event details & registration counts |
| `POST` | `/api/events/:id/register` | Authenticated | Register for event or join waitlist (Algorithm I) |
| `POST` | `/api/events/:id/cancel` | Authenticated | Cancel registration & auto-promote next waitlist user |
| `GET` | `/api/events/user/my` | Authenticated | List current user's registered events |
| `POST` | `/api/events/:id/checkin` | `admin`, Organizer | Check in attendee via QR pass scan |

### Shared & Operations APIs
| Method | Endpoint | Allowed Roles | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/dashboard/summary` | Authenticated | Aggregated role-tailored dashboard metrics |
| `GET` | `/api/search` | Authenticated | Global multi-module search query across campus |
| `GET` | `/api/notifications` | Authenticated | Retrieve user notifications with filter by type |
| `PATCH`| `/api/notifications/:id/read` | Authenticated | Mark specific notification as read |
| `PATCH`| `/api/notifications/read-all`| Authenticated | Mark all notifications read for current user |
| `GET` | `/api/audit-logs` | `admin` | Query system audit trails with pagination |

---

## 💡 Assumptions & Design Choices

In accordance with execution guidelines, the following engineering assumptions were implemented:
1. **Academic Weekday Mapping**: Days of week are indexed $0$ through $6$ where $0 = \text{Sunday}, 1 = \text{Monday}, \dots, 6 = \text{Saturday}$. Timetable entries reference standard working days Monday ($1$) through Friday ($5$).
2. **Dynamic QR Token Windows**: The 20-second dynamic QR code window allows acceptance of both the current window ($\lfloor t / 20 \rfloor$) and the immediate predecessor ($\lfloor t / 20 \rfloor - 1$) to account for camera focus latency and device clock drift up to 20 seconds.
3. **Local Storage Persistence**: Uploaded images (lost/found items, claim proofs, complaint attachments) are stored on the server's local filesystem in `server/uploads/` and exposed via static HTTP paths. No external S3 or cloud bucket is required.
4. **Email Delivery Graceful Fallback**: If standard SMTP environment variables (`SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`) are unset, the email service initializes an in-memory Nodemailer test account (Ethereal Email) while printing full email previews directly to the server terminal.
5. **Visitor Pass Codes**: Generated as cryptographically random 10-character uppercase alphanumeric strings (e.g., `VIS-8K2N9X`), guaranteeing zero collision and convenient mobile camera scanning.
6. **Complaint Ticket Format**: Sequential annual ticketing `CMP-YYYY-0001` (e.g. `CMP-2026-0001`) reset cleanly per calendar year.

---

## 🔒 Security & Data Integrity Highlights

- **JWT Authentication**: Signed with HS256, strictly validated via HTTP Bearer headers, and configured with a 24-hour expiration window.
- **RBAC Enforcement**: Declarative route guards (`authorize('admin', 'faculty')`) verify role authorization at both the API route and UI navigation levels.
- **Rate Limiting**: Tiered protection with `express-rate-limit`: 1,000 requests per 15-minute window for standard API routes, and 30 requests per 15-minute window on authentication entrypoints (`/api/auth/login`, `/api/auth/register`).
- **Input Sanitization**: Native middleware strips MongoDB operator keys (keys starting with `$` or containing `.`) across `req.body`, `req.query`, and `req.params` to prevent NoSQL injection.
- **Security Headers**: Standardized HTTP headers enforced via `helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } })`.

---

## 🧪 Acceptance Testing Guide

The system meets all 10 acceptance test criteria defined in the technical specification:

1. **Room Clash Prevention**: Booking LHC-101 for Monday 09:00-10:00 when an active class exists immediately returns `409 Conflict` naming the conflicting slot.
2. **Free Room Finder Accuracy**: Rooms with scheduled classes are eliminated from search results; available rooms are returned sorted by smallest sufficient capacity.
3. **Dynamic QR Anti-Proxying**: Reusing an attendance QR code after 20 seconds or attempting duplicate scans returns an error and `409 Conflict` respectively.
4. **Real-time Live Attendance**: Scanning an attendance QR code immediately renders the student's name on the faculty's live monitor over Socket.io without manual refresh.
5. **Visitor Gate Finite State Machine**: First scan transitions status to `checked_in`; second scan transitions to `checked_out`; third scan rejects with "Pass already used".
6. **Lost & Found Jaccard Matching**: Reporting a lost "Black Dell Laptop" computes a $\ge 50$ match score against a found "Found Dell Laptop Charger and Bag" in the same area, notifying both users.
7. **Complaint Forward State & SLA Escalation**: Tickets advance strictly forward (`submitted` $\rightarrow$ `assigned` $\rightarrow$ `in_progress` $\rightarrow$ `resolved` $\rightarrow$ `closed`), with overdue tickets automatically flagged `escalated = true` by the 15-minute cron.
8. **Automatic Event Waitlist Promotion**: Creating an event with capacity 2 and registering 3 students waitlists the 3rd; cancelling one registration instantly promotes the 3rd student to `registered`.
9. **Role-Based Navigation Guards**: Logging in as student hides administrative links, and attempting direct URL navigation to `/admin/users` redirects safely with an access denial toast.
10. **Attendance Export Fidelity**: Downloading attendance reports generates real CSV files (parsed by `json2csv`) and well-formatted PDF summary tables (rendered with `pdfkit`).

---

## 📜 License & Acknowledgements

Developed as an autonomous, production-ready solution for the **Smart Campus Solutions** platform specification. Licensed under the MIT License.
