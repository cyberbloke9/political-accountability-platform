# searchPromises.ts

## Overview

The `searchPromises.ts` file provides advanced search and filtering functionality for political promises within the platform. It offers a comprehensive search API that supports text-based queries, multi-faceted filtering (by status, party, tags, and date ranges), sorting options, and pagination.

This module is central to the promise discovery feature, enabling users to find and filter through political promises based on various criteria.

## Dependencies

| Module | Purpose |
|--------|---------|
| `./supabase` | Provides the Supabase client instance for database queries |

## Interfaces

### `SearchFilters`

Defines the available search and filter parameters for querying promises.

```typescript
interface SearchFilters {
  query?: string                                    // Text search term
  status?: string[]                                 // Array of status values to filter by
  party?: string[]                                  // Array of political parties to filter by
  tags?: string[]                                   // Array of tag slugs to filter by
  dateFrom?: string                                 // Start date for date range filter (ISO string)
  dateTo?: string                                   // End date for date range filter (ISO string)
  sortBy?: 'newest' | 'oldest' | 'most_verified' | 'trending'  // Sort order
  page?: number                                     // Current page number (1-indexed)
  pageSize?: number                                 // Number of results per page
}
```

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `query` | `string` | `''` | Text to search in politician name, promise text, or party |
| `status` | `string[]` | `[]` | Filter by promise status (e.g., 'pending', 'verified', 'broken') |
| `party` | `string[]` | `[]` | Filter by political party names |
| `tags` | `string[]` | `[]` | Filter by tag slugs |
| `dateFrom` | `string` | `undefined` | ISO date string for start of date range |
| `dateTo` | `string` | `undefined` | ISO date string for end of date range |
| `sortBy` | `string` | `'newest'` | Sorting strategy |
| `page` | `number` | `1` | Page number for pagination |
| `pageSize` | `number` | `12` | Number of results per page |

### `SearchResult`

Represents the paginated search results returned by the search function.

```typescript
interface SearchResult {
  promises: any[]      // Array of promise objects with tags
  total: number        // Total count of matching promises
  page: number         // Current page number
  pageSize: number     // Number of results per page
  totalPages: number   // Total number of pages
}
```

## Exported Functions

### `searchPromises(filters?: SearchFilters): Promise<SearchResult>`

Main search function that queries promises with full filtering, sorting, and pagination support.

#### Parameters

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `filters` | `SearchFilters` | `{}` | Optional object containing search and filter criteria |

#### Return Type

`Promise<SearchResult>` - Paginated search results with metadata.

#### Query Logic

1. **Base Query**: Selects all promise fields plus associated tags through the `promise_tag_mappings` junction table
2. **Text Search**: Uses PostgreSQL `ilike` for case-insensitive partial matching across:
   - `politician_name`
   - `promise_text`
   - `party`
3. **Status Filter**: Uses `in` clause to match any of the provided statuses
4. **Party Filter**: Uses `in` clause to match any of the provided parties
5. **Tag Filter**: Filters by tag slugs through the relationship
6. **Date Range**: Uses `gte` and `lte` operators on `created_at`
7. **Sorting**: Orders by `created_at` with direction based on `sortBy`
8. **Pagination**: Uses `range` clause with calculated offset

#### Error Handling

Throws the Supabase error if the query fails (after logging to console).

---

### `getAllParties(): Promise<string[]>`

Retrieves a list of all unique political party names from existing promises.

#### Parameters

None

#### Return Type

`Promise<string[]>` - Array of unique party names, sorted alphabetically.

#### Query Logic

1. Selects the `party` column from all promises
2. Excludes null values
3. Orders alphabetically
4. Deduplicates using JavaScript `Set`
5. Filters out any remaining falsy values

#### Error Handling

Returns an empty array on error (after logging to console).

---

### `getAllTags(): Promise<PromiseTag[]>`

Retrieves all available promise tags for filtering.

#### Parameters

None

#### Return Type

`Promise<PromiseTag[]>` - Array of tag objects with properties like `id`, `name`, `slug`, `color`, `icon`.

#### Query Logic

1. Selects all columns from `promise_tags` table
2. Orders by `name` alphabetically

#### Error Handling

Returns an empty array on error (after logging to console).

