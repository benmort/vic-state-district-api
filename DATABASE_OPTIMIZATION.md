# Database Optimization Indexes

This document describes the database indexes added to optimize lookup performance for the Victorian State District API.

## Indexes Added

### 1. MPs Table (`mps`)
- **`mps_name_idx`**: Index on `name` column
  - Optimizes: MP name lookups and sorting by name
  - Used in: MPs table queries with ORDER BY name

- **`mps_party_idx`**: Index on `party` column  
  - Optimizes: Party-based filtering and grouping
  - Used in: Queries filtering by political party

### 2. Districts Table (`districts`)
- **`districts_name_idx`**: Index on `name` column
  - Optimizes: District name lookups
  - Used in: District name searches and joins

- **`districts_mp_id_idx`**: Index on `mp_id` column
  - Optimizes: Joins between districts and MPs
  - Used in: Finding which MP represents a district

### 3. Postcodes Table (`postcodes`)
- **`postcodes_postcode_number_idx`**: Index on `postcode_number` column
  - Optimizes: Postcode number lookups (primary query pattern)
  - Used in: WHERE clauses filtering by postcode number

### 4. Postcode Districts Junction Table (`postcode_districts`)
- **`postcode_districts_postcode_id_idx`**: Index on `postcode_id` column
  - Optimizes: Joins from postcodes to districts
  - Used in: Finding districts for a given postcode

- **`postcode_districts_district_id_idx`**: Index on `district_id` column
  - Optimizes: Joins from districts to postcodes
  - Used in: Finding postcodes for a given district

## Query Optimization Impact

### Primary Lookup Query (Postcode → District → MP)
```sql
SELECT ... FROM postcodes
LEFT JOIN postcode_districts ON postcodes.id = postcode_districts.postcode_id
LEFT JOIN districts ON postcode_districts.district_id = districts.id  
LEFT JOIN mps ON districts.mp_id = mps.id
WHERE postcodes.postcode_number = ?
```

**Optimized by:**
- `postcodes_postcode_number_idx` - Fast postcode lookup
- `postcode_districts_postcode_id_idx` - Fast junction table join
- `districts_mp_id_idx` - Fast MP lookup

### MPs Directory Query (MP → District → Postcodes)
```sql
SELECT ... FROM mps
LEFT JOIN districts ON mps.id = districts.mp_id
LEFT JOIN postcode_districts ON districts.id = postcode_districts.district_id
LEFT JOIN postcodes ON postcode_districts.postcode_id = postcodes.id
ORDER BY mps.name
```

**Optimized by:**
- `mps_name_idx` - Fast sorting by MP name
- `districts_mp_id_idx` - Fast district lookup
- `postcode_districts_district_id_idx` - Fast postcode lookup

## Performance Benefits

1. **Faster Postcode Lookups**: Primary use case now uses index instead of table scan
2. **Improved Join Performance**: All foreign key relationships are indexed
3. **Better Sorting**: MP name sorting is now indexed
4. **Efficient Filtering**: Party-based filtering uses index
5. **Scalability**: Performance remains consistent as data grows

## Migration Applied

- **Migration File**: `drizzle/0003_parched_domino.sql`
- **Status**: ✅ Applied to production database
- **Indexes Created**: 7 indexes across 4 tables

## Monitoring

Consider monitoring these metrics to validate optimization:
- Query execution time for postcode lookups
- Database CPU usage during high-traffic periods
- Index usage statistics in PostgreSQL
