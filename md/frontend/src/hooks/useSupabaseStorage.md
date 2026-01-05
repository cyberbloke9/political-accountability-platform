# useSupabaseStorage Hook

## Overview

The `useSupabaseStorage` hook provides a comprehensive interface for managing file uploads, deletions, and URL generation with Supabase Storage. It is designed specifically for handling evidence images, evidence videos, and profile avatars within the political accountability platform. The hook abstracts away the complexity of Supabase Storage operations while providing upload progress tracking and image optimization capabilities.

## File Location

`C:\Users\Prithvi Putta\Desktop\political-accountability-platform\frontend\src\hooks\useSupabaseStorage.ts`

## Dependencies

- `react` - useState hook for state management
- `../lib/supabase` - Supabase client instance

## Interfaces

### UploadProgress

Tracks the current state of a file upload operation.

```typescript
interface UploadProgress {
  uploading: boolean    // Whether an upload is currently in progress
  progress: number      // Upload progress percentage (0-100)
  error: Error | null   // Error object if upload failed, null otherwise
}
```

### UploadResult

Represents the result of a successful file upload.

```typescript
interface UploadResult {
  publicUrl: string       // The public URL to access the uploaded file
  path: string            // The storage path where the file is stored
  thumbnailUrl?: string   // Optional optimized thumbnail URL (for images only)
}
```

## Constants

### STORAGE_BUCKETS

A readonly object mapping logical bucket names to their Supabase storage bucket identifiers:

```typescript
const STORAGE_BUCKETS = {
  EVIDENCE_IMAGES: 'evidence-images',
  EVIDENCE_VIDEOS: 'evidence-videos',
  PROFILE_AVATARS: 'profile-avatars',
} as const
```

## Parameters

This hook takes no parameters.

## Return Values

The hook returns an object containing:

| Property | Type | Description |
|----------|------|-------------|
| `uploadFile` | `(file: File, bucket: keyof typeof STORAGE_BUCKETS, path: string) => Promise<UploadResult \| null>` | Uploads a file to the specified bucket |
| `deleteFile` | `(bucket: keyof typeof STORAGE_BUCKETS, path: string) => Promise<{ success: boolean; error?: Error }>` | Deletes a file from storage |
| `getPublicUrl` | `(bucket: keyof typeof STORAGE_BUCKETS, path: string) => string` | Gets the public URL for a file |
| `getOptimizedImageUrl` | `(publicUrl: string, options?: ImageOptions) => string` | Generates an optimized image URL with transformations |
| `uploadProgress` | `UploadProgress` | Current upload progress state |
| `STORAGE_BUCKETS` | `typeof STORAGE_BUCKETS` | Available storage bucket constants |

## State Management

The hook maintains a single piece of state:

```typescript
const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
  uploading: false,
  progress: 0,
  error: null,
})
```

This state is updated throughout the upload lifecycle:
- **Before upload**: `{ uploading: true, progress: 0, error: null }`
- **On success**: `{ uploading: false, progress: 100, error: null }`
- **On error**: `{ uploading: false, progress: 0, error: <Error> }`

## Functions

### uploadFile

Uploads a file to Supabase Storage.

**Parameters:**
- `file: File` - The file object to upload
- `bucket: keyof typeof STORAGE_BUCKETS` - The target bucket ('EVIDENCE_IMAGES', 'EVIDENCE_VIDEOS', or 'PROFILE_AVATARS')
- `path: string` - The directory path within the bucket

**Returns:** `Promise<UploadResult | null>` - Upload result on success, null on failure

**Behavior:**
1. Sets upload state to in-progress
2. Generates a unique file path using timestamp prefix
3. Uploads file to Supabase with cache control (3600 seconds)
4. Retrieves the public URL for the uploaded file
5. For image uploads, generates an optimized thumbnail URL (400x400, webp format, 80% quality)
6. Updates upload state based on success/failure

**File Path Generation:**
```typescript
const filePath = `${path}/${Date.now()}-${file.name}`
```

### deleteFile

Removes a file from Supabase Storage.

**Parameters:**
- `bucket: keyof typeof STORAGE_BUCKETS` - The bucket containing the file
- `path: string` - The full path to the file

**Returns:** `Promise<{ success: boolean; error?: Error }>`

**Behavior:**
- Attempts to delete the file from the specified bucket
- Returns success status and any error encountered
- Logs errors to console

### getPublicUrl

Retrieves the public URL for a file in storage.

**Parameters:**
- `bucket: keyof typeof STORAGE_BUCKETS` - The bucket containing the file
- `path: string` - The file path within the bucket

**Returns:** `string` - The public URL for the file

### getOptimizedImageUrl

Generates an optimized image URL with transformation parameters.