## Usage Examples

### Basic Search

```typescript
import { searchPromises } from '@/lib/searchPromises';

// Simple text search
const results = await searchPromises({
  query: 'healthcare'
});

console.log(`Found ${results.total} promises`);
results.promises.forEach(promise => {
  console.log(promise.promise_text);
});
```

### Filtered Search

```typescript
import { searchPromises } from '@/lib/searchPromises';

// Search with multiple filters
const results = await searchPromises({
  query: 'economy',
  status: ['kept', 'in_progress'],
  party: ['Democratic Party', 'Republican Party'],
  sortBy: 'newest',
  page: 1,
  pageSize: 20
});
```

### Date Range Filter

```typescript
import { searchPromises } from '@/lib/searchPromises';

// Search promises from 2024
const results = await searchPromises({
  dateFrom: '2024-01-01',
  dateTo: '2024-12-31',
  sortBy: 'oldest'
});
```

### Tag-Based Search

```typescript
import { searchPromises } from '@/lib/searchPromises';

// Find promises tagged with specific topics
const results = await searchPromises({
  tags: ['environment', 'climate-change'],
  status: ['pending']
});
```

### Pagination Implementation

```typescript
import { searchPromises } from '@/lib/searchPromises';

async function loadPage(pageNum: number) {
  const results = await searchPromises({
    query: 'education',
    page: pageNum,
    pageSize: 10
  });

  console.log(`Page ${results.page} of ${results.totalPages}`);
  console.log(`Showing ${results.promises.length} of ${results.total} total`);

  return results;
}
```

### Populating Filter Dropdowns

```typescript
import { getAllParties, getAllTags } from '@/lib/searchPromises';

async function initFilters() {
  const [parties, tags] = await Promise.all([
    getAllParties(),
    getAllTags()
  ]);

  // Populate party dropdown
  parties.forEach(party => {
    console.log(`Party option: ${party}`);
  });

  // Populate tag checkboxes
  tags.forEach(tag => {
    console.log(`Tag: ${tag.name} (${tag.slug}) - Color: ${tag.color}`);
  });
}
```

### Complete Search Component Integration

```typescript
import { searchPromises, getAllParties, getAllTags, SearchFilters, SearchResult } from '@/lib/searchPromises';
import { useState, useEffect } from 'react';

function PromiseSearch() {
  const [filters, setFilters] = useState<SearchFilters>({});
  const [results, setResults] = useState<SearchResult | null>(null);
  const [parties, setParties] = useState<string[]>([]);
  const [tags, setTags] = useState<any[]>([]);

  useEffect(() => {
    // Load filter options on mount
    Promise.all([getAllParties(), getAllTags()]).then(([p, t]) => {
      setParties(p);
      setTags(t);
    });
  }, []);

  async function handleSearch() {
    const data = await searchPromises(filters);
    setResults(data);
  }

  return (
    <div>
      <input
        type="text"
        onChange={(e) => setFilters(f => ({ ...f, query: e.target.value }))}
        placeholder="Search promises..."
      />

      <select
        multiple
        onChange={(e) => setFilters(f => ({
          ...f,
          party: Array.from(e.target.selectedOptions, opt => opt.value)
        }))}
      >
        {parties.map(party => (
          <option key={party} value={party}>{party}</option>
        ))}
      </select>

      <button onClick={handleSearch}>Search</button>

      {results && (
        <div>
          <p>Found {results.total} results</p>
          {results.promises.map(promise => (
            <div key={promise.id}>
              <h3>{promise.politician_name}</h3>
              <p>{promise.promise_text}</p>
              <div>
                {promise.tags.map((tag: any) => (
                  <span key={tag.id} style={{ backgroundColor: tag.color }}>
                    {tag.name}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

## Database Schema Notes

This module expects the following database structure:

- **`promises`** table with columns: `id`, `politician_name`, `promise_text`, `party`, `status`, `created_at`
- **`promise_tags`** table with columns: `id`, `name`, `slug`, `color`, `icon`
- **`promise_tag_mappings`** junction table linking promises to tags

## File Location

`C:\Users\Prithvi Putta\Desktop\political-accountability-platform\frontend\src\lib\searchPromises.ts`
