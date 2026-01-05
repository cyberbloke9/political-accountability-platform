# New Verification Page (verifications/new/page.tsx)

## Overview

**File Path:** `frontend/src/app/verifications/new/page.tsx`
**URL:** `/verifications/new`
**Type:** Client Component (`'use client'`)

## Purpose

The New Verification Page allows authenticated users to submit evidence verifying the status of political promises. Users can select a promise, choose a verdict, provide evidence text, add URLs, and upload files.

## Data Fetching

### Promise List
- Fetches from Supabase `promises` table
- Gets id, politician_name, promise_text
- Ordered by `created_at` descending
- Limited to 100 promises

### URL Parameter
- Accepts `?promise=[id]` to pre-select a promise
- Uses `useSearchParams()` to read query params

### User Data
- Fetches user database ID from `users` table

### File Upload
- Uploads to Supabase Storage bucket: `verification-evidence`

## Components Used

### Layout Components
- `Header` - Main navigation header
- `Footer` - Site footer

### UI Components
- `Button` - Action buttons
- `Input` - URL and file inputs
- `Label` - Form labels
- `Textarea` - Evidence description
- `Select`, `SelectContent`, `SelectItem`, `SelectTrigger`, `SelectValue`
- `Card`, `CardContent`, `CardDescription`, `CardHeader`, `CardTitle`
- `Image` (Next.js) - File preview

### Icons (Lucide React)
- `Loader2` - Loading spinner
- `Upload` - File upload icon
- `X` - Remove file/URL
- `FileText` - File placeholder / page header
- `Plus` - Add URL button

### External Libraries
- `sonner` - Toast notifications

## Verdict Options

```typescript
const VERDICTS = [
  { value: 'fulfilled', label: 'Fulfilled', description: 'The promise has been completely kept' },
  { value: 'broken', label: 'Broken', description: 'The promise was not kept' },
  { value: 'in_progress', label: 'In Progress', description: 'Work has begun but not completed' },
  { value: 'needs_more_time', label: 'Needs More Time', description: 'Progress is being made, more time needed' },
]
```

## State Management

```typescript
const [isSubmitting, setIsSubmitting] = useState(false)
const [evidenceFiles, setEvidenceFiles] = useState<File[]>([])
const [evidenceFilePreviews, setEvidenceFilePreviews] = useState<string[]>([])
const [promises, setPromises] = useState<PromiseData[]>([])
const [loadingPromises, setLoadingPromises] = useState(true)
const [formData, setFormData] = useState({
  promise_id: searchParams.get('promise') || '',
  verdict: '',
  evidence_text: '',
  evidence_urls: [''] as string[],
})
const [errors, setErrors] = useState<Record<string, string>>({})
```

## Form Fields

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| Promise Selection | Select | Yes | Must select |
| Verdict | Select | Yes | Must select |
| Evidence Description | Textarea | Yes | Min 20 characters |
| Evidence URLs | URL inputs | No | Valid URL format |
| Evidence Files | File upload | No | Max 10 files, 10MB each |

## User Interactions

1. **Promise Select** - Choose promise to verify
2. **Verdict Select** - Select verification verdict
3. **Evidence Textarea** - Describe evidence
4. **Add URL Button** - Add another URL input
5. **Remove URL Button** - Remove a URL input
6. **File Upload** - Upload evidence files
7. **Remove File Button** - Remove uploaded file
8. **Submit Button** - Submit verification
9. **Cancel Button** - Navigate to `/promises`

## File Handling

### Limits
- Maximum 10 files
- Maximum 10MB per file

### Accepted Types
- Images (image/*)
- Videos (video/*)
- PDFs (.pdf)

### Preview
- Image files show thumbnail preview
- Non-image files show FileText icon

## Upload Process

```typescript
const uploadFiles = async (): Promise<string[]> => {
  const uploadedUrls: string[] = []
  for (const file of evidenceFiles) {
    const fileName = `${random}-${timestamp}.${ext}`
    const filePath = `${user.id}/${fileName}`
    await supabase.storage.from('verification-evidence').upload(filePath, file)
    uploadedUrls.push(publicUrl)
  }
  return uploadedUrls
}
```

## Submission Flow

1. Client-side validation
2. Upload evidence files
3. Fetch user database ID
4. Combine manual URLs + uploaded file URLs
5. Insert verification with status: 'pending'
6. On success: Toast + redirect to `/promises/[id]`
7. On error: Toast with error message

## Authentication Requirements

- **Required:** Yes
- Redirects to `/auth/login` if not authenticated
- Uses `useAuth()` hook

## Suspense Wrapper

Page is wrapped in Suspense for `useSearchParams()`:
```typescript
export default function NewVerificationPageWrapper() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <NewVerificationPage />
    </Suspense>
  )
}
```

## Navigation Links

| Element | Destination |
|---------|-------------|
| Cancel | `/promises` |
| On Success | `/promises/[promise_id]` |
| If Not Authenticated | `/auth/login` |
