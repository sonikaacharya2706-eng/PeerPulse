import { describe, it, expect, vi, afterEach } from 'vitest';
import request from 'supertest';
import { generateQRToken, verifyQRToken, calculateHaversineDistance } from '../services/attendanceCrypto.js';
import { isClashing } from '../controllers/timetableController.js';
import { calculateSlaDueAt } from '../services/slaCron.js';
import { calculateMatchScore } from '../services/matchingService.js';
import { getDashboardSummary, sortUpcomingClasses } from '../controllers/dashboardController.js';
import connectDB from '../config/db.js';
import { app } from '../server.js';
import User from '../models/User.js';
import Classroom from '../models/Classroom.js';
import Timetable from '../models/Timetable.js';
import LostFoundItem from '../models/LostFoundItem.js';
import Complaint from '../models/Complaint.js';
import Event from '../models/Event.js';
import EventRegistration from '../models/EventRegistration.js';

const createMockQuery = (result) => {
  const query = {
    populate: () => query,
    sort: () => query,
    limit: () => query,
    then: (resolve, reject) => Promise.resolve(result).then(resolve, reject),
  };
  return query;
};

describe('Database startup configuration', () => {
  it('fails clearly when MONGO_URI is missing in production', async () => {
    const originalNodeEnv = process.env.NODE_ENV;
    const originalMongoUri = process.env.MONGO_URI;
    process.env.NODE_ENV = 'production';
    delete process.env.MONGO_URI;

    try {
      await expect(connectDB()).rejects.toThrow('MONGO_URI environment variable is missing');
    } finally {
      if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
      else process.env.NODE_ENV = originalNodeEnv;

      if (originalMongoUri === undefined) delete process.env.MONGO_URI;
      else process.env.MONGO_URI = originalMongoUri;
    }
  });
});

describe('CORS configuration', () => {
  it('allows requests from the same origin as the server', async () => {
    const response = await request(app)
      .get('/api/health')
      .set('Host', 'peerpulse.test')
      .set('Origin', 'http://peerpulse.test');

    expect(response.status).toBe(200);
    expect(response.headers['access-control-allow-origin']).toBe('http://peerpulse.test');
  });

  it('continues to reject unconfigured cross-origin requests', async () => {
    const response = await request(app)
      .get('/api/health')
      .set('Host', 'peerpulse.test')
      .set('Origin', 'https://untrusted.example');

    expect(response.status).toBe(500);
    expect(response.body.message).toContain('not allowed by CORS policy');
  });
});

describe('Dashboard upcoming class ordering', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('orders the next scheduled classes from the current day across the week boundary', () => {
    const classes = [
      { dayOfWeek: 5, startTime: '11:00' },
      { dayOfWeek: 1, startTime: '10:00' },
      { dayOfWeek: 1, startTime: '09:00' },
    ];

    expect(sortUpcomingClasses(classes, 6)).toEqual([
      { dayOfWeek: 1, startTime: '09:00' },
      { dayOfWeek: 1, startTime: '10:00' },
      { dayOfWeek: 5, startTime: '11:00' },
    ]);
  });

  it('returns upcoming classes for students when there are no classes today', async () => {
    const nextClass = {
      _id: 'class-1',
      dayOfWeek: 1,
      startTime: '09:00',
      subject: 'Data Structures',
    };

    vi.spyOn(Classroom, 'countDocuments').mockResolvedValue(1);
    vi.spyOn(Event, 'countDocuments').mockResolvedValue(1);
    vi.spyOn(LostFoundItem, 'countDocuments').mockResolvedValue(0);
    vi.spyOn(Timetable, 'find').mockImplementation((filter) =>
      createMockQuery(filter.dayOfWeek === undefined ? [nextClass] : [])
    );
    vi.spyOn(Complaint, 'find').mockImplementation(() => createMockQuery([]));
    vi.spyOn(EventRegistration, 'find').mockImplementation(() => createMockQuery([]));

    const json = vi.fn();
    await getDashboardSummary(
      { user: { role: 'student', _id: 'student-1', department: 'ISE', year: 2 } },
      { json },
      vi.fn()
    );

    const summary = json.mock.calls[0][0].data;
    expect(summary.stats.todayClassesCount).toBe(0);
    expect(summary.todayClasses).toEqual([]);
    expect(summary.upcomingClasses).toEqual([nextClass]);
  });
});

