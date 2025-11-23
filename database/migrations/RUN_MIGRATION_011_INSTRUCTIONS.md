# Running Migration 011: Ban Management System

## Overview

This migration implements a **comprehensive ban management system** with temporary and permanent bans, ban appeals, auto-expiry, and complete audit trail.

---

## **Migration 011: Ban Management System**

### What It Creates:

1. **Tables**:
   - `bans` - Complete ban records with duration, expiry, and audit trail
   - `ban_appeals` - User appeals against bans

2. **Functions**:
   - `is_user_banned(user_id)` - Check if user is currently banned
   - `expire_temporary_bans()` - Auto-expire temporary bans
   - `ban_user()` - Ban a user with full logging
   - `unban_user()` - Unban a user with reason

3. **Security**:
   - RLS policies (admins level 2+ can ban/unban)
   - Users can view their own bans and create appeals
   - All actions logged to `admin_actions` table

### Running Migration 011:

1. Go to Supabase: https://supabase.com/dashboard/project/avxuugbgewmiccgteghi
2. SQL Editor → New Query
3. Copy entire contents of `011_ban_management_system.sql`
4. Click **Run**

### Expected Output:

```
CREATE TABLE (2 times)
CREATE INDEX (9 times)
ALTER TABLE (2 times)
CREATE POLICY (6 times)
CREATE FUNCTION (4 times)
COMMENT ON... (6 times)
```

Should complete with no errors.

---

## **Verify Everything Works**

### Check Tables Exist:

```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('bans', 'ban_appeals');
```

Should return 2 tables.

### Check Functions Exist:

```sql
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('is_user_banned', 'expire_temporary_bans', 'ban_user', 'unban_user');
```

Should return 4 functions.

### Test Ban Function:

```sql
-- Get a test user ID (replace with actual user ID)
SELECT id, username FROM users LIMIT 1;

-- Check if user is banned (should be false initially)
SELECT is_user_banned('USER_ID_HERE');
```

---

## **How It Works**

### Ban Types:

1. **Temporary Ban**:
   - Has expiry date (e.g., 7 days, 30 days)
   - Auto-expires when duration ends
   - User regains access automatically

2. **Permanent Ban**:
   - No expiry date
   - Requires manual unban by admin
   - Lasts until explicitly lifted

### Ban Process:

1. **Admin Issues Ban**:
   ```sql
   SELECT ban_user(
     'target_user_id',
     'admin_user_id',
     'Reason for ban',
     'temporary', -- or 'permanent'
     7 -- days (only for temporary)
   );
   ```

2. **System Checks**:
   - Deactivates any existing active bans
   - Creates new ban record
   - Logs to `admin_actions` (transparency)
   - Sets expiry if temporary

3. **User Gets Banned**:
   - `is_active = true`
   - Cannot submit content
   - Can view ban details
   - Can submit appeal

4. **Ban Expires/Unbanned**:
   - Temporary: Auto-expires at `expires_at`
   - Manual: Admin calls `unban_user()`
   - `is_active = false`
   - Logged to audit trail

### Ban Appeals:

1. **User Submits Appeal**:
   - Writes reason for appeal
   - Status: `pending`

2. **Admin Reviews**:
   - Reviews appeal
   - Approves or rejects
   - Provides review reason

3. **If Approved**:
   - Admin unbans user
   - Appeal status: `approved`

4. **If Rejected**:
   - Ban remains active
   - Appeal status: `rejected`
   - User can appeal again later

---

## **Admin Functions**

### Ban a User (Temporary):

```sql
-- Ban for 7 days
SELECT ban_user(
  'user_id_to_ban',
  'admin_id',
  'Repeated policy violations',
  'temporary',
  7 -- days
);
```

### Ban a User (Permanent):

```sql
-- Permanent ban
SELECT ban_user(
  'user_id_to_ban',
  'admin_id',
  'Severe violation: hate speech',
  'permanent',
  NULL -- no duration for permanent
);
```

### Unban a User:

```sql
SELECT unban_user(
  'user_id_to_unban',
  'admin_id',
  'Appeal approved - user apologized and understands policy'
);
```

### Check if User is Banned:

```sql
SELECT is_user_banned('user_id_here');
```

### Get All Active Bans:

```sql
SELECT
  b.id,
  u.username,
  b.reason,
  b.ban_type,
  b.banned_at,
  b.expires_at,
  admin.username as banned_by
FROM bans b
JOIN users u ON b.user_id = u.id
JOIN users admin ON b.banned_by = admin.id
WHERE b.is_active = true
ORDER BY b.banned_at DESC;
```

### Get User's Ban History:

