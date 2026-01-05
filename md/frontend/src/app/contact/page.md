# Contact Page (contact/page.tsx)

## Overview

**File Path:** `frontend/src/app/contact/page.tsx`
**URL:** `/contact`
**Type:** Client Component (`'use client'`)

## Purpose

The Contact Page provides a feedback form for users to submit suggestions, bug reports, or general inquiries. It also links to the open-source GitHub repository for code contributions.

## Data Fetching

### Form Submission
- POST request to `/api/feedback` endpoint
- Sends name, email, subject, and message

## Components Used

### Layout Components
- `Header` - Main navigation header
- `Footer` - Site footer

### UI Components
- `Card`, `CardContent`, `CardHeader`, `CardTitle`, `CardDescription`
- `Button` - Submit and external link buttons
- `Input` - Text inputs
- `Textarea` - Message input
- `Label` - Form labels
- `Badge` - Section badge

### Icons (Lucide React)
- `MessageSquare` - Form header / feedback importance
- `Github` - GitHub link
- `Send` - Submit button
- `CheckCircle` - Success message / benefits list
- `AlertCircle` - Error message

## State Management

```typescript
const [formData, setFormData] = useState({
  name: '',
  email: '',
  subject: '',
  message: ''
})
const [isSubmitting, setIsSubmitting] = useState(false)
const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
const [errors, setErrors] = useState<Record<string, string>>({})
```

## Form Fields

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| Name | Text | Yes | Non-empty |
| Email | Email | Yes | Valid email format |
| Subject | Text | Yes | Non-empty |
| Message | Textarea | Yes | Min 10 characters |

## User Interactions

1. **Name Input** - Enter full name
2. **Email Input** - Enter email address
3. **Subject Input** - Enter message subject
4. **Message Textarea** - Enter detailed message
5. **Send Feedback Button** - Submit form
6. **View on GitHub Button** - Opens GitHub repository

## Form Validation

```typescript
const validateForm = () => {
  // Name: required
  // Email: required + format check
  // Subject: required
  // Message: required + min 10 characters
}
```

## Submission Flow

1. Client-side validation
2. POST to `/api/feedback`
3. On success:
   - Show success message
   - Clear form
4. On error:
   - Show error message

## Feedback Importance Section

Lists why feedback matters:
- Improve platform features and usability
- Fix bugs and technical issues quickly
- Prioritize new features that matter most
- Build a better democracy together

## GitHub Section

- Open source promotion
- Direct link to repository
- "View on GitHub" button

## Privacy Note

Card with privacy assurance:
- Feedback used solely for improvement
- No data selling or third-party sharing

## Authentication Requirements

- **Required:** No
- Public page accessible to all visitors

## Status Messages

### Success State
- Green background card
- CheckCircle icon
- "Thank you! Your feedback has been submitted successfully."

### Error State
- Red background card
- AlertCircle icon
- "Failed to submit feedback. Please try again later."

## Styling

- Two-column grid on medium+ screens
- Form card on left
- Info cards on right
- Error states: `border-red-500` on inputs
- Privacy card: `bg-primary/5 border-primary/20`

## External Links

| Element | Destination |
|---------|-------------|
| View on GitHub | https://github.com/cyberbloke9/political-accountability-platform |