describe('Algorithm D: Dynamic QR Attendance Token Verification', () => {
  const secret = 'test_qr_secret_key_123';
  const sessionId = 'session_mock_id_456';
  const refreshSeconds = 20;

  it('accepts valid token from the current time window (offset 0)', () => {
    const currentToken = generateQRToken(secret, sessionId, refreshSeconds, 0);
    expect(verifyQRToken(secret, sessionId, currentToken, refreshSeconds)).toBe(true);
  });

  it('accepts valid token from the immediately preceding window (offset -1)', () => {
    const previousToken = generateQRToken(secret, sessionId, refreshSeconds, -1);
    expect(verifyQRToken(secret, sessionId, previousToken, refreshSeconds)).toBe(true);
  });

  it('rejects stale token from 2 windows ago (offset -2)', () => {
    const staleToken = generateQRToken(secret, sessionId, refreshSeconds, -2);
    expect(verifyQRToken(secret, sessionId, staleToken, refreshSeconds)).toBe(false);
  });

  it('rejects future token (offset +1)', () => {
    const futureToken = generateQRToken(secret, sessionId, refreshSeconds, 1);
    expect(verifyQRToken(secret, sessionId, futureToken, refreshSeconds)).toBe(false);
  });

  it('rejects token generated with a different secret or session ID', () => {
    const wrongSecretToken = generateQRToken('wrong_secret', sessionId, refreshSeconds, 0);
    expect(verifyQRToken(secret, sessionId, wrongSecretToken, refreshSeconds)).toBe(false);

    const wrongSessionToken = generateQRToken(secret, 'other_session', refreshSeconds, 0);
    expect(verifyQRToken(secret, sessionId, wrongSessionToken, refreshSeconds)).toBe(false);
  });
});

describe('Geofence Distance Calculation: Haversine Formula', () => {
  it('returns 0 meters for identical coordinates', () => {
    const lat = 12.9715987;
    const lng = 77.5945627;
    expect(calculateHaversineDistance(lat, lng, lat, lng)).toBeCloseTo(0, 1);
  });

  it('correctly calculates distance within classroom geofence (~25-35 meters)', () => {
    const latA = 12.9716;
    const lonA = 77.5946;
    const latB = 12.9718;
    const lonB = 77.5947;
    const distance = calculateHaversineDistance(latA, lonA, latB, lonB);
    expect(distance).toBeGreaterThan(20);
    expect(distance).toBeLessThan(40);
  });

  it('identifies coordinates far outside classroom radius (> 1 km)', () => {
    const campusLat = 12.9716;
    const campusLng = 77.5946;
    const hostelLat = 12.9850;
    const hostelLng = 77.6050;
    const distance = calculateHaversineDistance(campusLat, campusLng, hostelLat, hostelLng);
    expect(distance).toBeGreaterThan(1500);
  });
});

describe('Algorithm B: Timetable Clash Detection (isClashing)', () => {
  it('detects partial overlap between two time slots', () => {
    expect(isClashing('09:00', '10:30', '10:00', '11:30')).toBe(true);
    expect(isClashing('10:00', '11:30', '09:00', '10:30')).toBe(true);
  });

  it('detects complete enclosure of one slot within another', () => {
    expect(isClashing('09:00', '13:00', '10:00', '11:00')).toBe(true);
    expect(isClashing('10:00', '11:00', '09:00', '13:00')).toBe(true);
  });

  it('detects identical overlapping slots', () => {
    expect(isClashing('14:00', '15:00', '14:00', '15:00')).toBe(true);
  });

  it('allows contiguous slots without clashing (boundary touch)', () => {
    expect(isClashing('09:00', '10:00', '10:00', '11:00')).toBe(false);
    expect(isClashing('10:00', '11:00', '09:00', '10:00')).toBe(false);
  });

  it('allows disjoint time slots', () => {
    expect(isClashing('08:00', '09:00', '14:00', '15:00')).toBe(false);
  });
});

