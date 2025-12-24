
import {
  addDoc,
  collection,
  doc,
  documentId,
  Firestore,
  query,
  setDoc,
  where,
} from 'firebase/firestore';
import { type Media } from './types';
import { locations, events, products, countryGroups } from '@/lib/data';

// =================================================================================================
// Users
// =================================================================================================
export const getUsersCollectionRef = (db: Firestore) =>
  collection(db, 'users');
export const getUserDocRef = (db: Firestore, userId: string) =>
  doc(db, 'users', userId);
export const getUserByUsernameQuery = (db: Firestore, username: string) =>
    query(getUsersCollectionRef(db), where('username', '==', username));
export const getFollowerDocRef = (db: Firestore, targetUserId: string, currentUserId: string) =>
    doc(db, 'users', targetUserId, 'followers', currentUserId);


// =================================================================================================
// Locations
// =================================================================================================
export const getLocationsCollectionRef = (db: Firestore) =>
  collection(db, 'locations');
export const getLocationDocRef = (db: Firestore, locationId: string) =>
  doc(db, 'locations', locationId);
export const getLocationsByUserQuery = (db: Firestore, userId: string) => 
  query(getLocationsCollectionRef(db), where('user.id', '==', userId));
export const getLocationsByIdsQuery = (db: Firestore, ids: string[]) =>
  query(getLocationsCollectionRef(db), where(documentId(), 'in', ids));

// =================================================================================================
// Events
// =================================================================================================
export const getEventsCollectionRef = (db: Firestore) =>
  collection(db, 'events');
export const getEventDocRef = (db: Firestore, eventId: string) =>
  doc(db, 'events', eventId);
export const getEventsByIdsQuery = (db: Firestore, ids: string[]) =>
  query(getEventsCollectionRef(db), where(documentId(), 'in', ids));

// =================================================================================================
// Reviews
// =================================================================================================
export const getReviewsCollectionRef = (db: Firestore) =>
  collection(db, 'reviews');
export const getReviewDocRef = (db: Firestore, reviewId: string) =>
  doc(db, 'reviews', reviewId);


// =================================================================================================
// Products
// =================================================================================================
export const getProductsCollectionRef = (db: Firestore) =>
  collection(db, 'products');
export const getProductDocRef = (db: Firestore, productId: string) =>
  doc(db, 'products', productId);
export const addProduct = (db: Firestore, product: any) =>
    addDoc(getProductsCollectionRef(db), product);

// =================================================================================================
// Country Groups
// =================================================================================================
export const getCountryGroupsCollectionRef = (db: Firestore) =>
  collection(db, 'countryGroups');
export const getCountryGroupDocRef = (db: Firestore, countryGroupId: string) =>
  doc(db, 'countryGroups', countryGroupId);
export const addCountryGroup = (db: Firestore, id: string, group: any) => {
    const groupRef = doc(db, 'countryGroups', id);
    return setDoc(groupRef, group, { merge: true });
}

// =================================================================================================
// Deletion Requests
// =================================================================================================
export const getDeletionRequestsCollectionRef = (db: Firestore) =>
  collection(db, 'deletionRequests');
export const getDeletionRequestDocRef = (db: Firestore, requestId: string) =>
    doc(db, 'deletionRequests', requestId);


// =================================================================================================
// Firebase Storage
// =================================================================================================

// This is the primary client-side upload function.
// It sends the file to our Next.js API route for secure processing.
export async function uploadMedia(file: File): Promise<Media> {
  // Validate that 'file' is actually a File object before proceeding
  if (!(file instanceof File)) {
    console.error("The object passed to uploadMedia is not a File:", file);
    throw new Error("Invalid file object provided.");
  }

  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/upload', {
    method: 'POST',
    // Do NOT set Content-Type header manually; 
    // the browser will set it correctly with the boundary string.
    body: formData,
  });

  if (!response.ok) {
    const errorResult = await response.json().catch(() => ({ message: 'Upload failed with an unknown error.' }));
    throw new Error(errorResult.message);
  }

  const result = await response.json();
  const mediaType = file.type.startsWith('video') ? 'video' : 'image';
    
  const mediaObject: Media = {
      url: result.url,
      type: mediaType,
      hint: result.name,
  };

  if (mediaType === 'video') {
      // In a real app, you'd generate a thumbnail. For now, a placeholder.
      mediaObject.thumbnailUrl = 'https://placehold.co/600x400/000000/FFFFFF/png?text=Video';
  }

  return mediaObject;
}


// A convenience wrapper for uploadMedia, specifically for cases where only the URL is needed.
export async function uploadImage(file: File): Promise<string> {
  const media = await uploadMedia(file);
  return media.url;
}


// =================================================================================================
// Data Seeding
// =================================================================================================

const seedCollection = async (db: Firestore, collectionName: string, data: any[]) => {
    const collectionRef = collection(db, collectionName);
    for (const item of data) {
        if (!item.id) continue;
        const docRef = doc(collectionRef, item.id);
        await setDoc(docRef, item);
    }
    console.log(`Seeded ${collectionName} collection.`);
};

export const seedDatabase = async (db: Firestore) => {
    console.log('Seeding database...');
    await seedCollection(db, 'locations', locations);
    await seedCollection(db, 'events', events);
    await seedCollection(db, 'products', products);
    await seedCollection(db, 'countryGroups', countryGroups);
    console.log('Database seeding complete.');
};