```sql
SELECT
  b.reason,
  b.ban_type,
  b.banned_at,
  b.expires_at,
  b.is_active,
  b.unbanned_at,
  b.unban_reason,
  admin.username as banned_by,
  unban_admin.username as unbanned_by
FROM bans b
JOIN users admin ON b.banned_by = admin.id
LEFT JOIN users unban_admin ON b.unbanned_by = unban_admin.id
WHERE b.user_id = 'user_id_here'
ORDER BY b.banned_at DESC;
```

### Expire Old Temporary Bans (Run Periodically):

```sql
-- This should be run as a cron job or scheduled task
SELECT expire_temporary_bans();
```

### Get Pending Ban Appeals:

```sql
SELECT
  ba.id,
  u.username,
  ba.appeal_reason,
  b.reason as ban_reason,
  b.ban_type,
  ba.created_at
FROM ban_appeals ba
JOIN users u ON ba.user_id = u.id
JOIN bans b ON ba.ban_id = b.id
WHERE ba.status = 'pending'
ORDER BY ba.created_at ASC;
```

---

## **Example Scenarios**

### **Alice: Spam Warning (7 Day Ban)**:

```sql
-- Admin bans Alice for 7 days
SELECT ban_user(
  'alice_user_id',
  'moderator_id',
  'Posting spam content repeatedly after warning',
  'temporary',
  7
);

-- Check ban status
SELECT is_user_banned('alice_user_id');
-- Returns: true

-- After 7 days (automatic):
SELECT expire_temporary_bans();
-- Alice's ban is_active = false
-- She can now post again
```

### **Bob: Hate Speech (Permanent Ban)**:

```sql
-- Admin permanently bans Bob
SELECT ban_user(
  'bob_user_id',
  'admin_id',
  'Severe violation: hate speech targeting protected group',
  'permanent',
  NULL
);

-- Bob submits appeal
INSERT INTO ban_appeals (ban_id, user_id, appeal_reason)
VALUES (
  'bobs_ban_id',
  'bob_user_id',
  'I apologize for my behavior. I understand the harm caused and will follow community guidelines.'
);

-- Admin reviews and rejects
UPDATE ban_appeals
SET
  status = 'rejected',
  reviewed_by = 'admin_id',
  review_reason = 'Violation too severe. Multiple previous warnings ignored.',
  reviewed_at = CURRENT_TIMESTAMP
WHERE id = 'appeal_id';

-- Ban remains active
```

### **Carol: False Report (Appeal Approved)**:

```sql
-- Carol was wrongly banned
SELECT ban_user(
  'carol_user_id',
  'moderator_id',
  'Suspected vote manipulation',
  'temporary',
  30
);

-- Carol appeals
INSERT INTO ban_appeals (ban_id, user_id, appeal_reason)
VALUES (
  'carols_ban_id',
  'carol_user_id',
  'I believe this ban was issued in error. I have never engaged in vote manipulation. My voting pattern is normal.'
);

-- Admin investigates and approves appeal
UPDATE ban_appeals
SET
  status = 'approved',
  reviewed_by = 'admin_id',
  review_reason = 'Investigation shows ban was issued in error. No evidence of manipulation.',
  reviewed_at = CURRENT_TIMESTAMP
WHERE id = 'appeal_id';

-- Admin unbans Carol
SELECT unban_user(
  'carol_user_id',
  'admin_id',
  'Ban appeal approved - issued in error after investigation'
);

-- Carol is now unbanned
```

---

## **Ban Durations (Suggested)**

- **Warning**: 1-3 days
- **Minor Violation**: 7 days
- **Repeated Violations**: 30 days
- **Severe Violation**: 90 days or permanent
- **Permanent**: No expiry (hate speech, doxxing, fraud)

---

## **Security Features**

✅ **Permission Checks**: Only admins level 2+ can ban/unban
✅ **Audit Trail**: All bans logged to `admin_actions`
✅ **User Appeals**: Banned users can appeal
✅ **Auto-Expiry**: Temporary bans expire automatically
✅ **Ban History**: Complete history maintained
✅ **RLS Policies**: Users can only view their own bans
✅ **Constraint Checks**: Validates ban durations and types

---

## **Frontend Integration**

After running this migration, you'll be able to:

1. **Admin UI**: Manage bans at `/admin/bans`
2. **User Profile**: Show ban status on profiles
3. **Content Submission**: Block banned users from submitting
4. **Ban Appeals**: Users can appeal bans
5. **Transparency**: All bans visible in audit log

---

## **TL;DR**

1. Run `011_ban_management_system.sql` ✅
2. Verify tables and functions exist ✅
3. Test ban/unban functions ✅
4. Admins can now ban users (temporary/permanent) ✅
5. Users can appeal bans ✅
6. All actions logged for transparency ✅

**Next**: Build admin UI at `/admin/bans` 🚀
