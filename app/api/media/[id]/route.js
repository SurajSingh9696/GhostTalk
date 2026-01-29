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

    // Return the file
    return new NextResponse(media.data, {
      headers: {
        'Content-Type': media.mimeType,
        'Content-Disposition': `attachment; filename="${media.originalName}"`,
        'Content-Length': media.data.length.toString(),
      },
    });
  } catch (error) {
    console.error('Media download error:', error);
    return NextResponse.json(
      { error: 'Failed to download media' },
      { status: 500 }
    );
  }
}
