import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAuth } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    // Check user is logged in
    await requireAuth(request);

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only images allowed.' },
        { status: 400 }
      );
    }

    // Validate size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large (max 5MB).' },
        { status: 400 }
      );
    }

    // Convert File → Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique filename
    const ext = file.name.split('.').pop() || 'jpg';
    const filename = `${randomUUID()}.${ext}`;

    // Upload to Supabase Storage (bucket: uploads)
    const { data, error } = await supabaseAdmin.storage
      .from('uploads')
      .upload(filename, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Supabase upload error:', error);
      
      // Handle bucket not found error specifically
      const errorMessage = error.message || '';
      if (errorMessage.includes('Bucket not found') || errorMessage.includes('not found')) {
        return NextResponse.json(
          { 
            error: 'Storage bucket not configured. Please create a bucket named "uploads" in Supabase Storage, or configure local file storage.',
            details: 'Bucket "uploads" not found in Supabase Storage'
          },
          { status: 503 } // Service Unavailable - configuration issue
        );
      }
      
      return NextResponse.json(
        { error: 'Upload failed', details: errorMessage },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from('uploads')
      .getPublicUrl(data.path);

    return NextResponse.json({ imageUrl: urlData.publicUrl });
  } catch (error: any) {
    if (error?.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}