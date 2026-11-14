import multer from 'multer';
import path from 'path';
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
 * Persist a single multer file buffer to MongoDB
 * @param {Object} file - req.file from multer memoryStorage
 * @param {string|ObjectId} userId - optional user reference
 * @returns {Promise<string>} - '/api/files/:id' endpoint URL
 */
export const saveFileToDB = async (file, userId = null) => {
  if (!file || !file.buffer) return '';
  const fileDoc = await File.create({
    filename: file.originalname || `upload-${Date.now()}.jpg`,
    contentType: file.mimetype || 'image/jpeg',
    size: file.size || file.buffer.length,
    data: file.buffer,
    uploadedBy: userId,
  });
  return `/api/files/${fileDoc._id}`;
};

/**
 * Persist an array of multer file buffers to MongoDB
 * @param {Array} files - req.files from multer memoryStorage
 * @param {string|ObjectId} userId - optional user reference
 * @returns {Promise<string[]>} - array of '/api/files/:id' endpoint URLs
 */
export const saveFilesToDB = async (files = [], userId = null) => {
  if (!files || !files.length) return [];
  const urls = [];
  for (const f of files) {
    const url = await saveFileToDB(f, userId);
    if (url) urls.push(url);
  }
  return urls;
};
