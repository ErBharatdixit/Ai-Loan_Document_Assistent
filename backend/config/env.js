import dotenv from 'dotenv';
dotenv.config();

// All environment variables in one place
export const PORT       = process.env.PORT       || 5000;
export const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_123';
