/**
 * Photo Service
 * Handles photo uploads to S3 for the gallery module
 */

import { storagePut } from "../storage";
import * as db from "../db";

interface UploadPhotoResult {
  success: boolean;
  photoId?: number;
  url?: string;
  error?: string;
}

/**
 * Generate a random suffix for file names to prevent enumeration
 */
function randomSuffix(): string {
  return Math.random().toString(36).substring(2, 10);
}

/**
 * Upload a photo to S3 and save metadata to database
 */
export async function uploadPhoto(
  clubId: number,
  userId: number,
  fileBuffer: Buffer | Uint8Array,
  fileName: string,
  contentType: string,
  albumName?: string,
  caption?: string
): Promise<UploadPhotoResult> {
  try {
    // Generate unique file key
    const extension = fileName.split('.').pop() || 'jpg';
    const fileKey = `clubs/${clubId}/photos/${Date.now()}-${randomSuffix()}.${extension}`;

    // Upload to S3
    const { url } = await storagePut(fileKey, fileBuffer, contentType);

    // Save metadata to database
    const photoId = await db.createPhoto({
      clubId,
      url,
      title: caption || fileName,
      description: albumName,
    });

    return {
      success: true,
      photoId,
      url,
    };
  } catch (error) {
    console.error("[PhotoService] Upload error:", error);
    return {
      success: false,
      error: String(error),
    };
  }
}

/**
 * Upload multiple photos at once
 */
export async function uploadPhotos(
  clubId: number,
  userId: number,
  files: Array<{
    buffer: Buffer | Uint8Array;
    fileName: string;
    contentType: string;
  }>,
  albumName?: string
): Promise<{ success: number; failed: number; photos: UploadPhotoResult[] }> {
  const results: UploadPhotoResult[] = [];
  let success = 0;
  let failed = 0;

  for (const file of files) {
    const result = await uploadPhoto(
      clubId,
      userId,
      file.buffer,
      file.fileName,
      file.contentType,
      albumName
    );

    results.push(result);
    if (result.success) {
      success++;
    } else {
      failed++;
    }
  }

  return { success, failed, photos: results };
}

/**
 * Delete a photo from database
 */
export async function deletePhoto(photoId: number): Promise<boolean> {
  try {
    await db.deletePhoto(photoId);
    return true;
  } catch (error) {
    console.error("[PhotoService] Delete error:", error);
    return false;
  }
}
