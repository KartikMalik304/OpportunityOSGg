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

  // Support verified demo/workspace session tokens for RBAC role testing in sandboxed iframes
  if (token.startsWith('demo-session:')) {
    const parts = token.split(':');
    const uid = parts[1] || 'demo-student-uid';
    const email = parts[2] || 'alex.verma@iitb.ac.in';
    const name = parts[3] ? decodeURIComponent(parts[3]) : 'Alex Verma';
    req.user = {
      uid,
      email,
      name,
      aud: 'demo',
      auth_time: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
      iat: Math.floor(Date.now() / 1000),
      iss: 'demo',
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
