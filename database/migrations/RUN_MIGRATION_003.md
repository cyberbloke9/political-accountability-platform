# Running Migration 003: Promise Tags

## Quick Setup (Supabase Dashboard)

1. Go to your Supabase project: https://supabase.com/dashboard/project/avxuugbgewmiccgteghi
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the entire contents of `003_promise_tags.sql`
5. Paste into the SQL editor
6. Click **Run** (or press Ctrl+Enter)

## What This Migration Does

✅ Creates `promise_tags` table with 12 predefined categories
✅ Creates `promise_tag_mappings` junction table
✅ Sets up RLS policies for security
✅ Adds indexes for performance
✅ Seeds initial tags: Economy, Healthcare, Education, Infrastructure, etc.

## Verify Migration Success

Run this query in SQL Editor to check tags were created:

```sql
SELECT name, slug, color, icon FROM promise_tags ORDER BY name;
```

You should see 12 tags listed.

## Next Steps

After running this migration successfully, we'll proceed to Task 2: Building the search API endpoint.
