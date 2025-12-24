
'use server';

import admin from 'firebase-admin';
import { getApps, getApp, cert } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getStorage, Storage } from 'firebase-admin/storage';


interface AdminSDK {
    auth: Auth;
    db: Firestore;
    storage: Storage;
}

export async function getFirebaseAdmin(): Promise<AdminSDK> {
  if (!admin.apps.length) {
    // 1. Get the raw string
    let rawData = process.env.FIREBASE_SERVICE_ACCOUNT || "";
    
    // 2. AGGRESSIVE CLEANING: Remove ALL newlines, spaces, and quotes
    // This fixes the "Multi-line" issue once and for all.
    const cleanBase64 = rawData.replace(/\s+/g, '').replace(/['"]/g, '');

    try {
      const decodedData = Buffer.from(cleanBase64, 'base64').toString('utf8');
      const sa = JSON.parse(decodedData);

      // 3. Fix the private key (convert literal \n to real newlines)
      const formattedKey = sa.private_key.replace(/\\n/g, '\n');

      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: sa.project_id,
          clientEmail: sa.client_email,
          privateKey: formattedKey,
        }),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      });

      console.log("✅ Firebase Admin authenticated successfully!");
    } catch (error: any) {
      console.error("❌ Auth Error:", error.message);
      throw new Error(`Auth Setup Failed: ${error.message}`);
    }
  }

  return {
    storage: admin.storage(),
    db: admin.firestore(),
    auth: admin.auth(),
  };
}


const OWNER_EMAIL = process.env.NEXT_PUBLIC_APP_OWNER_EMAIL;

async function verifyTokenAndGetUid(idToken: string): Promise<string> {
    if (!idToken) {
      throw new Error('ID token must be provided.');
    }
    const { auth } = await getFirebaseAdmin();
    try {
      const decodedToken = await auth.verifyIdToken(idToken, true);
      return decodedToken.uid;
    } catch (error) {
      console.error('Error verifying ID token:', error);
      throw new Error('Unauthorized.');
    }
}

// Verifies the user's email and sets the owner claim if it matches.
export async function setOwnerClaim(idToken: string) {
    const uid = await verifyTokenAndGetUid(idToken);
    const { auth } = await getFirebaseAdmin();
    const user = await auth.getUser(uid);
  
    if (user.email === OWNER_EMAIL) {
      const currentClaims = user.customClaims || {};
      if (!currentClaims.owner) {
        await auth.setCustomUserClaims(uid, { ...currentClaims, owner: true, admin: true });
        return { message: 'Owner claim set successfully.' };
      }
      return { message: 'Owner claim already exists.' };
    }
    throw new Error('User is not the designated owner.');
}

// Sets or revokes admin role for a target user. Only the owner can do this.
export async function setAdminRole(idToken: string, targetUserId: string, isAdmin: boolean) {
    const requesterUid = await verifyTokenAndGetUid(idToken);
    const { auth, db } = await getFirebaseAdmin();
    const requester = await auth.getUser(requesterUid);

    if (requester.customClaims?.owner !== true) {
        throw new Error('Unauthorized: Only the app owner can perform this action.');
    }

    if (!targetUserId || typeof isAdmin !== 'boolean') {
        throw new Error('Invalid request parameters');
    }
    
    try {
        const targetUser = await auth.getUser(targetUserId);
        if (targetUser.email === OWNER_EMAIL) {
            throw new Error('The app owner role cannot be changed.');
        }
        
        const currentClaims = targetUser.customClaims || {};
        await auth.setCustomUserClaims(targetUserId, { ...currentClaims, admin: isAdmin });

        const userDocRef = db.doc(`users/${targetUserId}`);
        await userDocRef.update({ isAdmin: isAdmin });

        return { message: `Successfully ${isAdmin ? 'set' : 'revoked'} admin role.` };
    } catch (error: any) {
        console.error('Error setting custom claim:', error);
        throw new Error(error.message || 'Failed to set admin role');
    }
}

// Deletes a user account. Only the owner can do this.
export async function deleteUserByAdmin(idToken: string, targetUserId: string) {
    const requesterUid = await verifyTokenAndGetUid(idToken);
    const { auth, db } = await getFirebaseAdmin();
    const requester = await auth.getUser(requesterUid);

    if (requester.customClaims?.owner !== true) {
        throw new Error('Unauthorized: Only the app owner can delete users.');
    }

    if (!targetUserId) {
        throw new Error('Invalid request: targetUserId is required.');
    }
    
    try {
        const targetUser = await auth.getUser(targetUserId);
        if (targetUser.email === OWNER_EMAIL) {
            throw new Error('The app owner account cannot be deleted.');
        }

        await auth.deleteUser(targetUserId);
        
        const userDocRef = db.doc(`users/${targetUserId}`);
        await userDocRef.delete();

        return { message: `Successfully deleted user ${targetUserId}.` };
    } catch (error: any) {
        console.error(`Error deleting user ${targetUserId}:`, error);
        throw new Error(error.message || 'Failed to delete user');
    }
}

// Handles approving or rejecting a content deletion request. Only the owner can do this.
export async function handleDeletionRequest(idToken: string, requestId: string, action: 'approve' | 'reject') {
    const requesterUid = await verifyTokenAndGetUid(idToken);
    const { auth, db } = await getFirebaseAdmin();
    const requester = await auth.getUser(requesterUid);

    if (requester.customClaims?.owner !== true) {
        throw new Error('Unauthorized: Only the app owner can manage deletion requests.');
    }
    
    const requestRef = db.doc(`deletionRequests/${requestId}`);
    const requestDoc = await requestRef.get();

    if (!requestDoc.exists) {
        throw new Error('Deletion request not found.');
    }

    const requestData = requestDoc.data()!;

    if (requestData.status !== 'pending') {
        throw new Error(`This request has already been ${requestData.status}.`);
    }

    if (action === 'approve') {
        const targetRef = db.doc(`${requestData.targetType}s/${requestData.targetId}`);
        await targetRef.delete();
        await requestRef.update({ status: 'approved' });
    } else { // 'reject'
        await requestRef.update({ status: 'rejected' });
    }

    return { message: `Request successfully ${action}d.` };
}
