# 018_politicians_table.sql

## Overview
Creates a dedicated politicians table for profile pages, enabling detailed leader profiles with biography, social links, and aggregated promise statistics.

## Table: `politicians`

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | VARCHAR(200) | Full name |
| slug | VARCHAR(200) | URL-friendly identifier (unique) |
| party | VARCHAR(100) | Political party |
| position | VARCHAR(200) | Current/recent position (PM, CM, etc.) |
| state | VARCHAR(100) | State/region |
| constituency | VARCHAR(200) | Electoral constituency |
| bio | TEXT | Biography |
| image_url | TEXT | Profile photo URL |
| twitter_handle | VARCHAR(100) | Twitter username |
| wikipedia_url | TEXT | Wikipedia page link |
| official_website | TEXT | Official website URL |
| date_of_birth | DATE | Birth date |
| is_active | BOOLEAN | Currently active in politics? |
| created_at | TIMESTAMP | Record creation |
| updated_at | TIMESTAMP | Last update |

## Schema Changes

### New Column on `promises`
```sql
politician_id UUID REFERENCES politicians(id) ON DELETE SET NULL
```
Links promises to politician profiles.

## View: `politician_stats`
Aggregated statistics per politician.

| Column | Description |
|--------|-------------|
| politician_name | Name of politician |
| total_promises | All promises |
| fulfilled_count | Fulfilled promises |
| broken_count | Broken promises |
| in_progress_count | In progress |
| pending_count | Pending |
| stalled_count | Stalled |
| fulfillment_rate | % fulfilled (of resolved) |
| latest_promise_date | Most recent promise |
| politician_id | ID (if exists) |
| slug | URL slug |
| party | Political party |
| position | Position |
| state | State |
| image_url | Photo URL |

## Functions

### `generate_politician_slug(politician_name TEXT)`
Creates URL-friendly slug from name.

**Example:**
```sql
SELECT generate_politician_slug('Narendra Modi');
-- Returns: 'narendra-modi'
```

### `auto_create_politician()` (Trigger)
Automatically creates politician record when promise is submitted.

**Fires:** BEFORE INSERT on promises

**Logic:**
1. Check if politician exists (by name, case-insensitive)
2. If exists → link promise to politician
3. If not → create politician with name, slug, party

## Auto-Population

Migration automatically:
1. Creates politician records from existing promises
2. Links existing promises to politician records

## Row Level Security

| Operation | Policy |
|-----------|--------|
| SELECT | Everyone (public profiles) |
| INSERT/UPDATE/DELETE | Admins only |

## Indexes

- `idx_politicians_name` - Search by name
- `idx_politicians_slug` - Lookup by slug
- `idx_politicians_party` - Filter by party
- `idx_politicians_state` - Filter by state
- `idx_politicians_position` - Filter by position
- `idx_politicians_active` - Active politicians only
- `idx_promises_politician_id` - Promise-politician link

## Usage Examples

```sql
-- Get politician by slug (for profile page)
SELECT * FROM politicians WHERE slug = 'narendra-modi';

-- Get politician stats
SELECT * FROM politician_stats
WHERE politician_name = 'Narendra Modi';

-- Get all politicians with stats
SELECT
  p.name,
  p.party,
  p.position,
  ps.total_promises,
  ps.fulfillment_rate
FROM politicians p
LEFT JOIN politician_stats ps ON p.name = ps.politician_name
ORDER BY ps.total_promises DESC;

-- Get promises for a politician
SELECT * FROM promises
WHERE politician_id = 'politician-uuid'
ORDER BY created_at DESC;

-- Update politician profile (admin)
UPDATE politicians
SET
  position = 'Prime Minister',
  bio = 'The 14th Prime Minister of India...',
  twitter_handle = '@naaborrendamodi'
WHERE slug = 'narendra-modi';

-- Get all BJP politicians
SELECT * FROM politicians
WHERE party ILIKE '%BJP%'
ORDER BY name;

-- Get unique parties for filter
SELECT DISTINCT party FROM politicians
WHERE party IS NOT NULL
ORDER BY party;
```

## Frontend Integration

The `/politicians` page uses this table:
- `/politicians` → List all politicians
- `/politicians/[slug]` → Individual profile page

API functions in `lib/politicians.ts`:
- `getPoliticians()` - List with filters
- `getPoliticianBySlug()` - Get by URL slug
- `getPoliticianStats()` - Get stats from view
- `getAllPoliticianStats()` - Stats for all
- `getPoliticianPromises()` - Promises for politician
- `updatePolitician()` - Admin update
- `getUniqueParties()` - For party filter
- `getUniqueStates()` - For state filter

## Notes

- Slug is auto-generated from name
- Profile data must be added separately (via SQL or admin panel)
- New promises auto-create politician entries
- Stats view joins with promises for real-time data
