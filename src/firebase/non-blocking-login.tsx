
'use client';
import {
  Auth,
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile,
  User,
} from 'firebase/auth';
import { doc, getDoc, setDoc, getDocs, collection, query, where } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import { findImage } from '@/lib/placeholder-images';

/**
 * Creates or updates a user document in Firestore.
 * This is called for both social and email/password sign-ins.
 * If the user document doesn't exist, it creates a basic one,
 * leaving the 'username' field empty to be filled in during onboarding.
 * @param user The Firebase Auth user object.
 */
const upsertUserInFirestore = async (user: User) => {
  if (!user) return;
  const db = getFirestore(user.app);
  const userRef = doc(db, 'users', user.uid);
  
  const docSnap = await getDoc(userRef);

  if (docSnap.exists()) {
    // Document exists, user is just logging in. No action needed here.
    return;
  }

  // Document doesn't exist. This is a first-time sign-up.
  // Create a profile without a username. The profile page will force setup.
  const avatarUrl = user.photoURL || findImage('user-avatar-main')?.imageUrl || 'https://picsum.photos/seed/avatar/200';
  
  await setDoc(userRef, {
    id: user.uid,
    name: user.displayName || 'New User',
    email: user.email,
    // username is intentionally left undefined here
    avatar: {
      imageUrl: avatarUrl,
      imageHint: 'user avatar'
    },
    followers: 0,
    following: 0,
  });
};


/** Initiate anonymous sign-in (non-blocking). */
export function initiateAnonymousSignIn(authInstance: Auth): void {
  signInAnonymously(authInstance);
}

/** Initiate email/password sign-up (non-blocking). */
export const initiateEmailSignUp = async (authInstance: Auth, email: string, password: string, name: string): Promise<void> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(authInstance, email, password);
    // Set the display name for the new user
    await updateProfile(userCredential.user, { displayName: name });
    // Create the initial user document in Firestore
    await upsertUserInFirestore(userCredential.user);
  } catch (error) {
    console.error("Error during email sign up:", error);
    throw error;
  }
};

/** Initiate email/password sign-in (non-blocking). */
export const initiateEmailSignIn = async (authInstance: Auth, email: string, password: string): Promise<void> => {
   try {
    // Just sign in. The upsert logic will handle existing users.
    await signInWithEmailAndPassword(authInstance, email, password);
  } catch (error) {
    console.error("Error during email sign in:", error);
    throw error;
  }
};

/** Initiate Google sign-in via popup. */
export const initiateGoogleSignIn = async (authInstance: Auth): Promise<void> => {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(authInstance, provider);
    await upsertUserInFirestore(result.user);
  } catch (error) {
    console.error("Error during Google sign-in:", error);
    throw error;
  }
};

/**
 * Checks if a username already exists in the 'users' collection.
 * @param username The username to check.
 * @returns {Promise<boolean>} True if the username exists, false otherwise.
 */
export const checkUsernameExists = async (db: any, username: string): Promise<boolean> => {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('username', '==', username));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
};