**Parameters:**
- `publicUrl: string` - The base public URL of the image
- `options: object` - Optional transformation options:
  - `width?: number` - Target width in pixels
  - `height?: number` - Target height in pixels
  - `resize?: 'cover' | 'contain' | 'fill'` - Resize mode
  - `format?: 'webp' | 'jpeg' | 'png'` - Output format
  - `quality?: number` - Quality percentage (1-100)

**Returns:** `string` - The URL with transformation query parameters

## Side Effects

1. **Supabase Storage API Calls**: The hook makes external API calls to Supabase Storage for upload, delete, and URL retrieval operations.

2. **Console Logging**: Errors during file deletion are logged to the console.

3. **State Updates**: Upload progress state is modified during upload operations, which may trigger re-renders in consuming components.

## Usage Examples

### Basic File Upload

```tsx
import { useSupabaseStorage } from '@/hooks/useSupabaseStorage'

function EvidenceUploader() {
  const { uploadFile, uploadProgress } = useSupabaseStorage()

  const handleUpload = async (file: File) => {
    const result = await uploadFile(file, 'EVIDENCE_IMAGES', 'user-evidence')

    if (result) {
      console.log('Uploaded to:', result.publicUrl)
      console.log('Thumbnail:', result.thumbnailUrl)
    }
  }

  return (
    <div>
      <input
        type="file"
        onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
      />
      {uploadProgress.uploading && <p>Uploading...</p>}
      {uploadProgress.error && <p>Error: {uploadProgress.error.message}</p>}
    </div>
  )
}
```

### Upload with Progress Display

```tsx
import { useSupabaseStorage } from '@/hooks/useSupabaseStorage'

function VideoUploader() {
  const { uploadFile, uploadProgress, STORAGE_BUCKETS } = useSupabaseStorage()

  const handleVideoUpload = async (file: File) => {
    const result = await uploadFile(file, 'EVIDENCE_VIDEOS', 'submissions')

    if (result) {
      // Handle successful upload
      saveVideoReference(result.path, result.publicUrl)
    }
  }

  return (
    <div>
      <input
        type="file"
        accept="video/*"
        onChange={(e) => e.target.files?.[0] && handleVideoUpload(e.target.files[0])}
        disabled={uploadProgress.uploading}
      />
      {uploadProgress.uploading && (
        <progress value={uploadProgress.progress} max="100" />
      )}
    </div>
  )
}
```

### Deleting Files

```tsx
import { useSupabaseStorage } from '@/hooks/useSupabaseStorage'

function FileManager({ filePath }: { filePath: string }) {
  const { deleteFile } = useSupabaseStorage()

  const handleDelete = async () => {
    const { success, error } = await deleteFile('EVIDENCE_IMAGES', filePath)

    if (success) {
      console.log('File deleted successfully')
    } else {
      console.error('Failed to delete:', error)
    }
  }

  return <button onClick={handleDelete}>Delete File</button>
}
```

### Optimized Image Display

```tsx
import { useSupabaseStorage } from '@/hooks/useSupabaseStorage'

function OptimizedImage({ bucket, path }: { bucket: 'EVIDENCE_IMAGES', path: string }) {
  const { getPublicUrl, getOptimizedImageUrl } = useSupabaseStorage()

  const publicUrl = getPublicUrl(bucket, path)

  const thumbnailUrl = getOptimizedImageUrl(publicUrl, {
    width: 200,
    height: 200,
    resize: 'cover',
    format: 'webp',
    quality: 75
  })

  const fullSizeUrl = getOptimizedImageUrl(publicUrl, {
    width: 1200,
    format: 'webp',
    quality: 90
  })

  return (
    <a href={fullSizeUrl}>
      <img src={thumbnailUrl} alt="Evidence" />
    </a>
  )
}
```

### Profile Avatar Upload

```tsx
import { useSupabaseStorage } from '@/hooks/useSupabaseStorage'

function AvatarUpload({ userId }: { userId: string }) {
  const { uploadFile, uploadProgress } = useSupabaseStorage()

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const result = await uploadFile(file, 'PROFILE_AVATARS', `user-${userId}`)

    if (result) {
      await updateUserProfile({ avatarUrl: result.publicUrl })
    }
  }

  return (
    <label>
      <input
        type="file"
        accept="image/*"
        onChange={handleAvatarChange}
        hidden
      />
      <span>Change Avatar</span>
    </label>
  )
}
```

## Error Handling

The hook provides error handling through:

1. **Try-catch blocks**: All async operations are wrapped in try-catch
2. **Error state**: Upload errors are stored in `uploadProgress.error`
3. **Return values**: Functions return null or error objects on failure

## Notes

- The hook uses `'use client'` directive for Next.js client-side rendering
- File paths are automatically prefixed with timestamps to ensure uniqueness
- Cache control is set to 3600 seconds (1 hour) for uploaded files
- Upsert is disabled, meaning duplicate file uploads will fail
- Thumbnail URLs are only generated for images, not videos
