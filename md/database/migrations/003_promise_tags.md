# 003_promise_tags.sql

## Overview
Implements a tagging system for categorizing political promises. Allows promises to be tagged with multiple categories like Economy, Healthcare, Education, etc.

## Tables Created

### `promise_tags`
Stores available tag definitions.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | VARCHAR(50) | Display name (e.g., "Economy") |
| slug | VARCHAR(50) | URL-safe identifier (e.g., "economy") |
| description | TEXT | What this tag covers |
| color | VARCHAR(7) | Hex color code (default: #3B82F6) |
| icon | VARCHAR(50) | Lucide icon name (default: "Tag") |
| created_at | TIMESTAMP | Creation time |
| updated_at | TIMESTAMP | Last update time |

### `promise_tag_mappings`
Junction table linking promises to their tags (many-to-many).

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| promise_id | UUID | FK to promises(id), CASCADE delete |
| tag_id | UUID | FK to promise_tags(id), CASCADE delete |
| created_at | TIMESTAMP | When tag was assigned |

**Constraints:**
- UNIQUE(promise_id, tag_id) - Prevents duplicate tag assignments

## Indexes
- `idx_promise_tag_mappings_promise_id` - Fast lookup by promise
- `idx_promise_tag_mappings_tag_id` - Fast lookup by tag
- `idx_promise_tags_slug` - Fast lookup by slug for URLs

## Row Level Security

| Table | Operation | Policy |
|-------|-----------|--------|
| promise_tags | SELECT | Public - everyone can view |
| promise_tag_mappings | SELECT | Public - everyone can view |
| promise_tag_mappings | INSERT | Authenticated users only |
| promise_tag_mappings | DELETE | Only promise owner can remove tags |

## Seeded Tags

| Name | Slug | Color | Icon | Description |
|------|------|-------|------|-------------|
| Economy | economy | #10B981 | TrendingUp | Economic policies, GDP, employment, taxation |
| Healthcare | healthcare | #EF4444 | Heart | Medical facilities, insurance, public health |
| Education | education | #3B82F6 | GraduationCap | Schools, universities, literacy programs |
| Infrastructure | infrastructure | #F59E0B | Building | Roads, bridges, railways, airports |
| Security | security | #8B5CF6 | Shield | National defense, law enforcement |
| Environment | environment | #22C55E | Leaf | Climate change, pollution, conservation |
| Agriculture | agriculture | #84CC16 | Tractor | Farming, subsidies, rural development |
| Technology | technology | #06B6D4 | Cpu | Digital India, IT sector, innovation |
| Social Welfare | social-welfare | #EC4899 | Users | Poverty alleviation, welfare schemes |
| Governance | governance | #6366F1 | Scale | Transparency, corruption, bureaucracy |
| Energy | energy | #F97316 | Zap | Power supply, renewable energy, fuel |
| Transportation | transportation | #14B8A6 | Train | Metro, buses, public transit |

## Triggers

### `promise_tags_updated_at`
- **Function:** `update_promise_tags_updated_at()`
- **Events:** BEFORE UPDATE
- **Action:** Sets `updated_at` to current timestamp

## Usage Examples

```sql
-- Add a tag to a promise
INSERT INTO promise_tag_mappings (promise_id, tag_id)
SELECT 'promise-uuid', id FROM promise_tags WHERE slug = 'economy';

-- Get all tags for a promise
SELECT pt.* FROM promise_tags pt
JOIN promise_tag_mappings ptm ON pt.id = ptm.tag_id
WHERE ptm.promise_id = 'promise-uuid';

-- Get all promises with a specific tag
SELECT p.* FROM promises p
JOIN promise_tag_mappings ptm ON p.id = ptm.promise_id
JOIN promise_tags pt ON ptm.tag_id = pt.id
WHERE pt.slug = 'healthcare';

-- Count promises per tag
SELECT pt.name, COUNT(ptm.promise_id) as promise_count
FROM promise_tags pt
LEFT JOIN promise_tag_mappings ptm ON pt.id = ptm.tag_id
GROUP BY pt.id, pt.name
ORDER BY promise_count DESC;
```

## Frontend Integration
- Icons use Lucide React icon names
- Colors are Tailwind-compatible hex codes
- Slugs enable SEO-friendly URLs like `/promises?tag=healthcare`
