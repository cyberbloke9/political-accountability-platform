# 012_verification_integrity_hashing.sql

## Overview
Implements cryptographic integrity verification for verifications using SHA-256 hashing. Ensures that verification evidence cannot be tampered with after submission - any modification to the original data will result in hash mismatch.

## Schema Changes

### New Column on `verifications`
```sql
verification_hash VARCHAR(64)
```
Stores the SHA-256 hash (64 hex characters) of the verification data.

### New Index
```sql
idx_verifications_hash ON verifications(verification_hash)
```
Enables fast lookup by hash.

## Hash Generation

### `generate_verification_hash(...)`
**Returns:** VARCHAR(64) (hex-encoded SHA-256 hash)

**Parameters:**
- `p_evidence_text` (TEXT) - Evidence description
- `p_evidence_urls` (TEXT[]) - Array of source URLs
- `p_verdict` (VARCHAR) - Verdict claim
- `p_submitted_by` (UUID) - User who submitted
- `p_promise_id` (UUID) - Related promise
- `p_created_at` (TIMESTAMP) - Submission timestamp

**Algorithm:**
```
hash_input = evidence_text | evidence_urls | verdict | submitted_by | promise_id | created_at
                    ↓
            SHA-256(hash_input)
                    ↓
            hex encode → 64 character string
```

**Example Input String:**
```
This promise was fulfilled because...|https://source1.com,https://source2.com|fulfilled|550e8400-e29b-41d4-a716-446655440000|660e8400-e29b-41d4-a716-446655440001|2025-01-15 10:30:00+00
```

**Example Output:**
```
a7f5b2c8d9e0f1234567890abcdef1234567890abcdef1234567890abcdef12
```

## Hash Verification

### `verify_verification_hash(verification_id UUID)`
**Returns:** BOOLEAN

Checks if a verification's current data matches its stored hash.

**Logic:**
1. Fetch verification record by ID
2. Recalculate hash from current field values
3. Compare calculated hash with stored `verification_hash`
4. Return TRUE if match, FALSE if mismatch or not found

**Use Cases:**
- Audit checks for tampering
- Trust indicators in UI
- Compliance/legal verification

## Automatic Hash Generation

### Trigger: `trigger_verification_hash_generation`
**On:** verifications
**Event:** BEFORE INSERT
**Action:** Automatically generates and sets `verification_hash`

```sql
NEW.verification_hash := generate_verification_hash(
  NEW.evidence_text,
  NEW.evidence_urls,
  NEW.verdict,
  NEW.submitted_by,
  NEW.promise_id,
  NEW.created_at
);
```

## Backfill Existing Data

The migration automatically hashes all existing verifications:

```sql
UPDATE verifications
SET verification_hash = generate_verification_hash(
  evidence_text,
  evidence_urls,
  verdict,
  submitted_by,
  promise_id,
  created_at
)
WHERE verification_hash IS NULL;
```

## Security Properties

### What's Protected
| Field | Protected | Reason |
|-------|-----------|--------|
| evidence_text | ✅ | Core evidence content |
| evidence_urls | ✅ | Source references |
| verdict | ✅ | Claim being made |
| submitted_by | ✅ | Attribution |
| promise_id | ✅ | Context |
| created_at | ✅ | Timestamp authenticity |

### What's NOT in Hash
| Field | Reason |
|-------|--------|
| status | Changes during review process |
| upvotes/downvotes | Dynamic community interaction |
| updated_at | Expected to change |

## Usage Examples

```sql
-- Verify a specific verification's integrity
SELECT verify_verification_hash('verification-uuid');
-- Returns TRUE if unchanged, FALSE if tampered

-- Find potentially tampered verifications
SELECT
  v.id,
  u.username,
  v.created_at,
  verify_verification_hash(v.id) as integrity_valid
FROM verifications v
JOIN users u ON v.submitted_by = u.id
WHERE NOT verify_verification_hash(v.id);

-- Get hash for a verification
SELECT verification_hash FROM verifications WHERE id = 'verification-uuid';

-- Manually recalculate (for debugging)
SELECT generate_verification_hash(
  v.evidence_text,
  v.evidence_urls,
  v.verdict,
  v.submitted_by,
  v.promise_id,
  v.created_at
) as calculated_hash,
v.verification_hash as stored_hash
FROM verifications v
WHERE v.id = 'verification-uuid';

-- Count hashed vs unhashed verifications
SELECT
  COUNT(*) as total,
  COUNT(verification_hash) as hashed,
  COUNT(*) - COUNT(verification_hash) as unhashed
FROM verifications;
```

## Dependency
Requires **pgcrypto** extension for `digest()` function:
```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```

## Limitations

1. **Not Encryption**: Hash doesn't hide data, only verifies integrity
2. **One-Way**: Cannot recover original data from hash
3. **Database Trust**: Assumes database administrators are trusted
4. **Timestamp Dependency**: Hash includes `created_at` which is set by system

## Frontend Integration

```typescript
// Check verification integrity
const { data: isValid } = await supabase
  .rpc('verify_verification_hash', { verification_id: id });

// Show integrity badge
if (isValid) {
  showBadge("Verified Authentic ✓");
} else {
  showWarning("Data integrity check failed!");
}
```

## Audit Use Cases

1. **Legal Evidence**: Prove evidence hasn't changed since submission
2. **Dispute Resolution**: Verify original submission content
3. **Trust Building**: Show users data is tamper-proof
4. **Compliance**: Meet data integrity requirements
