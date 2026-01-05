# New Promise Page (promises/new/page.tsx)

## Overview

**File Path:** `frontend/src/app/promises/new/page.tsx`
**URL:** `/promises/new`
**Type:** Client Component (`'use client'`)

## Purpose

The New Promise Page allows authenticated users to submit new political promises to the platform. It includes form validation, image upload, tagging, and categorization.

## Data Fetching

### User Data
- Fetches user database ID from `users` table using `auth_id`

### Image Upload
- Uploads to Supabase Storage bucket: `promise-images`
- Path format: `{user_id}/{random_string}-{timestamp}.{ext}`

### Promise Submission
- Inserts into `promises` table

## Components Used

### Layout Components
- `Header` - Main navigation header
- `Footer` - Site footer

### UI Components
- `Button` - Action buttons
- `Input` - Text inputs
- `Label` - Form labels
- `Textarea` - Promise description
- `Select`, `SelectContent`, `SelectItem`, `SelectTrigger`, `SelectValue` - Category select
- `Popover`, `PopoverContent`, `PopoverTrigger` - Date picker container
- `Calendar` - Date selection
- `Card`, `CardContent`, `CardDescription`, `CardHeader`, `CardTitle`
- `Image` (Next.js) - Image preview

### Icons (Lucide React)
- `Calendar` - Date picker icon
- `Loader2` - Loading spinner
- `Upload` - File upload icon
- `X` - Remove tag/image
- `ShieldCheck` - Page header icon

### External Libraries
- `sonner` - Toast notifications
- `date-fns` - Date formatting

## Categories

```typescript
const CATEGORIES = [
  'Healthcare',
  'Education',
  'Economy',
  'Infrastructure',
  'Environment',
  'Justice',
  'Defense',
  'Technology',
  'Social Welfare',
  'Foreign Policy',
  'Other',
]
```

## State Management

```typescript
const [isSubmitting, setIsSubmitting] = useState(false)
const [imageFile, setImageFile] = useState<File | null>(null)
const [imagePreview, setImagePreview] = useState<string>('')
const [formData, setFormData] = useState({
  politician_name: '',
  promise_text: '',
  promise_date: undefined as Date | undefined,
  source_url: '',
  category: '',
  tags: [] as string[],
})
const [tagInput, setTagInput] = useState('')
const [errors, setErrors] = useState<Record<string, string>>({})
```

## Form Fields

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| Politician Name | Text | Yes | Non-empty |
| Promise Description | Textarea | Yes | Min 10 characters |
| Date of Promise | Date picker | Yes | Not future date |
| Source URL | URL | No | Valid URL format |
| Category | Select | No | From predefined list |
| Tags | Multi-input | No | Custom tags |
| Image | File upload | No | Max 5MB, image types only |

## User Interactions

1. **Politician Name Input** - Enter politician's name
2. **Promise Description Textarea** - Describe the promise
3. **Date Picker** - Select when promise was made
4. **Source URL Input** - Link to source article/video
5. **Category Select** - Choose from predefined categories
6. **Tag Input** - Add custom tags (Enter or click Add)
7. **Remove Tag** - Click X on tag to remove
8. **Image Upload** - Select image file
9. **Remove Image** - Click to remove uploaded image
10. **Submit Button** - Create the promise
11. **Cancel Button** - Navigate back to `/promises`

## Image Handling

### Validation
- Max size: 5MB
- Type: Must be image/*

### Upload Process
```typescript
const uploadImage = async (): Promise<string | null> => {
  const fileExt = imageFile.name.split('.').pop()
  const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`
  const filePath = `${user?.id}/${fileName}`

  await supabase.storage.from('promise-images').upload(filePath, imageFile)
  return supabase.storage.from('promise-images').getPublicUrl(filePath).data.publicUrl
}
```

## Submission Flow

1. Client-side validation
2. Upload image (if provided)
3. Fetch user database ID
4. Insert promise with all data
5. On success: Toast + redirect to `/promises`
6. On error: Toast with error message

## Authentication Requirements

- **Required:** Yes
- Redirects to `/auth/login` if not authenticated
- Uses `useAuth()` hook to check authentication

## Error Handling

- Inline validation errors below each field
- Toast notifications for API errors
- Loading states prevent double submission

## Navigation Links

| Element | Destination |
|---------|-------------|
| Cancel | `/promises` |
| On Success | `/promises` |
| If Not Authenticated | `/auth/login` |
