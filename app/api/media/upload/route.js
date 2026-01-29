import { NextResponse } from 'next/server';
import { Readable } from 'stream';
import busboy from 'busboy';
import sharp from 'sharp';
import dbConnect from '@/lib/db/mongodb';
import Media from '@/lib/models/Media';
import Message from '@/lib/models/Message';
import { getSession } from '@/lib/middleware/auth';

// Helper to convert Next.js request to Node.js readable stream
async function parseFormData(request) {
  return new Promise(async (resolve, reject) => {
    try {
      const contentType = request.headers.get('content-type');
      if (!contentType || !contentType.includes('multipart/form-data')) {
        reject(new Error('Invalid content type'));
        return;
      }

      const bb = busboy({ 
        headers: { 'content-type': contentType },
        limits: {
          fileSize: 50 * 1024 * 1024, // 50MB max file size
        }
      });

      const fields = {};
      const files = [];

      bb.on('field', (name, val) => {
        fields[name] = val;
      });

      bb.on('file', (name, file, info) => {
        const { filename, mimeType } = info;
        const chunks = [];

        file.on('data', (chunk) => {
          chunks.push(chunk);
        });

        file.on('end', () => {
          files.push({
            fieldname: name,
            originalname: filename,
            mimetype: mimeType,
            buffer: Buffer.concat(chunks),
          });
        });
      });

      bb.on('finish', () => {
        resolve({ fields, files });
      });

      bb.on('error', (error) => {
        reject(error);
      });

      // Convert Web Stream to Node.js stream
      const reader = request.body.getReader();
      const stream = new Readable({
        async read() {
          const { done, value } = await reader.read();
          if (done) {
            this.push(null);
          } else {
            this.push(value);
          }
        },
      });

      stream.pipe(bb);
    } catch (error) {
      reject(error);
    }
  });
}

// Compress image
async function compressImage(buffer, mimeType) {
  try {
    const image = sharp(buffer);
    const metadata = await image.metadata();

    // Resize if image is too large (max 1920x1920)
    let processedImage = image;
    if (metadata.width > 1920 || metadata.height > 1920) {
      processedImage = processedImage.resize(1920, 1920, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    }

    // Compress based on format
    let compressed;
    if (mimeType.includes('png')) {
      compressed = await processedImage
        .png({ quality: 85, compressionLevel: 8 })
        .toBuffer();
    } else if (mimeType.includes('webp')) {
      compressed = await processedImage
        .webp({ quality: 85 })
        .toBuffer();
    } else {
      // Default to JPEG for other formats
      compressed = await processedImage
        .jpeg({ quality: 85, progressive: true })
        .toBuffer();
    }

    // Create thumbnail
    const thumbnail = await sharp(buffer)
      .resize(200, 200, { fit: 'inside' })
      .blur(10)
      .jpeg({ quality: 60 })
      .toBuffer();

    return {
      compressed,
      thumbnail,
      width: metadata.width,
      height: metadata.height,
    };
  } catch (error) {
    console.error('Image compression error:', error);
    return null;
  }
}

export async function POST(request) {
  try {
    await dbConnect();

    // Verify session
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse multipart form data
    const { fields, files } = await parseFormData(request);

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    const { roomId } = fields;
    if (!roomId) {
      return NextResponse.json(
        { error: 'Room ID is required' },
        { status: 400 }
      );
    }

    const file = files[0];
    const isImage = file.mimetype.startsWith('image/');
    const isVideo = file.mimetype.startsWith('video/');

    if (!isImage && !isVideo) {
      return NextResponse.json(
        { error: 'Only images and videos are supported' },
        { status: 400 }
      );
    }

    let mediaData = {
      roomId,
      senderId: session.user._id,
      fileName: `${Date.now()}-${file.originalname}`,
      originalName: file.originalname,
      mimeType: file.mimetype,
      fileSize: file.buffer.length,
      data: file.buffer,
    };

    // Compress images
    if (isImage) {
      const compressed = await compressImage(file.buffer, file.mimetype);
      if (compressed) {
        mediaData.data = compressed.compressed;
        mediaData.thumbnail = compressed.thumbnail;
        mediaData.width = compressed.width;
        mediaData.height = compressed.height;
        mediaData.compressed = true;
        mediaData.fileSize = compressed.compressed.length;
      }
    } else if (isVideo) {
      // For videos, create a simple thumbnail (you can enhance this)
      mediaData.thumbnail = file.buffer.slice(0, 1024); // Placeholder
    }

    // Save to database
    const media = new Media(mediaData);
    await media.save();

    // Create a message entry
    const message = new Message({
      roomId,
      senderId: session.user._id,
      senderName: session.user.name,
      message: '',
      mediaId: media._id,
      type: 'media',
    });
    await message.save();

    return NextResponse.json({
      success: true,
      mediaId: media._id,
      messageId: message._id,
      fileName: media.fileName,
      mimeType: media.mimeType,
      fileSize: media.fileSize,
    });
  } catch (error) {
    console.error('Media upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload media' },
      { status: 500 }
    );
  }
}
