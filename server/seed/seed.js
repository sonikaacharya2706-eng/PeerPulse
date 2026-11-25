import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Import models
import User from '../models/User.js';
import Classroom from '../models/Classroom.js';
import Timetable from '../models/Timetable.js';
import RoomBooking from '../models/RoomBooking.js';
import LostFoundItem from '../models/LostFoundItem.js';
import Claim from '../models/Claim.js';
import AttendanceSession from '../models/AttendanceSession.js';
import AttendanceRecord from '../models/AttendanceRecord.js';
import Visitor from '../models/Visitor.js';
import Complaint from '../models/Complaint.js';
import Event from '../models/Event.js';
import EventRegistration from '../models/EventRegistration.js';
import Notification from '../models/Notification.js';
import AuditLog from '../models/AuditLog.js';
import TimetableImage from '../models/TimetableImage.js';

import File from '../models/File.js';

import { extractKeywords } from '../services/matchingService.js';
import { generateVisitorPassCode } from '../services/attendanceCrypto.js';
import { calculateSlaDueAt } from '../services/slaCron.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/smart_campus';

const seedDatabase = async () => {
  try {
    console.log('[Seed] Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('[Seed] Connected.');

    // Safe to run once: check if database is already seeded
    const existingAdmin = await User.findOne({ email: 'admin@campus.edu' });
    const isForce = process.argv.includes('--force') || process.env.SEED_FORCE === 'true';

    if (existingAdmin && !isForce) {
      console.log('[Seed] Database is already initialized (admin@campus.edu exists). Skipping seed to preserve production data.');
      console.log('[Seed] To refresh demo data, run npm run seed -- --force only against a demo database; this clears existing collections.');
      process.exit(0);
    }

    console.log('[Seed] Clearing existing collections...');

    // Wipe collections
    await Promise.all([
      User.deleteMany(),
      Classroom.deleteMany(),
      Timetable.deleteMany(),
      RoomBooking.deleteMany(),
      LostFoundItem.deleteMany(),
      Claim.deleteMany(),
      AttendanceSession.deleteMany(),
      AttendanceRecord.deleteMany(),
      Visitor.deleteMany(),
      Complaint.deleteMany(),
      Event.deleteMany(),
      EventRegistration.deleteMany(),
      Notification.deleteMany(),
      AuditLog.deleteMany(),
      File.deleteMany(),
      TimetableImage.deleteMany(),
    ]);

    console.log('[Seed] Database wiped. Seeding new initial data...');

    // 1. ACCOUNTS (Password: Campus@123)
    const commonPassword = 'Campus@123';

    // Admin
    const admin = await User.create({
      name: 'System Administrator',
      email: 'admin@campus.edu',
      password: commonPassword,
      role: 'admin',
      department: 'Campus IT Operations',
      phone: '+91 9876500000',
    });

    // Faculty (Canara Engineering College ISE Department)
    const faculty1 = await User.create({
      name: 'Dr. Sandeep Kini',
      email: 'sandeepkini@canaraengineering.in',
      password: commonPassword,
      role: 'faculty',
      department: 'ISE',
      phone: '+91 9876500001',
    });

    const faculty2 = await User.create({
      name: 'Prof. Pradeep M',
      email: 'pradeepm@canaraengineering.in',
      password: commonPassword,
      role: 'faculty',
      department: 'ISE',
      phone: '+91 9876500002',
    });

    const faculty3 = await User.create({
      name: 'Prof. Geetha Laxmi',
      email: 'geetha.laxmi@canaraengineering.in',
      password: commonPassword,
      role: 'faculty',
      department: 'ISE',
      phone: '+91 9876500003',
    });

    const faculty4 = await User.create({
      name: 'Prof. Yashaswini',
      email: 'yashaswini@canaraengineering.in',
      password: commonPassword,
      role: 'faculty',
      department: 'ISE',
      phone: '+91 9876500004',
    });

    // Students (15 Canara Engineering College ISE Students)
    const studentData = [
      { name: 'Shwetha S P', email: 'mgssp3014@gmail.com', rollNo: '4CB22IS001', year: 3, phone: '+91 9876510001' },
      { name: 'Shreya Gouda', email: 'shreyagouda722@gmail.com', rollNo: '4CB22IS002', year: 3, phone: '+91 9876510002' },
      { name: 'Spoorthi J Gatty', email: 'spoorthijgatty2@gmail.com', rollNo: '4CB22IS003', year: 3, phone: '+91 9876510003' },
      { name: 'Sonika Acharya', email: 'sonikaacharya2706@gmail.com', rollNo: '4CB22IS004', year: 3, phone: '+91 9876510004' },
      { name: 'Soukhya', email: 'soukhya0510@gmail.com', rollNo: '4CB22IS005', year: 3, phone: '+91 9876510005' },
      { name: 'Rashmi Shetty', email: 'rashmishetty310@gmail.com', rollNo: '4CB22IS006', year: 3, phone: '+91 9876510006' },
      { name: 'Pramod S', email: 'pramodsmg05@gmail.com', rollNo: '4CB22IS007', year: 3, phone: '+91 9876510007' },
      { name: 'Prathamesh', email: 'prathameshprathamesh198@gmail.com', rollNo: '4CB22IS008', year: 3, phone: '+91 9876510008' },
      { name: 'Shriguru Naik', email: 'shrigurunaik14@gmail.com', rollNo: '4CB22IS009', year: 3, phone: '+91 9876510009' },
      { name: 'Prajwal Kulal', email: 'kulalprajwal309@gmail.com', rollNo: '4CB22IS010', year: 3, phone: '+91 9876510010' },
      { name: 'Sachin Byndoor', email: 'sachinbyndoor05@gmail.com', rollNo: '4CB22IS011', year: 3, phone: '+91 9876510011' },
      { name: 'Harshith K', email: 'gjehehdhzzzhzhx7656@gmail.com', rollNo: '4CB22IS012', year: 3, phone: '+91 9876510012' },
      { name: 'Pramod V', email: 'pramodvishakanta796@gmail.com', rollNo: '4CB22IS013', year: 3, phone: '+91 9876510013' },
      { name: 'Vaibhav Netta', email: 'vaibhavnetta@gmail.com', rollNo: '4CB22IS014', year: 3, phone: '+91 9876510014' },
      { name: 'Rathnam', email: 'rathnamskjk@gmail.com', rollNo: '4CB22IS015', year: 3, phone: '+91 9876510015' },
    ];

    const students = [];
    for (let i = 0; i < studentData.length; i++) {
      const s = studentData[i];
      const st = await User.create({
        name: s.name,
        email: s.email.trim().toLowerCase(),
        password: commonPassword,
        role: 'student',
        department: 'ISE',
        year: s.year,
        rollNo: s.rollNo,
        phone: s.phone,
        clubs: i % 2 === 0 ? ['Coding Club', 'Robotics Club'] : ['Music Society', 'Sports Club'],
      });
      students.push(st);
    }

    // Security Gate
    const security = await User.create({
      name: 'Officer Robert Vance',
      email: 'security@campus.edu',
      password: commonPassword,
      role: 'security',
      department: 'Campus Gate Security',
      phone: '+91 9876500003',
    });

    // Maintenance Technicians (3)
    const maintenanceMain = await User.create({
      name: 'Campus Maintenance Desk',
      email: 'maintenance@campus.edu',
      password: commonPassword,
      role: 'maintenance',
      department: 'Facilities Maintenance',
      phone: '+91 9876500004',
    });

    const maintenance1 = await User.create({
      name: 'Dave Electricals',
      email: 'maintenance1@campus.edu',
      password: commonPassword,
      role: 'maintenance',
      department: 'Facilities Maintenance',
      phone: '+91 9876500004',
    });

    const maintenance2 = await User.create({
      name: 'Frank Plumber',
      email: 'maintenance2@campus.edu',
      password: commonPassword,
      role: 'maintenance',
      department: 'Facilities Maintenance',
      phone: '+91 9876500005',
    });

    console.log('[Seed] 17 User accounts seeded.');

    // 2. CLASSROOMS (12 classrooms: lecture, lab, seminar)
    const classroomDefs = [
      { roomNo: 'LHC-101', building: 'Lecture Hall Complex', floor: 1, capacity: 120, type: 'lecture', facilities: ['Projector', 'Audio System', 'AC'] },
      { roomNo: 'LHC-102', building: 'Lecture Hall Complex', floor: 1, capacity: 120, type: 'lecture', facilities: ['Projector', 'Smart Board', 'AC'] },
      { roomNo: 'LHC-201', building: 'Lecture Hall Complex', floor: 2, capacity: 90, type: 'lecture', facilities: ['Projector', 'Whiteboard', 'AC'] },
      { roomNo: 'LHC-202', building: 'Lecture Hall Complex', floor: 2, capacity: 90, type: 'lecture', facilities: ['Projector', 'Whiteboard'] },
      { roomNo: 'CS-LAB-1', building: 'Computer Center', floor: 1, capacity: 45, type: 'lab', facilities: ['Workstations', 'High-speed LAN', 'AC', 'Projector'] },
      { roomNo: 'CS-LAB-2', building: 'Computer Center', floor: 1, capacity: 45, type: 'lab', facilities: ['Workstations', 'GPU Cluster', 'AC'] },
      { roomNo: 'EC-LAB-1', building: 'Electronics Block', floor: 2, capacity: 40, type: 'lab', facilities: ['Oscilloscopes', 'Breadboards', 'Soldering Stations'] },
      { roomNo: 'EC-LAB-2', building: 'Electronics Block', floor: 2, capacity: 40, type: 'lab', facilities: ['VLSI Workstations', 'FPGA Kits', 'AC'] },
      { roomNo: 'SEM-301', building: 'Administrative Tower', floor: 3, capacity: 60, type: 'seminar', facilities: ['Video Conference', 'Surround Sound', 'AC', 'Podium'] },
      { roomNo: 'SEM-302', building: 'Administrative Tower', floor: 3, capacity: 80, type: 'seminar', facilities: ['Dual Projectors', 'Recording System', 'AC'] },
      { roomNo: 'CR-301', building: 'Science Block', floor: 3, capacity: 50, type: 'lecture', facilities: ['Whiteboard', 'Projector'] },
      { roomNo: 'CR-302', building: 'Science Block', floor: 3, capacity: 50, type: 'lecture', facilities: ['Whiteboard', 'Projector', 'AC'] },
    ];

    const classrooms = await Classroom.insertMany(classroomDefs);
    console.log('[Seed] 12 Classrooms seeded.');

    // 3. WEEKLY TIMETABLE FOR 2 CLASSES (ISE Year 2 Sec A, and ISE Year 3 Sec A)
    const timetableEntries = [
      // ISE Year 2 Sec A - Monday (Day 1) to Friday (Day 5)
      { classroom: classrooms[0]._id, subject: 'Data Structures & Algorithms', faculty: faculty1._id, department: 'ISE', year: 2, section: 'A', dayOfWeek: 1, startTime: '09:00', endTime: '10:00' },
      { classroom: classrooms[1]._id, subject: 'Computer Architecture', faculty: faculty2._id, department: 'ISE', year: 2, section: 'A', dayOfWeek: 1, startTime: '10:00', endTime: '11:00' },
      { classroom: classrooms[4]._id, subject: 'DSA Lab Practical', faculty: faculty1._id, department: 'ISE', year: 2, section: 'A', dayOfWeek: 1, startTime: '14:00', endTime: '16:00' },

      { classroom: classrooms[0]._id, subject: 'Discrete Mathematics', faculty: faculty2._id, department: 'ISE', year: 2, section: 'A', dayOfWeek: 2, startTime: '09:00', endTime: '10:00' },
      { classroom: classrooms[1]._id, subject: 'Data Structures & Algorithms', faculty: faculty1._id, department: 'ISE', year: 2, section: 'A', dayOfWeek: 2, startTime: '11:00', endTime: '12:00' },

      { classroom: classrooms[0]._id, subject: 'Digital Logic Design', faculty: faculty2._id, department: 'ISE', year: 2, section: 'A', dayOfWeek: 3, startTime: '10:00', endTime: '11:00' },
      { classroom: classrooms[4]._id, subject: 'Web Technologies Lab', faculty: faculty1._id, department: 'ISE', year: 2, section: 'A', dayOfWeek: 3, startTime: '14:00', endTime: '16:00' },

      { classroom: classrooms[1]._id, subject: 'Computer Architecture', faculty: faculty2._id, department: 'ISE', year: 2, section: 'A', dayOfWeek: 4, startTime: '09:00', endTime: '10:00' },
      { classroom: classrooms[0]._id, subject: 'Discrete Mathematics', faculty: faculty2._id, department: 'ISE', year: 2, section: 'A', dayOfWeek: 4, startTime: '11:00', endTime: '12:00' },

      { classroom: classrooms[0]._id, subject: 'Data Structures & Algorithms', faculty: faculty1._id, department: 'ISE', year: 2, section: 'A', dayOfWeek: 5, startTime: '10:00', endTime: '11:00' },

      // ISE Year 3 Sec A
      { classroom: classrooms[2]._id, subject: 'Operating Systems', faculty: faculty1._id, department: 'ISE', year: 3, section: 'A', dayOfWeek: 1, startTime: '11:00', endTime: '12:00' },
      { classroom: classrooms[5]._id, subject: 'OS Kernel Lab', faculty: faculty1._id, department: 'ISE', year: 3, section: 'A', dayOfWeek: 1, startTime: '14:00', endTime: '16:00' },
      { classroom: classrooms[2]._id, subject: 'Database Management Systems', faculty: faculty2._id, department: 'ISE', year: 3, section: 'A', dayOfWeek: 2, startTime: '10:00', endTime: '11:00' },
      { classroom: classrooms[2]._id, subject: 'Computer Networks', faculty: faculty1._id, department: 'ISE', year: 3, section: 'A', dayOfWeek: 3, startTime: '09:00', endTime: '10:00' },
      { classroom: classrooms[2]._id, subject: 'Software Engineering', faculty: faculty2._id, department: 'ISE', year: 3, section: 'A', dayOfWeek: 4, startTime: '10:00', endTime: '11:00' },
      { classroom: classrooms[5]._id, subject: 'DBMS Project Lab', faculty: faculty2._id, department: 'ISE', year: 3, section: 'A', dayOfWeek: 5, startTime: '14:00', endTime: '16:00' },
    ];

    await Timetable.insertMany(timetableEntries);
    console.log('[Seed] Weekly timetable for 2 full classes seeded.');

    // 3B. OFFICIAL TIMETABLE IMAGE SHEETS (Uploaded by Faculty for Students)
    const sampleTimetableSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="520" viewBox="0 0 900 520" style="background:#0f172a;font-family:system-ui,-apple-system,sans-serif;">
      <rect x="15" y="15" width="870" height="490" rx="14" fill="#1e293b" stroke="#0284c7" stroke-width="2"/>
      <text x="450" y="55" fill="#38bdf8" font-size="20" font-weight="bold" text-anchor="middle">DEPARTMENT OF COMPUTER SCIENCE &amp; ENGINEERING</text>
      <text x="450" y="80" fill="#94a3b8" font-size="13" text-anchor="middle">Official Weekly Lecture &amp; Lab Schedule - Odd Semester 2026</text>
      <line x1="30" y1="100" x2="870" y2="100" stroke="#334155" stroke-width="1.5"/>
      
      <!-- Day Row Headers -->
      <rect x="40" y="120" width="110" height="42" fill="#0284c7" rx="6"/>
      <text x="95" y="146" fill="#fff" font-size="13" font-weight="bold" text-anchor="middle">MONDAY</text>
      <rect x="160" y="120" width="220" height="42" fill="#334155" rx="6"/>
      <text x="270" y="146" fill="#f1f5f9" font-size="12" text-anchor="middle">09:00 - DSA (LHC-101)</text>
      <rect x="390" y="120" width="220" height="42" fill="#334155" rx="6"/>
      <text x="500" y="146" fill="#f1f5f9" font-size="12" text-anchor="middle">10:00 - COA (LHC-102)</text>
      <rect x="620" y="120" width="240" height="42" fill="#0369a1" rx="6"/>
      <text x="740" y="146" fill="#f1f5f9" font-size="12" text-anchor="middle">14:00 - DSA Lab (CS-LAB-1)</text>

      <rect x="40" y="180" width="110" height="42" fill="#0284c7" rx="6"/>
      <text x="95" y="206" fill="#fff" font-size="13" font-weight="bold" text-anchor="middle">TUESDAY</text>
      <rect x="160" y="180" width="220" height="42" fill="#334155" rx="6"/>
      <text x="270" y="206" fill="#f1f5f9" font-size="12" text-anchor="middle">09:00 - Discrete Math</text>
      <rect x="390" y="180" width="220" height="42" fill="#334155" rx="6"/>
      <text x="500" y="206" fill="#f1f5f9" font-size="12" text-anchor="middle">11:00 - DSA Review</text>
      <rect x="620" y="180" width="240" height="42" fill="#334155" rx="6"/>
      <text x="740" y="206" fill="#f1f5f9" font-size="12" text-anchor="middle">14:00 - Problem Solving</text>

      <rect x="40" y="240" width="110" height="42" fill="#0284c7" rx="6"/>
      <text x="95" y="266" fill="#fff" font-size="13" font-weight="bold" text-anchor="middle">WEDNESDAY</text>
      <rect x="160" y="240" width="220" height="42" fill="#334155" rx="6"/>
      <text x="270" y="266" fill="#f1f5f9" font-size="12" text-anchor="middle">10:00 - Digital Logic Design</text>
      <rect x="390" y="240" width="220" height="42" fill="#0369a1" rx="6"/>
      <text x="500" y="266" fill="#f1f5f9" font-size="12" text-anchor="middle">11:00 - Web Technologies</text>
      <rect x="620" y="240" width="240" height="42" fill="#334155" rx="6"/>
      <text x="740" y="266" fill="#f1f5f9" font-size="12" text-anchor="middle">15:00 - Self Study</text>

      <rect x="40" y="300" width="110" height="42" fill="#0284c7" rx="6"/>
      <text x="95" y="326" fill="#fff" font-size="13" font-weight="bold" text-anchor="middle">THURSDAY</text>
      <rect x="160" y="300" width="220" height="42" fill="#334155" rx="6"/>
      <text x="270" y="326" fill="#f1f5f9" font-size="12" text-anchor="middle">09:00 - Database Systems</text>
      <rect x="390" y="300" width="220" height="42" fill="#334155" rx="6"/>
      <text x="500" y="326" fill="#f1f5f9" font-size="12" text-anchor="middle">10:00 - Operating Systems</text>
      <rect x="620" y="300" width="240" height="42" fill="#0369a1" rx="6"/>
      <text x="740" y="326" fill="#f1f5f9" font-size="12" text-anchor="middle">14:00 - OS Hands-on Lab</text>

      <rect x="40" y="360" width="110" height="42" fill="#0284c7" rx="6"/>
      <text x="95" y="386" fill="#fff" font-size="13" font-weight="bold" text-anchor="middle">FRIDAY</text>
      <rect x="160" y="360" width="220" height="42" fill="#334155" rx="6"/>
      <text x="270" y="386" fill="#f1f5f9" font-size="12" text-anchor="middle">09:00 - Computer Networks</text>
      <rect x="390" y="360" width="220" height="42" fill="#334155" rx="6"/>
      <text x="500" y="386" fill="#f1f5f9" font-size="12" text-anchor="middle">11:00 - Technical Seminar</text>
      <rect x="620" y="360" width="240" height="42" fill="#334155" rx="6"/>
      <text x="740" y="386" fill="#f1f5f9" font-size="12" text-anchor="middle">15:00 - Sports &amp; Clubs</text>

      <text x="450" y="475" fill="#64748b" font-size="11" text-anchor="middle">Signed &amp; Approved by HOD Dr. Alan Turing &bull; Ref: ISE/2026/TT-01</text>
    </svg>`;

    const timetableFile = await File.create({
      filename: 'cse-yr2-timetable.svg',
      contentType: 'image/svg+xml',
      size: Buffer.byteLength(sampleTimetableSvg),
      data: Buffer.from(sampleTimetableSvg),
      uploadedBy: faculty1._id,
    });

    await TimetableImage.create([
      {
        title: 'ISE 2nd Year Section A Master Timetable',
        department: 'ISE',
        year: 2,
        section: 'A',
        semester: 'Odd Semester 2026',
        description: 'Official department timetable sheet approved by HOD. Effective from start of semester.',
        imageUrl: `/api/files/${timetableFile._id}`,
        uploadedBy: faculty1._id,
      },
      {
        title: 'ISE 3rd Year Section A Master Timetable',
        department: 'ISE',
        year: 3,
        section: 'A',
        semester: 'Odd Semester 2026',
        description: 'Includes revised elective schedules and lab batch allocations.',
        imageUrl: `/api/files/${timetableFile._id}`,
        uploadedBy: faculty2._id,
      },
    ]);
    console.log('[Seed] Official Timetable image sheets seeded.');

    // 4. ROOM BOOKINGS (4 bookings in mixed states)
    const today = new Date();
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    const dayAfter = new Date(today.getTime() + 48 * 60 * 60 * 1000);

    await RoomBooking.create([
      {
        classroom: classrooms[8]._id, // SEM-301
        requestedBy: faculty1._id,
        date: today,
        startTime: '16:30',
        endTime: '18:00',
        purpose: 'AI/ML Guest Lecture by Industry Expert',
        expectedStrength: 50,
        status: 'approved',
        adminRemark: 'Approved by Dean Office',
      },
      {
        classroom: classrooms[9]._id, // SEM-302
        requestedBy: faculty2._id,
        date: tomorrow,
        startTime: '14:00',
        endTime: '16:00',
        purpose: 'Coding Club Technical Workshop',
        expectedStrength: 60,
        status: 'pending',
      },
      {
        classroom: classrooms[2]._id, // LHC-201
        requestedBy: faculty1._id,
        date: dayAfter,
        startTime: '15:00',
        endTime: '17:00',
        purpose: 'Departmental Faculty Council Meeting',
        expectedStrength: 30,
        status: 'approved',
        adminRemark: 'Room booked and reserved',
      },
      {
        classroom: classrooms[0]._id, // LHC-101
        requestedBy: faculty2._id,
        date: tomorrow,
        startTime: '09:00',
        endTime: '11:00',
        purpose: 'Extra Remedial Class',
        expectedStrength: 40,
        status: 'rejected',
        adminRemark: 'Clashes with regular scheduled lectures in LHC-101',
      },
    ]);
    console.log('[Seed] 4 Room bookings seeded in mixed states.');

    // 5. LOST AND FOUND ITEMS (10 items, including 2 intentionally matching pairs with score >= 50)
    // Pair 1 Match: Lost Apple iPhone vs Found Apple iPhone in Library
    // Pair 2 Match: Lost Dell Laptop Charger in CS-LAB-1 vs Found Dell Charger in Computer Center
    const lfItems = [
      // Pair 1: Lost item
      {
        type: 'lost',
        title: 'Black Apple iPhone 13 Pro',
        category: 'electronics',
        description: 'Lost my black iPhone 13 with a clear silicone case and a small scratch on camera rim.',
        dateOccurred: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        location: 'Central Library 2nd Floor Reading Room',
        reportedBy: students[0]._id,
        status: 'reported',
        keywords: extractKeywords('Black Apple iPhone 13 Pro black iPhone clear case silicone scratch camera'),
      },
      // Pair 1: Matching Found item (Same category + high keyword overlap + same location + within 7 days -> Score ~85%)
      {
        type: 'found',
        title: 'Found Apple iPhone 13 Black Phone',
        category: 'electronics',
        description: 'Found a black iPhone 13 phone lying near reading desk in Central Library with clear case.',
        dateOccurred: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        location: 'Central Library 2nd Floor',
        reportedBy: security._id,
        status: 'reported',
        keywords: extractKeywords('Found Apple iPhone 13 Black Phone black iPhone reading desk Central Library clear case'),
      },

      // Pair 2: Lost Dell Charger
      {
        type: 'lost',
        title: 'Dell 65W Type-C Laptop Charger',
        category: 'electronics',
        description: 'Left my black Dell USB-C laptop charger plugged into the wall in Computer Lab 1.',
        dateOccurred: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        location: 'Computer Center CS-LAB-1',
        reportedBy: students[1]._id,
        status: 'reported',
        keywords: extractKeywords('Dell 65W Type-C Laptop Charger black Dell USB-C charger wall Computer Lab'),
      },
      // Pair 2: Matching Found item
      {
        type: 'found',
        title: 'Found Dell Laptop Charger 65W Adapter',
        category: 'electronics',
        description: 'A 65W Dell laptop adapter was found under a terminal table in Computer Center Lab 1.',
        dateOccurred: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        location: 'Computer Center CS-LAB-1 Lab 1',
        reportedBy: maintenance1._id,
        status: 'reported',
        keywords: extractKeywords('Found Dell Laptop Charger 65W Adapter Dell laptop adapter terminal Computer Center Lab'),
      },

      // Other varied items
      {
        type: 'lost',
        title: 'Student ID Card - 22CS004',
        category: 'id_cards',
        description: 'Lost student identity smart card with lanyard.',
        dateOccurred: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        location: 'Main Campus Cafeteria',
        reportedBy: students[3]._id,
        status: 'reported',
        keywords: extractKeywords('Student ID Card 22CS004 identity smart card lanyard Cafeteria'),
      },
      {
        type: 'found',
        title: 'Found Identity Card for Emma Watson',
        category: 'id_cards',
        description: 'Student ID card picked up from cafeteria billing counter.',
        dateOccurred: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        location: 'Main Campus Cafeteria Billing Counter',
        reportedBy: security._id,
        status: 'claimed',
        keywords: extractKeywords('Found Identity Card Emma Watson student ID cafeteria billing counter'),
      },
      {
        type: 'lost',
        title: 'Blue Water Bottle Milton Steel',
        category: 'accessories',
        description: 'Stainless steel blue insulated flask with campus coding sticker.',
        dateOccurred: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        location: 'Sports Ground Pavilion',
        reportedBy: students[2]._id,
        status: 'reported',
        keywords: extractKeywords('Blue Water Bottle Milton Steel stainless steel flask coding sticker Sports Ground'),
      },
      {
        type: 'found',
        title: 'Found Bicycle Key with Red Lanyard',
        category: 'keys',
        description: 'Single brass key on red Hero bicycle keychain.',
        dateOccurred: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        location: 'Main Gate Cycle Stand',
        reportedBy: security._id,
        status: 'reported',
        keywords: extractKeywords('Found Bicycle Key Red Lanyard single brass key Hero keychain Cycle Stand'),
      },
      {
        type: 'lost',
        title: 'Calculus and Linear Algebra Textbook',
        category: 'books',
        description: 'Hardcover mathematics textbook by Gilbert Strang.',
        dateOccurred: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        location: 'Lecture Hall Complex Room 101',
        reportedBy: students[4]._id,
        status: 'reported',
        keywords: extractKeywords('Calculus Linear Algebra Textbook Hardcover mathematics Gilbert Strang LHC 101'),
      },
      {
        type: 'found',
        title: 'Brown Leather Wallet with Cards',
        category: 'accessories',
        description: 'Men leather wallet found on lawn bench.',
        dateOccurred: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        location: 'Administrative Building Lawn',
        reportedBy: students[5]._id,
        status: 'reported',
        keywords: extractKeywords('Brown Leather Wallet Cards Men leather wallet lawn bench Administrative Building'),
      },
    ];

    const seededLf = await LostFoundItem.insertMany(lfItems);
    console.log('[Seed] 10 Lost/Found items seeded (with 2 intentionally matching pairs).');

    const seededClaims = await Claim.create([
      {
        item: seededLf[1]._id,
        claimant: students[0]._id,
        proofDescription: 'The phone has my distinctive clear case and a small scratch beside the rear camera.',
        status: 'pending',
      },
      {
        item: seededLf[5]._id,
        claimant: students[3]._id,
        proofDescription: 'The name and student details on the identity card match my campus profile.',
        status: 'approved',
        verifiedBy: admin._id,
        remark: 'Student identity verified; item returned at the security desk.',
      },
      {
        item: seededLf[7]._id,
        claimant: students[4]._id,
        proofDescription: 'I believe this key belongs to me, but I cannot identify the attached keychain.',
        status: 'rejected',
        verifiedBy: admin._id,
        remark: 'Claimant could not provide identifying details for the key.',
      },
    ]);
    console.log('[Seed] 3 ownership claims seeded across pending, approved, and rejected states.');

    // 6. PAST ATTENDANCE SESSIONS & RECORDS for both ISE demo cohorts
    const pastSessions = [];
    const attendanceCohorts = [
      {
        year: 2,
        subject: 'Data Structures & Algorithms',
        classroom: classrooms[0]._id,
        students: [
          { student: students[1], attendedSessions: [1, 2] },
          { student: students[3], attendedSessions: [1, 2, 3] },
        ],
      },
      {
        year: 3,
        subject: 'Operating Systems',
        classroom: classrooms[2]._id,
        students: [
          { student: students[0], attendedSessions: [1, 2, 3] },
          { student: students[2], attendedSessions: [1] },
        ],
      },
    ];

    for (const cohort of attendanceCohorts) {
      for (let sIdx = 1; sIdx <= 3; sIdx++) {
        const sessDate = new Date(Date.now() - sIdx * 24 * 60 * 60 * 1000);
        const session = await AttendanceSession.create({
          faculty: faculty1._id,
          subject: cohort.subject,
          department: 'ISE',
          year: cohort.year,
          section: 'A',
          classroom: cohort.classroom,
          startedAt: sessDate,
          endsAt: new Date(sessDate.getTime() + 50 * 60 * 1000),
          isActive: false,
          qrSecret: `seed_qr_secret_year_${cohort.year}_session_${sIdx}`,
        });
        pastSessions.push(session);

        for (const studentRecord of cohort.students) {
          if (!studentRecord.attendedSessions.includes(sIdx)) continue;

          await AttendanceRecord.create({
            session: session._id,
            student: studentRecord.student._id,
            deviceId: `seed-device-${studentRecord.student._id}`,
            status: 'present',
            method: 'qr',
            markedAt: new Date(sessDate.getTime() + 5 * 60 * 1000),
          });
        }
      }
    }
    console.log('[Seed] 6 past attendance sessions seeded for ISE Years 2 and 3.');

    // 7. VISITORS (6 visitors in different states: expected, checked_in, checked_out)
    await Visitor.create([
      {
        name: 'Dr. James Anderson',
        phone: '+91 9123456780',
        email: 'j.anderson@oxford.edu',
        purpose: 'Guest Lecture on Quantum Computing',
        personToMeet: faculty1._id,
        idProofType: 'Passport',
        idProofNumber: 'P1234567',
        passCode: generateVisitorPassCode(),
        status: 'checked_in',
        checkInAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // Checked in 2h ago
        registeredBy: security._id,
      },
      {
        name: 'Sarah Connor',
        phone: '+91 9123456781',
        email: 'sarah.c@techcorp.com',
        purpose: 'Campus Recruitment Drive Interviewer',
        personToMeet: faculty2._id,
        idProofType: 'National ID',
        idProofNumber: 'ID-998877',
        passCode: generateVisitorPassCode(),
        status: 'checked_in',
        checkInAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
        registeredBy: security._id,
      },
      {
        name: 'Richard Hendricks',
        phone: '+91 9123456782',
        email: 'richard@piedpiper.com',
        purpose: 'Discussion on Research Grant Collaboration',
        personToMeet: faculty1._id,
        idProofType: 'Driver License',
        idProofNumber: 'DL-887766',
        passCode: generateVisitorPassCode(),
        status: 'checked_out',
        checkInAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
        checkOutAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
        registeredBy: security._id,
      },
      {
        name: 'Emily Blunt',
        phone: '+91 9123456783',
        email: 'emily@guest.com',
        purpose: 'Parent Inquiry for Admissions',
        personToMeet: admin._id,
        idProofType: 'National ID',
        idProofNumber: 'ID-554433',
        passCode: generateVisitorPassCode(),
        status: 'expected',
        expectedDate: new Date(),
        registeredBy: security._id,
      },
      {
        name: 'David Attenborough',
        phone: '+91 9123456784',
        email: 'david@wildlife.org',
        purpose: 'Environmental Audit Inspection',
        personToMeet: admin._id,
        idProofType: 'Passport',
        idProofNumber: 'P7654321',
        passCode: generateVisitorPassCode(),
        status: 'expected',
        expectedDate: tomorrow,
        registeredBy: admin._id,
      },
      {
        name: 'George Clark',
        phone: '+91 9123456785',
        email: 'george@furnituresupplier.com',
        purpose: 'Classroom Furniture Maintenance Inspection',
        personToMeet: maintenance1._id,
        idProofType: 'Driver License',
        idProofNumber: 'DL-223344',
        passCode: generateVisitorPassCode(),
        status: 'checked_out',
        checkInAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
        checkOutAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
        registeredBy: security._id,
      },
    ]);
    console.log('[Seed] 6 Visitors seeded in expected, checked_in, and checked_out states.');

    // 8. COMPLAINTS (12 complaints across statuses and priorities; one overdue and auto-escalated)
    const complaintDefs = [
      // 1: Overdue Critical Complaint (created 10h ago, SLA is 4h -> breached!)
      {
        ticketId: 'CMP-2026-0001',
        raisedBy: students[0]._id,
        category: 'electrical',
        building: 'Computer Center',
        room: 'CS-LAB-1',
        description: 'Server rack UPS sparked and main power breaker tripped. Lab computers unresponsive.',
        priority: 'critical',
        status: 'assigned',
        assignedTo: maintenance1._id,
        slaDueAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // Due 6h ago!
        escalated: true,
        timeline: [
          { status: 'submitted', by: students[0]._id, remark: 'Submitted emergency ticket', at: new Date(Date.now() - 10 * 60 * 60 * 1000) },
          { status: 'assigned', by: admin._id, remark: 'Assigned to Dave Electricals', at: new Date(Date.now() - 9 * 60 * 60 * 1000) },
          { status: 'assigned', remark: 'SYSTEM SLA BREACH: Exceeded 4h emergency window. Auto-escalated.', at: new Date(Date.now() - 6 * 60 * 60 * 1000) },
        ],
      },
      // 2: In-Progress Plumbing Ticket
      {
        ticketId: 'CMP-2026-0002',
        raisedBy: students[1]._id,
        category: 'plumbing',
        building: 'Science Block',
        room: 'Washroom 2nd Floor',
        description: 'Sink faucet continuously leaking water onto the corridor floor.',
        priority: 'high',
        status: 'in_progress',
        assignedTo: maintenance2._id,
        slaDueAt: new Date(Date.now() + 18 * 60 * 60 * 1000),
        escalated: false,
        timeline: [
          { status: 'submitted', by: students[1]._id, remark: 'Leak reported', at: new Date(Date.now() - 6 * 60 * 60 * 1000) },
          { status: 'assigned', by: admin._id, remark: 'Assigned to Frank Plumber', at: new Date(Date.now() - 5 * 60 * 60 * 1000) },
          { status: 'in_progress', by: maintenance2._id, remark: 'Shut off isolation valve. Procuring washer replacement.', at: new Date(Date.now() - 2 * 60 * 60 * 1000) },
        ],
      },
      // 3: Resolved ticket awaiting student feedback
      {
        ticketId: 'CMP-2026-0003',
        raisedBy: students[2]._id,
        category: 'internet',
        building: 'Lecture Hall Complex',
        room: 'LHC-101',
        description: 'WiFi access point dropping connection every 5 minutes during lectures.',
        priority: 'medium',
        status: 'resolved',
        assignedTo: maintenance1._id,
        slaDueAt: new Date(Date.now() + 30 * 60 * 60 * 1000),
        escalated: false,
        timeline: [
          { status: 'submitted', by: students[2]._id, remark: 'Reported WiFi drop', at: new Date(Date.now() - 20 * 60 * 60 * 1000) },
          { status: 'assigned', by: admin._id, remark: 'Assigned', at: new Date(Date.now() - 18 * 60 * 60 * 1000) },
          { status: 'in_progress', by: maintenance1._id, remark: 'Re-flashing firmware on Cisco AP', at: new Date(Date.now() - 8 * 60 * 60 * 1000) },
          { status: 'resolved', by: maintenance1._id, remark: 'AP firmware updated and signal tests verified at 120Mbps.', at: new Date(Date.now() - 2 * 60 * 60 * 1000) },
        ],
      },
      // 4: Closed Ticket with full 5-star feedback
      {
        ticketId: 'CMP-2026-0004',
        raisedBy: students[0]._id,
        category: 'furniture',
        building: 'Lecture Hall Complex',
        room: 'LHC-201',
        description: 'Desk 14 wooden writing flap is broken and detached.',
        priority: 'low',
        status: 'closed',
        assignedTo: maintenance1._id,
        slaDueAt: new Date(Date.now() + 80 * 60 * 60 * 1000),
        escalated: false,
        timeline: [
          { status: 'submitted', by: students[0]._id, remark: 'Reported broken desk', at: new Date(Date.now() - 40 * 60 * 60 * 1000) },
          { status: 'assigned', by: admin._id, remark: 'Assigned', at: new Date(Date.now() - 36 * 60 * 60 * 1000) },
          { status: 'in_progress', by: maintenance1._id, remark: 'Replaced wooden bracket', at: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          { status: 'resolved', by: maintenance1._id, remark: 'Desk hinges repaired and securely tightened', at: new Date(Date.now() - 12 * 60 * 60 * 1000) },
          { status: 'closed', by: students[0]._id, remark: 'Ticket closed with 5-star feedback: Fixed properly, thanks!', at: new Date(Date.now() - 4 * 60 * 60 * 1000) },
        ],
        feedback: { rating: 5, comment: 'Great job, fixed properly and promptly!' },
      },
      // 5-12: Varied tickets across statuses
      {
        ticketId: 'CMP-2026-0005',
        raisedBy: faculty1._id,
        category: 'cleaning',
        building: 'Administrative Tower',
        room: 'SEM-301',
        description: 'Carpet needs vacuuming and whiteboard markers wiped prior to seminar.',
        priority: 'medium',
        status: 'submitted',
        slaDueAt: calculateSlaDueAt('medium'),
        escalated: false,
        timeline: [{ status: 'submitted', by: faculty1._id, remark: 'Submitted cleaning request', at: new Date() }],
      },
      {
        ticketId: 'CMP-2026-0006',
        raisedBy: faculty2._id,
        category: 'electrical',
        building: 'Science Block',
        room: 'CR-301',
        description: 'Ceiling projector lamp flicker.',
        priority: 'high',
        status: 'submitted',
        slaDueAt: calculateSlaDueAt('high'),
        escalated: false,
        timeline: [{ status: 'submitted', by: faculty2._id, remark: 'Submitted projector lamp flicker', at: new Date() }],
      },
      {
        ticketId: 'CMP-2026-0007',
        raisedBy: students[4]._id,
        category: 'plumbing',
        building: 'Computer Center',
        room: 'Ground Floor Restroom',
        description: 'Flush valve jammed.',
        priority: 'medium',
        status: 'assigned',
        assignedTo: maintenance2._id,
        slaDueAt: calculateSlaDueAt('medium'),
        escalated: false,
        timeline: [
          { status: 'submitted', by: students[4]._id, remark: 'Reported', at: new Date(Date.now() - 4 * 60 * 60 * 1000) },
          { status: 'assigned', by: admin._id, remark: 'Assigned to Frank Plumber', at: new Date(Date.now() - 2 * 60 * 60 * 1000) },
        ],
      },
      {
        ticketId: 'CMP-2026-0008',
        raisedBy: students[5]._id,
        category: 'internet',
        building: 'Science Block',
        room: 'CR-302',
        description: 'No LAN connectivity on podium Ethernet jack.',
        priority: 'medium',
        status: 'in_progress',
        assignedTo: maintenance1._id,
        slaDueAt: calculateSlaDueAt('medium'),
        escalated: false,
        timeline: [
          { status: 'submitted', by: students[5]._id, remark: 'Reported', at: new Date(Date.now() - 10 * 60 * 60 * 1000) },
          { status: 'assigned', by: admin._id, remark: 'Assigned', at: new Date(Date.now() - 8 * 60 * 60 * 1000) },
          { status: 'in_progress', by: maintenance1._id, remark: 'Testing patch panel termination', at: new Date(Date.now() - 1 * 60 * 60 * 1000) },
        ],
      },
      {
        ticketId: 'CMP-2026-0009',
        raisedBy: students[6]._id,
        category: 'furniture',
        building: 'Lecture Hall Complex',
        room: 'LHC-102',
        description: 'Instructor chair armrest detached.',
        priority: 'low',
        status: 'resolved',
        assignedTo: maintenance1._id,
        slaDueAt: calculateSlaDueAt('low'),
        escalated: false,
        timeline: [
          { status: 'submitted', by: students[6]._id, remark: 'Reported', at: new Date(Date.now() - 25 * 60 * 60 * 1000) },
          { status: 'assigned', by: admin._id, remark: 'Assigned', at: new Date(Date.now() - 20 * 60 * 60 * 1000) },
          { status: 'in_progress', by: maintenance1._id, remark: 'Welding armrest', at: new Date(Date.now() - 15 * 60 * 60 * 1000) },
          { status: 'resolved', by: maintenance1._id, remark: 'Repaired and bolted', at: new Date(Date.now() - 5 * 60 * 60 * 1000) },
        ],
      },
      {
        ticketId: 'CMP-2026-0010',
        raisedBy: students[7]._id,
        category: 'cleaning',
        building: 'Electronics Block',
        room: 'EC-LAB-1',
        description: 'Dust accumulation in PCB workstation soldering extractors.',
        priority: 'low',
        status: 'submitted',
        slaDueAt: calculateSlaDueAt('low'),
        escalated: false,
        timeline: [{ status: 'submitted', by: students[7]._id, remark: 'Reported dust buildup', at: new Date() }],
      },
      {
        ticketId: 'CMP-2026-0011',
        raisedBy: students[8]._id,
        category: 'electrical',
        building: 'Lecture Hall Complex',
        room: 'LHC-202',
        description: 'Two fluorescent tubes humming loudly and strobing.',
        priority: 'medium',
        status: 'assigned',
        assignedTo: maintenance1._id,
        slaDueAt: calculateSlaDueAt('medium'),
        escalated: false,
        timeline: [
          { status: 'submitted', by: students[8]._id, remark: 'Reported strobing lights', at: new Date(Date.now() - 8 * 60 * 60 * 1000) },
          { status: 'assigned', by: admin._id, remark: 'Assigned to Dave', at: new Date(Date.now() - 4 * 60 * 60 * 1000) },
        ],
      },
      {
        ticketId: 'CMP-2026-0012',
        raisedBy: students[9]._id,
        category: 'other',
        building: 'Central Library',
        room: 'Entrance Lobby',
        description: 'Glass turnstile RFID card swipe sensor intermittent.',
        priority: 'high',
        status: 'closed',
        assignedTo: maintenance1._id,
        slaDueAt: calculateSlaDueAt('high'),
        escalated: false,
        timeline: [
          { status: 'submitted', by: students[9]._id, remark: 'Reported', at: new Date(Date.now() - 48 * 60 * 60 * 1000) },
          { status: 'assigned', by: admin._id, remark: 'Assigned', at: new Date(Date.now() - 40 * 60 * 60 * 1000) },
          { status: 'in_progress', by: maintenance1._id, remark: 'Re-calibrated NFC sensor', at: new Date(Date.now() - 30 * 60 * 60 * 1000) },
          { status: 'resolved', by: maintenance1._id, remark: 'Replaced optical beam sensor', at: new Date(Date.now() - 20 * 60 * 60 * 1000) },
          { status: 'closed', by: admin._id, remark: 'Verified working at morning gate opening', at: new Date(Date.now() - 10 * 60 * 60 * 1000) },
        ],
        feedback: { rating: 4, comment: 'Gate working smoothly again.' },
      },
      {
        ticketId: 'CMP-2026-0013',
        raisedBy: students[0]._id,
        category: 'electrical',
        building: 'Lecture Hall Complex',
        room: 'LHC-102',
        description: 'Lecture hall projector power connection needs inspection before the next class.',
        priority: 'high',
        status: 'assigned',
        assignedTo: maintenanceMain._id,
        slaDueAt: calculateSlaDueAt('high'),
        escalated: false,
        timeline: [
          { status: 'submitted', by: students[0]._id, remark: 'Reported projector power issue.', at: new Date() },
          { status: 'assigned', by: admin._id, remark: 'Assigned to the Campus Maintenance Desk.', at: new Date() },
        ],
      },
    ];

    const seededComplaints = await Complaint.insertMany(complaintDefs);
    console.log('[Seed] 13 Complaints seeded across statuses (with CMP-2026-0001 auto-escalated for SLA breach).');

    // 9. EVENTS (8 events: past, upcoming, and ONE FULL EVENT WITH WAITLIST for testing Algorithm I)
    // Acceptance Test 8 Event: Capacity = 2, Registrants = 3 (Student 1 & 2 confirmed, Student 3 waitlisted)
    const testEventCapacity2 = await Event.create({
      title: 'Competitive Algorithmic Coding Challenge (Cap 2)',
      description: 'Exclusive 2-seat high-stakes algorithmic sprint. Designed specifically to verify waitlist promotion mechanics.',
      category: 'technical',
      venue: 'Computer Center CS-LAB-2',
      startAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      endAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
      organizer: faculty1._id,
      capacity: 2, // EXACTLY 2 CAPACITY FOR ACCEPTANCE TEST 8!
      registrationDeadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      qrSecret: 'event_secret_cap2',
    });

    // Student 1: Confirmed (1st seat)
    await EventRegistration.create({
      event: testEventCapacity2._id,
      user: students[0]._id,
      status: 'registered',
      createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
    });

    // Student 2: Confirmed (2nd seat -> capacity full!)
    await EventRegistration.create({
      event: testEventCapacity2._id,
      user: students[1]._id,
      status: 'registered',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    });

    // Student 3: Waitlisted (Acceptance Test 8!)
    await EventRegistration.create({
      event: testEventCapacity2._id,
      user: students[2]._id,
      status: 'waitlisted',
      createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
    });

    // 7 more events (past and upcoming)
    const otherEvents = [
      {
        title: 'Smart Campus Annual Hackathon 2026',
        description: '48-hour prototype sprint across Internet of Things, Autonomous Vehicles, and Cloud Infrastructure.',
        category: 'technical',
        venue: 'Main Campus Auditorium',
        startAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        endAt: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000),
        organizer: faculty1._id,
        capacity: 250,
        registrationDeadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        targetDepartments: ['ISE', 'ECE'],
        qrSecret: 'hackathon_secret',
      },
      {
        title: 'Spring Inter-College Cultural Festival',
        description: 'Music competitions, drama skits, dance performances, and art showcases.',
        category: 'cultural',
        venue: 'Open Air Amphitheatre',
        startAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        endAt: new Date(Date.now() + 16 * 24 * 60 * 60 * 1000),
        organizer: faculty2._id,
        capacity: 500,
        registrationDeadline: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
        qrSecret: 'cultural_fest_secret',
      },
      {
        title: 'Hands-on Cloud DevOps & Docker Workshop',
        description: 'Interactive container orchestration, Docker multi-stage builds, and Kubernetes pods.',
        category: 'workshop',
        venue: 'Computer Center CS-LAB-1',
        startAt: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
        endAt: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
        organizer: faculty1._id,
        capacity: 40,
        registrationDeadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        qrSecret: 'devops_workshop_secret',
      },
      {
        title: 'Intra-College Badminton Championship',
        description: 'Men and women singles and doubles knockout tournament.',
        category: 'sports',
        venue: 'Indoor Sports Complex Court 1',
        startAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        endAt: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
        organizer: faculty2._id,
        capacity: 32,
        registrationDeadline: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
        qrSecret: 'badminton_secret',
      },
      {
        title: 'Guest Lecture: Modern Microservices with Node.js',
        description: 'Architecting scalable enterprise backend APIs with Express, Socket.io, and Mongoose.',
        category: 'academic',
        venue: 'Lecture Hall Complex LHC-101',
        startAt: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // ~24h for cron testing
        endAt: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
        organizer: faculty1._id,
        capacity: 120,
        registrationDeadline: new Date(Date.now() + 12 * 60 * 60 * 1000),
        qrSecret: 'microservices_secret',
      },
      {
        title: 'Robotics Club Quadcopter Drone Demo',
        description: 'Autonomous waypoint flight testing and computer vision target tracking demonstration.',
        category: 'club',
        venue: 'Main Football Ground',
        startAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        endAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
        organizer: faculty2._id,
        capacity: 80,
        registrationDeadline: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
        targetClubs: ['Robotics Club'],
        qrSecret: 'drone_secret',
      },
      {
        title: 'PAST: Orientation and Campus Tour 2026',
        description: 'Welcoming new batch of engineering students and library onboarding.',
        category: 'academic',
        venue: 'Main Campus Auditorium',
        startAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        endAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
        organizer: faculty1._id,
        capacity: 300,
        registrationDeadline: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
        qrSecret: 'past_orientation_secret',
      },
    ];

    await Event.insertMany(otherEvents);
    console.log('[Seed] 8 Events seeded (including test event with capacity 2 and active waitlist).');

    // 10. NOTIFICATIONS
    const sampleNotifications = [
      {
        user: students[0]._id,
        title: 'Welcome to Smart Campus Solutions',
        message: 'Your student account is active. Explore room availability, attendance QR, and campus events.',
        type: 'system',
        link: '/dashboard',
      },
      {
        user: students[1]._id,
        title: 'Low Attendance Warning (< 75%)',
        message: 'Your attendance in Data Structures & Algorithms is 66%. Please ensure attendance in upcoming classes.',
        type: 'attendance',
        link: '/m3/student/my-attendance',
      },
      {
        user: students[2]._id,
        title: 'Waitlist Notice: Algorithmic Coding Challenge',
        message: 'You are on the priority waitlist. If a registered attendee cancels, your seat will be automatically confirmed!',
        type: 'event',
        link: `/m5/events/${testEventCapacity2._id}`,
      },
      {
        user: admin._id,
        title: '🚨 SLA Escalation Alert: CMP-2026-0001',
        message: 'Ticket CMP-2026-0001 (Server rack UPS in CS-LAB-1) breached critical 4h SLA.',
        type: 'complaint',
        link: '/m4/manager',
      },
      {
        user: faculty1._id,
        title: 'Room Booking Approved: SEM-301',
        message: 'Your room reservation for SEM-301 today (16:30 - 18:00) has been approved by the Administration.',
        type: 'room',
        link: '/m1/bookings',
      },
    ];

    await Notification.insertMany(sampleNotifications);
    console.log('[Seed] Sample notifications seeded.');

    await AuditLog.insertMany([
      {
        actor: faculty1._id,
        action: 'ATTENDANCE_SESSION_CREATED',
        entity: 'AttendanceSession',
        entityId: pastSessions[0]._id,
        meta: { subject: pastSessions[0].subject, department: pastSessions[0].department },
        ip: '127.0.0.1',
      },
      {
        actor: admin._id,
        action: 'CLAIM_APPROVED',
        entity: 'Claim',
        entityId: seededClaims[1]._id,
        meta: { item: seededLf[5].title, claimant: 'Emma Watson' },
        ip: '127.0.0.1',
      },
      {
        actor: admin._id,
        action: 'COMPLAINT_ASSIGNED',
        entity: 'Complaint',
        entityId: seededComplaints.find((complaint) => complaint.ticketId === 'CMP-2026-0013')._id,
        meta: { ticketId: 'CMP-2026-0013', assignedTo: 'Campus Maintenance Desk' },
        ip: '127.0.0.1',
      },
    ]);
    console.log('[Seed] Sample audit log entries seeded.');

    // Print all demo credentials clearly
    console.log('\n============================================================');
    console.log('🎉 SMART CAMPUS SOLUTIONS: DATABASE SEEDING COMPLETED!');
    console.log('============================================================');
    console.log('Password for ALL seeded accounts: Campus@123\n');
    console.log('Demo Accounts by Role:');
    console.log('  [ADMIN]       : admin@campus.edu');
    console.log('  [FACULTY 1]   : sandeepkini@canaraengineering.in (Dr. Sandeep Kini - HOD ISE)');
    console.log('  [FACULTY 2]   : pradeepm@canaraengineering.in   (Prof. Pradeep M)');
    console.log('  [FACULTY 3]   : geetha.laxmi@canaraengineering.in (Prof. Geetha Laxmi)');
    console.log('  [FACULTY 4]   : yashaswini@canaraengineering.in (Prof. Yashaswini)');
    console.log('  [STUDENTS]    : 15 ISE Students:');
    studentData.forEach((st) => {
      console.log(`    - ${st.name.padEnd(20)}: ${st.email} (Roll: ${st.rollNo})`);
    });
    console.log('  [SECURITY]    : security@campus.edu  (Gate Scanner & Visitor Passes)');
    console.log('  [MAINTENANCE1]: maintenance1@campus.edu (Dave Electricals - Assigned CMP-2026-0001)');
    console.log('  [MAINTENANCE2]: maintenance2@campus.edu (Frank Plumber - Assigned CMP-2026-0002)');
    console.log('============================================================\n');

    process.exit(0);
  } catch (err) {
    console.error('[Seed Error]:', err);
    process.exit(1);
  }
};

seedDatabase();
