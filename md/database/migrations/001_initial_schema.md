# 001_initial_schema.sql

## Overview
This is the foundational database migration that sets up the core schema for the Political Accountability Platform. It transforms the initial database structure and establishes Row Level Security (RLS) policies for all tables.

## Key Operations

### 1. Policy Cleanup (Steps 1-2)
- **Drops all existing RLS policies** from public schema tables
- **Drops all storage policies** from storage.objects
- This ensures a clean slate for fresh policy creation

### 2. Schema Transformation (Step 3)

#### Users Table
- Adds `auth_id` column linking to Supabase Auth
- Creates unique constraint and index on `auth_id`
- Removes legacy authentication columns (`password_hash`, `mfa_enabled`, `mfa_secret`)

#### Promises Table
- Removes old columns: `title`, `leader_name`, `leader_party`, `constituency`, `promised_date`, `target_completion_date`, `location`, `description`, `metadata`
- Adds new columns:
  - `politician_name` (VARCHAR 200) - Name of the politician
  - `promise_text` (TEXT) - The actual promise content
  - `promise_date` (DATE) - When promise was made
  - `source_url` (TEXT) - Link to source
  - `tags` (TEXT[]) - Array of tags
  - `image_url` (TEXT) - Optional image
  - `view_count` (INTEGER) - Track views
- Creates `promise_status_enum` with values: `pending`, `in_progress`, `fulfilled`, `broken`, `stalled`

#### Verifications Table
- Removes old complex columns
- Adds simplified columns:
  - `verdict` - Must be: `fulfilled`, `broken`, `in_progress`, `stalled`
  - `evidence_text` - Text evidence
  - `evidence_urls` (TEXT[]) - Array of URLs
  - `status` - Must be: `pending`, `approved`, `rejected`
  - `upvotes`, `downvotes` (INTEGER)
  - `fraud_flags` (TEXT[])

#### Votes Table
- Creates `vote_type_enum` with values: `upvote`, `downvote`
- Converts existing `approve` votes to `upvote`

### 3. Auth User Sync Trigger
```sql
handle_new_user() TRIGGER
```
- Automatically creates a `public.users` record when a new Supabase Auth user signs up
- Extracts username from metadata or email prefix
- Uses `ON CONFLICT DO UPDATE` for idempotency

### 4. Row Level Security Policies

| Table | Policy | Description |
|-------|--------|-------------|
| users | SELECT | Everyone can view users |
| users | UPDATE | Users can only update their own profile |
| promises | SELECT | Everyone can view promises |
| promises | INSERT | Authenticated users can create (verified ownership) |
| promises | UPDATE | Users can update own promises within 24 hours |
| verifications | SELECT | Everyone can view |
| verifications | INSERT | Authenticated users can create |
| verifications | UPDATE | Users can update own pending verifications |
| votes | SELECT/INSERT/UPDATE/DELETE | Full CRUD for authenticated users on own votes |
| evidence_files | SELECT | Everyone can view |
| evidence_files | INSERT/DELETE | Users can manage evidence for own verifications |
| activity_logs | SELECT | Users can view own logs |
| activity_logs | INSERT | System can insert (open policy) |

### 5. Storage Buckets
Creates two public storage buckets:
- `promise-images` - For promise-related images
- `evidence-images` - For verification evidence

## Security Considerations
- All tables use RLS (Row Level Security)
- Auth checks use `auth.uid()` for user verification
- Ownership validated through `users.auth_id` relationship
- Time-limited edit windows (24 hours for promises)

## Dependencies
- Requires Supabase Auth (`auth.users` table)
- Existing `users`, `promises`, `verifications`, `votes`, `evidence_files`, `activity_logs` tables
