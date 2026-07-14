import { Request, Response, NextFunction } from 'express';
import { auth, db } from '../services/firebase/firebase';
import { config } from '../config';

export interface AuthenticatedRequest extends Request {
  user?: {
    uid: string;
    email?: string;
    name?: string;
    [key: string]: any;
  };
}

/**
 * Verifies Firebase ID Token and extracts user details
 */
export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: Missing or malformed authentication token',
      code: 'auth/unauthorized',
    });
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    const decodedToken = await auth.verifyIdToken(token);
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name,
    };
    return next();
  } catch (error) {
    console.error('Firebase token verification failed:', error);
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: Invalid authentication token',
      code: 'auth/invalid-token',
    });
  }
}

/**
 * Restricts access to Admin users only
 */
export async function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: Authentication required',
      code: 'auth/unauthorized',
    });
  }

  const { uid } = req.user;

  try {
    // 1. Check if UID is listed in the environment admin list
    if (config.ADMIN_UIDS.includes(uid)) {
      return next();
    }

    // 2. Fallback to check role in Firestore users collection
    const userDoc = await db.collection('users').doc(uid).get();
    const userData = userDoc.data();

    if (userDoc.exists && userData?.role === 'admin') {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Forbidden: Admin access levels required',
      code: 'auth/forbidden',
    });
  } catch (error) {
    console.error('Admin verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error validating user roles',
      code: 'auth/role-validation-failed',
    });
  }
}
