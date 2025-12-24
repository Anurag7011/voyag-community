
'use server';
/**
 * @fileOverview A server-side helper to handle file uploads to Firebase Storage
 * using the Firebase Admin SDK.
 */

import { getFirebaseAdmin } from '@/lib/admin';

export async function uploadMedia(fileBuffer: Buffer, fileName: string, contentType: string) {
  try {
    // 1. Get the admin instances (now includes storage)
    const { storage } = await getFirebaseAdmin(); 
    
    if (!storage) {
      throw new Error("Firebase Storage service is not initialized on the server.");
    }

    const bucket = storage.bucket();
    // 2. Create a unique path for the file to avoid overwrites
    const filePath = `${contentType.split('/')[0] || 'uploads'}/${Date.now()}_${fileName}`;
    const fileRef = bucket.file(filePath);

    // 3. Save the Buffer to the bucket
    await fileRef.save(fileBuffer, {
      metadata: { 
        contentType: contentType,
        cacheControl: 'public, max-age=31536000', // Cache for 1 year
      },
    });

    // 4. Generate the Public URL (make sure your bucket rules allow public reads)
    await fileRef.makePublic();
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileRef.name}`;

    return {
      url: publicUrl,
      type: contentType,
      name: fileName
    };
  } catch (error: any) {
    console.error("CRITICAL_UPLOAD_ERROR:", error);
    throw new Error(`Server failed to process upload: ${error.message}`);
  }
}