describe('Maintenance SLA Due Date Calculation (calculateSlaDueAt)', () => {
  const baseTime = new Date('2026-03-01T10:00:00Z');

  it('calculates 4-hour SLA deadline for critical priority', () => {
    const due = calculateSlaDueAt('critical', baseTime);
    const expected = new Date(baseTime.getTime() + 4 * 3600 * 1000);
    expect(due.getTime()).toBe(expected.getTime());
  });

  it('calculates 24-hour SLA deadline for high priority', () => {
    const due = calculateSlaDueAt('high', baseTime);
    const expected = new Date(baseTime.getTime() + 24 * 3600 * 1000);
    expect(due.getTime()).toBe(expected.getTime());
  });

  it('calculates 72-hour SLA deadline for medium priority', () => {
    const due = calculateSlaDueAt('medium', baseTime);
    const expected = new Date(baseTime.getTime() + 72 * 3600 * 1000);
    expect(due.getTime()).toBe(expected.getTime());
  });

  it('calculates 120-hour SLA deadline for low priority', () => {
    const due = calculateSlaDueAt('low', baseTime);
    const expected = new Date(baseTime.getTime() + 120 * 3600 * 1000);
    expect(due.getTime()).toBe(expected.getTime());
  });

  it('defaults to 72 hours for unknown priority', () => {
    const due = calculateSlaDueAt('unspecified', baseTime);
    const expected = new Date(baseTime.getTime() + 72 * 3600 * 1000);
    expect(due.getTime()).toBe(expected.getTime());
  });
});

describe('Algorithm G: Lost-and-Found Match Scoring (calculateMatchScore)', () => {
  it('awards 40 points for matching category', () => {
    const itemA = { category: 'electronics', title: 'Phone', description: 'Blue case', location: 'Library', dateOccurred: new Date() };
    const itemB = { category: 'electronics', title: 'iPhone', description: 'Red screen', location: 'Canteen', dateOccurred: new Date(Date.now() - 30 * 24 * 3600 * 1000) };
    const { score } = calculateMatchScore(itemA, itemB);
    expect(score).toBeGreaterThanOrEqual(40);
  });

  it('scores high (> 80) for items with matching category, keywords, location, and date', () => {
    const now = new Date('2026-03-01T12:00:00Z');
    const lostItem = {
      category: 'electronics',
      title: 'Lost Dell Laptop XPS 15 Silver',
      description: 'Silver Dell laptop with charger inside black backpack',
      location: 'Central Library 2nd Floor',
      dateOccurred: now,
    };
    const foundItem = {
      category: 'electronics',
      title: 'Found Silver Dell XPS Laptop',
      description: 'Found a silver Dell laptop left on 2nd floor desk with charger',
      location: 'Central Library 2nd Floor',
      dateOccurred: now,
    };
    const { score } = calculateMatchScore(lostItem, foundItem);
    expect(score).toBeGreaterThanOrEqual(80);
  });

  it('scores low or 0 for completely unrelated items', () => {
    const itemA = { category: 'books', title: 'Calculus Stewart 8th Ed', description: 'Hardcover math textbook', location: 'LHC Room 101', dateOccurred: new Date('2026-01-01') };
    const itemB = { category: 'clothing', title: 'Black Leather Jacket', description: 'Zara motorcycle jacket size M', location: 'Sports Complex', dateOccurred: new Date('2026-03-01') };
    const { score } = calculateMatchScore(itemA, itemB);
    expect(score).toBeLessThanOrEqual(5);
  });
});

describe('Security: Privilege Escalation Prevention on Registration (Supertest)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('creates user with role: "student" when client supplies role: "admin"', async () => {
    const testEmail = `adversary_${Date.now()}@campus.edu`;
    const fakeId = '65e012345678901234567890';

    vi.spyOn(User, 'findOne').mockResolvedValue(null);
    vi.spyOn(User, 'create').mockImplementation(async (userData) => ({
      ...userData,
      _id: fakeId,
      toObject: () => ({ ...userData, _id: fakeId }),
    }));

    const response = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Malicious Attacker',
        email: testEmail,
        password: 'Password123!',
        role: 'admin', // Adversary attempts privilege escalation
        department: 'ISE',
        year: 2,
        rollNo: `ATT_${Date.now()}`,
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    // Must be strictly student - client role parameter ignored
    expect(response.body.data.user.role).toBe('student');
    expect(response.body.data.user.role).not.toBe('admin');
  });

  it('rejects registration for an existing account without changing it', async () => {
    const existingUser = {
      _id: '65e012345678901234567890',
      email: 'admin@campus.edu',
      name: 'System Administrator',
      password: 'existing-hash',
      role: 'admin',
      matchPassword: vi.fn(),
      save: vi.fn(),
    };
    vi.spyOn(User, 'findOne').mockResolvedValue(existingUser);

    const response = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Attacker',
        email: 'admin@campus.edu',
        password: 'AttackerPassword123!',
        department: 'ISE',
      });

    expect(response.status).toBe(409);
    expect(response.body.success).toBe(false);
    expect(response.body.data).toBeUndefined();
    expect(existingUser.matchPassword).not.toHaveBeenCalled();
    expect(existingUser.save).not.toHaveBeenCalled();
    expect(existingUser.password).toBe('existing-hash');
    expect(existingUser.name).toBe('System Administrator');
  });

  it('does not expose the anonymous set-password endpoint', async () => {
    const response = await request(app)
      .post('/api/auth/set-password')
      .send({ email: 'admin@campus.edu', password: 'AttackerPassword123!' });

    expect(response.status).toBe(404);
  });
});

