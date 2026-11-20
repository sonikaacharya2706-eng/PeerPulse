import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import File from '../models/File.js';

// Use memory storage so files are held in buffer and saved directly to MongoDB
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp|gif/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files (jpg, jpeg, png, webp, gif) are allowed'));
  }
};

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit per file
  fileFilter,
});

/**
 * Generate an HMAC-SHA256 signed URL for a file
 * @param {string|ObjectId} fileId
 * @param {number} expiresInSeconds (default 7 days)
 * @returns {string} - '/api/files/:id?exp=:exp&sig=:sig'
 */
export const generateSignedFileUrl = (fileId, expiresInSeconds = 7 * 24 * 3600) => {
  const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const secret = process.env.JWT_SECRET;
  const sig = crypto
    .createHmac('sha256', secret)
    .update(`${fileId}:${exp}`)
    .digest('hex');
  return `/api/files/${fileId}?exp=${exp}&sig=${sig}`;
};

/**
 * Persist a single multer file buffer to MongoDB
 * @param {Object} file - req.file from multer memoryStorage
 * @param {string|ObjectId} userId - optional user reference
 * @param {string} fileType - categorization ('general', 'complaint', 'claim', etc.)
 * @returns {Promise<string>} - signed '/api/files/:id?exp=...&sig=...' endpoint URL
 */
export const saveFileToDB = async (file, userId = null, fileType = 'general') => {
  if (!file || !file.buffer) return '';
  const fileDoc = await File.create({
    filename: file.originalname || `upload-${Date.now()}.jpg`,
    contentType: file.mimetype || 'image/jpeg',
    size: file.size || file.buffer.length,
    data: file.buffer,
    uploadedBy: userId,
    fileType,
  });
  return generateSignedFileUrl(fileDoc._id);
};

/**
 * Persist an array of multer file buffers to MongoDB
 * @param {Array} files - req.files from multer memoryStorage
 * @param {string|ObjectId} userId - optional user reference
 * @param {string} fileType - categorization ('general', 'complaint', 'claim', etc.)
 * @returns {Promise<string[]>} - array of signed '/api/files/:id?exp=...&sig=...' endpoint URLs
 */
export const saveFilesToDB = async (files = [], userId = null, fileType = 'general') => {
  if (!files || !files.length) return [];
  const urls = [];
  for (const f of files) {
    const url = await saveFileToDB(f, userId, fileType);
    if (url) urls.push(url);
  }
  return urls;
};
