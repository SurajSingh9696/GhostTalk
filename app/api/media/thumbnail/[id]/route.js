import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import Media from '@/lib/models/Media';
import { getSession } from '@/lib/middleware/auth';

export async function GET(request, { params }) {
  try {
    await dbConnect();

    const { id } = await params;

    // Verify session
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Find media
    const media = await Media.findById(id);
    if (!media) {
      return NextResponse.json(
        { error: 'Media not found' },
        { status: 404 }
      );
    }

    // Return thumbnail or blurred preview
    const previewData = media.thumbnail || media.data;
    
    return new NextResponse(previewData, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000',
      },
    });
  } catch (error) {
    console.error('Thumbnail fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch thumbnail' },
      { status: 500 }
    );
  }
}