describe('Google Authentication & Verification (POST /api/auth/google)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('rejects request with missing credential token', async () => {
    const response = await request(app)
      .post('/api/auth/google')
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it('rejects a Google account that differs from the entered email', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        email: 'verified-user@gmail.com',
        email_verified: true,
        name: 'Verified User',
      }),
    });
    const findOneSpy = vi.spyOn(User, 'findOne');

    const response = await request(app)
      .post('/api/auth/google')
      .send({
        credential: 'verified-google-token',
        expectedEmail: 'someone-else@gmail.com',
      });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('does not match the entered email');
    expect(findOneSpy).not.toHaveBeenCalled();
  });

  it('rejects client-supplied email or profile without a valid Google token (privilege escalation prevention)', async () => {
    // Attempting to spoof an admin or faculty account by sending body fields without token
    const response = await request(app)
      .post('/api/auth/google')
      .send({ email: 'admin@campus.edu', profile: { email: 'admin@campus.edu', role: 'admin' } });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it('provisions Canara Faculty account when verified with Google', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        email: 'sandeepkini@canaraengineering.in',
        email_verified: 'true',
        name: 'Dr. Sandeep Kini',
        picture: 'https://example.com/avatar.jpg',
      }),
    });

    vi.spyOn(User, 'findOne').mockResolvedValue(null);
    vi.spyOn(User, 'create').mockImplementation(async (data) => ({
      ...data,
      _id: '65e012345678901234567891',
    }));

    const response = await request(app)
      .post('/api/auth/google')
      .send({ credential: 'valid_mock_google_jwt_token' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.user.role).toBe('faculty');
    expect(response.body.data.user.email).toBe('sandeepkini@canaraengineering.in');
  });

  it('provisions ISE Student account when verified with Google', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        email: 'sonikaacharya2706@gmail.com',
        email_verified: true,
        name: 'Sonika Acharya',
        picture: 'https://example.com/sonika.jpg',
      }),
    });

    vi.spyOn(User, 'findOne').mockResolvedValue(null);
    vi.spyOn(User, 'create').mockImplementation(async (data) => ({
      ...data,
      _id: '65e012345678901234567892',
    }));

    const response = await request(app)
      .post('/api/auth/google')
      .send({ credential: 'valid_mock_google_jwt_student' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.user.role).toBe('student');
    expect(response.body.data.user.email).toBe('sonikaacharya2706@gmail.com');
  });

  it('rejects unverified Google emails when email_verified is false', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        email: 'attacker@example.com',
        email_verified: false,
        name: 'Attacker',
      }),
    });

    const response = await request(app)
      .post('/api/auth/google')
      .send({ credential: 'token_with_unverified_email' });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('email address is not verified');
  });

  it('rejects token when audience does not match configured client ID', async () => {
    const originalClientId = process.env.GOOGLE_CLIENT_ID;
    process.env.GOOGLE_CLIENT_ID = 'expected-smartcampus-client-id.apps.googleusercontent.com';

    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        email: 'student@example.com',
        email_verified: true,
        aud: 'foreign-malicious-app-client-id.apps.googleusercontent.com',
        name: 'Student',
      }),
    });

    const response = await request(app)
      .post('/api/auth/google')
      .send({ credential: 'token_from_different_app' });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('token audience mismatch');

    if (originalClientId) {
      process.env.GOOGLE_CLIENT_ID = originalClientId;
    } else {
      delete process.env.GOOGLE_CLIENT_ID;
    }
  });

  it('rejects invalid Google credentials when Google API returns error', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error_description: 'Invalid Value' }),
    });

    const response = await request(app)
      .post('/api/auth/google')
      .send({ credential: 'invalid_tampered_token' });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('Invalid or expired Google credential token');
  });
});
