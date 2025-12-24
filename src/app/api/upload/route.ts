import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/admin';

export async function POST(req: NextRequest) {
  console.log("--- Starting Upload Debug Trace ---");
  
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ message: "No file in request" }, { status: 400 });
    }

    // 1. Get Admin Instances
    const { storage } = await getFirebaseAdmin();
    const bucket = storage.bucket();

    // 2. FORCE AUTH CHECK (This is where we catch the 500)
    try {
      console.log("Attempting to verify bucket access...");
      await bucket.exists(); 
      console.log("Bucket access verified!");
    } catch (authError: any) {
      // THIS LOG IN YOUR TERMINAL WILL TELL US THE TRUTH
      console.error("DETAILED_GOOGLE_AUTH_ERROR:", {
        message: authError.message,
        code: authError.code,
        stack: authError.stack
      });

      return NextResponse.json({ 
        message: `Google Authentication Failed: ${authError.message}. Check server logs for details.` 
      }, { status: 401 });
    }

    // 3. Proceed with Upload if Auth passed
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileRef = bucket.file(`uploads/${Date.now()}_${file.name}`);

    await fileRef.save(buffer, {
      metadata: { contentType: file.type }
    });

    await fileRef.makePublic();
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileRef.name}`;

    return NextResponse.json({ url: publicUrl, name: file.name });

  } catch (error: any) {
    console.error("GENERAL_API_ERROR:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
