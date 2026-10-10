import crypto from 'crypto';
import type { Request, Response, NextFunction } from 'express';

const JWT_SECRET = process.env.ADMIN_SESSION_SECRET || 'pabna-bus-guide-secret-key-2026-auth-session';

export function hashPassword(password: string, existingSalt?: string) {
  const salt = existingSalt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return { hash, salt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const calculated = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return crypto.timingSafeEqual(Buffer.from(calculated), Buffer.from(hash));
}

export interface SessionPayload {
  userId: string;
  username: string;
  role: string;
  exp: number;
}

export function createSessionToken(userId: string, username: string, role: string): string {
  const payload: SessionPayload = {
    userId,
    username,
    role,
    exp: Date.now() + 1000 * 60 * 60 * 24 * 7 // 7 days
  };
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(data).digest('base64url');
  return `${data}.${signature}`;
}

export function verifySessionToken(token: string): SessionPayload | null {
  if (!token || !token.includes('.')) return null;
  const [data, signature] = token.split('.');
  const expectedSig = crypto.createHmac('sha256', JWT_SECRET).update(data).digest('base64url');
  
  if (signature !== expectedSig) return null;
  
  try {
    const payload: SessionPayload = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
    if (Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

export interface AuthenticatedRequest extends Request {
  user?: SessionPayload;
}

export function requireAdminAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const cookieToken = req.cookies?.admin_session;
  let token = '';

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (cookieToken) {
    token = cookieToken;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message_bn: 'অননুমোদিত অ্যাক্সেস। অনুগ্রহ করে প্রথমে লগইন করুন।',
      message: 'Unauthorized. Please login first.'
    });
  }

  const payload = verifySessionToken(token);
  if (!payload) {
    return res.status(401).json({
      success: false,
      message_bn: 'সেশন অকার্যকর বা মেয়াদোত্তীর্ণ হয়েছে। পুনরায় লগইন করুন।',
      message: 'Session invalid or expired. Please login again.'
    });
  }

  req.user = payload;
  next();
}
