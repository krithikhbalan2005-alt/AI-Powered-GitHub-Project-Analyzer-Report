import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { db } from '../services/firebase/firebase';
import admin from 'firebase-admin';

/**
 * Fetch user profile from Firestore database.
 * If user profile doc does not exist, automatically initialize it.
 */
export async function getProfile(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized',
      code: 'auth/unauthorized',
    });
  }

  const { uid, email, name } = req.user;

  try {
    const userRef = db.collection('users').doc(uid);
    const doc = await userRef.get();

    if (!doc.exists) {
      // First-time user signin, initialize default profile
      const newProfile = {
        uid,
        name: name || email?.split('@')[0] || 'Developer',
        email: email || '',
        photoURL: null,
        role: 'user', // default role
        totalAnalyses: 0,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      await userRef.set(newProfile);

      return res.status(200).json({
        success: true,
        message: 'Profile initialized successfully',
        data: newProfile,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Profile retrieved successfully',
      data: doc.data(),
    });

  } catch (error: any) {
    console.error('Failed to get user profile:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving user profile information',
      code: 'profile/fetch-failed',
    });
  }
}

/**
 * Update user profile parameters (excluding roles)
 */
export async function updateProfile(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized',
      code: 'auth/unauthorized',
    });
  }

  const { uid } = req.user;
  const { name, photoURL } = req.body;

  try {
    const userRef = db.collection('users').doc(uid);
    const doc = await userRef.get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Profile details not found',
        code: 'profile/not-found',
      });
    }

    const updates: Record<string, any> = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (name !== undefined) updates.name = name;
    if (photoURL !== undefined) updates.photoURL = photoURL;

    await userRef.update(updates);

    // Retrieve updated profile
    const updatedDoc = await userRef.get();

    return res.status(200).json({
      success: true,
      message: 'Profile details updated successfully',
      data: updatedDoc.data(),
    });

  } catch (error: any) {
    console.error('Failed to update profile:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error editing profile information',
      code: 'profile/update-failed',
    });
  }
}
