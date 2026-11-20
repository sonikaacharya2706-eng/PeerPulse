import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure .env is loaded from server/.env regardless of process CWD
dotenv.config();
if (!process.env.JWT_SECRET) {
  dotenv.config({ path: path.resolve(__dirname, '../.env') });
}
if (!process.env.JWT_SECRET) {
  dotenv.config({ path: path.resolve(__dirname, '../../.env') });
}

if (!process.env.JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET environment variable is missing.');
}

export const generateToken = (id, role) => {
  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES || '1d',
    }
  );
};

export const verifyToken = (token) => {
  return jwt.verify(
    token,
    process.env.JWT_SECRET
  );
};
