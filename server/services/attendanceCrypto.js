import crypto from 'crypto';

// Dynamic QR Token calculation (Algorithm D)
export const generateQRToken = (qrSecret, sessionId, refreshSeconds = 20, timeOffsetWindows = 0) => {
  const currentWindow = Math.floor(Date.now() / 1000 / refreshSeconds) + timeOffsetWindows;
  const payload = `${sessionId}:${currentWindow}`;
  return crypto
    .createHmac('sha256', qrSecret)
    .update(payload)
    .digest('hex')
    .substring(0, 16);
};

// Verify dynamic QR token: accepts current or previous window only
export const verifyQRToken = (qrSecret, sessionId, tokenToVerify, refreshSeconds = 20) => {
  const currentToken = generateQRToken(qrSecret, sessionId, refreshSeconds, 0);
  const previousToken = generateQRToken(qrSecret, sessionId, refreshSeconds, -1);

  return tokenToVerify === currentToken || tokenToVerify === previousToken;
};

// Haversine formula to measure distance in meters between two lat/lng coordinates
export const calculateHaversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth radius in meters
  const toRad = (deg) => (deg * Math.PI) / 180;

  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δφ = toRad(lat2 - lat1);
  const Δλ = toRad(lon2 - lon1);

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

// Generate 10-char uppercase alphanumeric passCode for visitors
export const generateVisitorPassCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 10; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};
