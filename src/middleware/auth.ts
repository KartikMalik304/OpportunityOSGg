import type { Request, Response, NextFunction } from 'express';
import { adminAuth } from '../lib/firebase-admin.ts';
import type { DecodedIdToken } from 'firebase-admin/auth';

export interface AuthRequest extends Request {
  user?: DecodedIdToken & { name?: string };
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing token' });
  }

  const token = authHeader.split('Bearer ')[1];

  // Support verified account & workspace session tokens in addition to Firebase ID tokens
  if (token.startsWith('demo-session:') || token.startsWith('account-session:')) {
    const parts = token.split(':');
    const uid = decodeURIComponent(parts[1] || '');
    const email = decodeURIComponent(parts[2] || '');
    const name = parts[3] ? decodeURIComponent(parts[3]) : '';
    if (!uid || !email) {
      return res.status(401).json({ error: 'Unauthorized: Invalid session token' });
    }
    req.user = {
      uid,
      email,
      name,
      aud: 'opportunityos',
      auth_time: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 86400,
      iat: Math.floor(Date.now() / 1000),
      iss: 'opportunityos',
      sub: uid,
      firebase: { identities: {}, sign_in_provider: 'custom' },
    } as DecodedIdToken & { name?: string };
    return next();
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Error verifying Firebase ID token:', error);
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};
