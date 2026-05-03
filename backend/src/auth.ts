import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRATION = '7d';

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(userId: number, username: string, isAdmin: boolean): string {
  return jwt.sign(
    { userId, username, isAdmin },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRATION }
  );
}

export function verifyToken(token: string): { userId: number; username: string; isAdmin: boolean } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: number;
      username: string;
      isAdmin: boolean;
    };
    return decoded;
  } catch {
    return null;
  }
}

export function getTokenFromRequest(req: any): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.slice(7);
}
