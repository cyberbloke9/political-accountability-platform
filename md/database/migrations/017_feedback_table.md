# 017_feedback_table.sql

## Overview
Creates a simple feedback table for user submissions from the contact page. Supports anonymous feedback submission with admin review workflow.

## Table: `feedback`

| Column | Type | Description |
|--------|------|-------------|
| id | BIGSERIAL | Primary key (auto-increment) |
| name | VARCHAR(200) | Submitter's name |
| email | VARCHAR(255) | Submitter's email for follow-up |
| subject | VARCHAR(500) | Brief subject line |
| message | TEXT | Detailed feedback message |
| status | VARCHAR(20) | Current workflow status |
| admin_notes | TEXT | Internal admin notes |
| resolved_by | UUID | FK to admin who resolved |
| resolved_at | TIMESTAMPTZ | When resolved |
| created_at | TIMESTAMPTZ | Submission time |
| updated_at | TIMESTAMPTZ | Last update time |

## Status Values

| Status | Description |
|--------|-------------|
| `pending` | New submission, not reviewed |
| `in_review` | Admin is looking at it |
| `resolved` | Issue addressed |
| `archived` | Old/no action needed |

## Indexes

- `idx_feedback_status` - Filter by status
- `idx_feedback_created_at` - Sort by date (DESC)
- `idx_feedback_email` - Find by email

## Triggers

### `trigger_feedback_updated_at`
Automatically updates `updated_at` timestamp on any UPDATE.

## Row Level Security

| Operation | Policy |
|-----------|--------|
| SELECT | Admins only (uses `is_admin()`) |
| UPDATE | Admins only |
| INSERT | Anyone (no auth required) |

## Usage Examples

```sql
-- View pending feedback
SELECT * FROM feedback
WHERE status = 'pending'
ORDER BY created_at DESC;

-- Mark feedback as in review
UPDATE feedback
SET status = 'in_review'
WHERE id = 123;

-- Resolve feedback
UPDATE feedback
SET
  status = 'resolved',
  admin_notes = 'Issue addressed via email',
  resolved_by = 'admin-uuid',
  resolved_at = NOW()
WHERE id = 123;

-- Search by email
SELECT * FROM feedback
WHERE email = 'user@example.com';

-- Get feedback counts by status
SELECT status, COUNT(*)
FROM feedback
GROUP BY status;

-- Recent unresolved feedback
SELECT name, subject, created_at
FROM feedback
WHERE status NOT IN ('resolved', 'archived')
ORDER BY created_at DESC
LIMIT 10;
```

## API Integration

The `/api/feedback` route handles POST submissions:

```typescript
// Frontend submission
const response = await fetch('/api/feedback', {
  method: 'POST',
  body: JSON.stringify({
    name: 'John Doe',
    email: 'john@example.com',
    subject: 'Bug Report',
    message: 'Found an issue...'
  })
});
```

## Admin Workflow

1. User submits feedback via `/contact` page
2. Admin views `/admin/feedback` (if implemented)
3. Admin changes status to `in_review`
4. Admin responds to user via email (external)
5. Admin marks as `resolved` with notes

## Notes

- No authentication required to submit feedback
- Email validation should happen in frontend/API
- Consider rate limiting to prevent spam
- Admin notes are internal, never shown to users
