import jwt from 'jsonwebtoken';

export const generateToken = (id, role) => {
  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET || 'supersecret_smartcampus_jwt_key_2026_change_in_production',
    {
      expiresIn: process.env.JWT_EXPIRES || '1d',
    }
  );
};

export const verifyToken = (token) => {
  return jwt.verify(
    token,
    process.env.JWT_SECRET || 'supersecret_smartcampus_jwt_key_2026_change_in_production'
  );
};
