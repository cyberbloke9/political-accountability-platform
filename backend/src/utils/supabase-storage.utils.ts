import { supabaseAdmin } from '../config/supabase.config';

export const STORAGE_BUCKETS = {
  EVIDENCE_IMAGES: 'evidence-images',
  EVIDENCE_VIDEOS: 'evidence-videos',
  PROFILE_AVATARS: 'profile-avatars'
} as const;

export interface UploadResult {
  path: string;
  publicUrl: string;
  fullPath: string;
}

export interface SignedUrlResult {
  signedUrl: string;
  expiresAt: number;
}

export async function getPublicUrl(bucket: string, filePath: string): Promise<string> {
  const { data } = supabaseAdmin.storage
    .from(bucket)
    .getPublicUrl(filePath);
  
  return data.publicUrl;
}

export async function getSignedUrl(
  bucket: string,
  filePath: string,
  expiresIn: number = 3600
): Promise<SignedUrlResult> {
  const { data, error } = await supabaseAdmin.storage
    .from(bucket)
    .createSignedUrl(filePath, expiresIn);

  if (error) {
    throw new Error(`Failed to create signed URL: ${error.message}`);
  }

  const expiresAt = Date.now() + (expiresIn * 1000);

  return {
    signedUrl: data.signedUrl,
    expiresAt
  };
}

export async function deleteFile(bucket: string, filePath: string): Promise<void> {
  const { error } = await supabaseAdmin.storage
    .from(bucket)
    .remove([filePath]);

  if (error) {
    throw new Error(`Failed to delete file: ${error.message}`);
  }
}

export async function deleteFiles(bucket: string, filePaths: string[]): Promise<void> {
  const { error } = await supabaseAdmin.storage
    .from(bucket)
    .remove(filePaths);

  if (error) {
    throw new Error(`Failed to delete files: ${error.message}`);
  }
}

export function getImageTransformUrl(
  publicUrl: string,
  options: {
    width?: number;
    height?: number;
    resize?: 'cover' | 'contain' | 'fill';
    format?: 'webp' | 'jpeg' | 'png';
    quality?: number;
  } = {}
): string {
  const url = new URL(publicUrl);
  const searchParams = new URLSearchParams();

  if (options.width) searchParams.set('width', options.width.toString());
  if (options.height) searchParams.set('height', options.height.toString());
  if (options.resize) searchParams.set('resize', options.resize);
  if (options.format) searchParams.set('format', options.format);
  if (options.quality) searchParams.set('quality', options.quality.toString());

  const transformParams = searchParams.toString();
  if (transformParams) {
    url.search = transformParams;
  }

  return url.toString();
}

export function generateThumbnailUrl(publicUrl: string): string {
  return getImageTransformUrl(publicUrl, {
    width: 400,
    height: 400,
    resize: 'cover',
    format: 'webp',
    quality: 80
  });
}

export function generateMediumUrl(publicUrl: string): string {
  return getImageTransformUrl(publicUrl, {
    width: 1200,
    height: 1200,
    resize: 'contain',
    format: 'webp',
    quality: 85
  });
}

export async function listFiles(bucket: string, prefix: string = ''): Promise<string[]> {
  const { data, error } = await supabaseAdmin.storage
    .from(bucket)
    .list(prefix);

  if (error) {
    throw new Error(`Failed to list files: ${error.message}`);
  }

  return data.map(file => file.name);
}

export async function getFileMetadata(bucket: string, filePath: string) {
  const { data, error } = await supabaseAdmin.storage
    .from(bucket)
    .list('', {
      search: filePath
    });

  if (error) {
    throw new Error(`Failed to get file metadata: ${error.message}`);
  }

  const file = data.find(f => f.name === filePath);
  
  return file ? {
    name: file.name,
    size: file.metadata?.size || 0,
    mimeType: file.metadata?.mimetype || 'unknown',
    lastModified: file.metadata?.lastModified || new Date(),
    created: file.created_at
  } : null;
}

export function validateFileType(mimeType: string, allowedTypes: string[]): boolean {
  return allowedTypes.some(type => {
    if (type.endsWith('/*')) {
      const prefix = type.slice(0, -2);
      return mimeType.startsWith(prefix);
    }
    return mimeType === type;
  });
}

export function validateFileSize(sizeBytes: number, maxSizeMB: number): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return sizeBytes <= maxSizeBytes;
}

export function generateStoragePath(verificationId: string, filename: string): string {
  const timestamp = Date.now();
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
  return `${verificationId}/${timestamp}-${sanitizedFilename}`;
}

export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif'
];

export const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-msvideo'
];

export const MAX_IMAGE_SIZE_MB = 10;
export const MAX_VIDEO_SIZE_MB = 100;

export default {
  STORAGE_BUCKETS,
  getPublicUrl,
  getSignedUrl,
  deleteFile,
  deleteFiles,
  getImageTransformUrl,
  generateThumbnailUrl,
  generateMediumUrl,
  listFiles,
  getFileMetadata,
  validateFileType,
  validateFileSize,
  generateStoragePath,
  ALLOWED_IMAGE_TYPES,
  ALLOWED_VIDEO_TYPES,
  MAX_IMAGE_SIZE_MB,
  MAX_VIDEO_SIZE_MB
};
