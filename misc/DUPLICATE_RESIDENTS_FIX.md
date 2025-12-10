# Duplicate Residents Fix

## Problem
Duplicate residents appear in the resident list because the seed script was run multiple times without a unique constraint on the `roomNumber` field.

## Solution

### 1. Added Unique Constraint
Added `unique: true` to the `roomNumber` field in `collections/Residents.ts` to prevent future duplicates.

```typescript
{
  name: 'roomNumber',
  type: 'text',
  required: true,
  unique: true,  // ← Added this
  admin: {
    description: 'Room number where the resident stays',
  },
}
```

### 2. Created Cleanup Script
Created `scripts/remove-duplicate-residents.ts` that:
- Fetches all residents from the database
- Groups them by room number
- Keeps the most recently created resident for each room
- Deletes all older duplicates

## How to Remove Existing Duplicates

Run the cleanup script:

```bash
npm run remove-duplicates
```

This will:
1. Find all residents with duplicate room numbers
2. Keep the most recent one for each room
3. Delete the older duplicates
4. Show a summary of what was removed

## Example Output

```
Found 24 residents

Found 2 residents in room 101:
  ✓ Keeping: Maria Schmidt (ID: abc123, Created: 2025-12-05T10:30:00Z)
  ✗ Deleting: Maria Schmidt (ID: def456, Created: 2025-12-04T09:15:00Z)

Found 2 residents in room 102:
  ✓ Keeping: Hans Müller (ID: ghi789, Created: 2025-12-05T10:30:00Z)
  ✗ Deleting: Hans Müller (ID: jkl012, Created: 2025-12-04T09:15:00Z)

✅ Removed 12 duplicate residents
✅ 12 unique rooms remain
```

## Prevention

With the `unique: true` constraint added:
- The database will reject any attempt to create a resident with a duplicate room number
- The seed script will fail gracefully if it tries to create duplicates
- Manual creation through the UI will show an error if room number already exists

## Alternative: Manual Deletion

If you prefer to delete duplicates manually:

1. Log in as admin (admin@example.com / test)
2. Navigate to `/admin/collections/residents`
3. Sort by room number to see duplicates together
4. Delete the older entries manually

## Files Modified

- `collections/Residents.ts` - Added unique constraint to roomNumber
- `scripts/remove-duplicate-residents.ts` - New cleanup script
- `package.json` - Added `remove-duplicates` script command

## Status: FIXED ✅

The duplicate residents issue has been resolved:

1. ✅ Added unique constraint to `roomNumber` field
2. ✅ Updated seed script to check for existing residents before creating
3. ✅ Database verified - 12 unique residents, no duplicates
4. ✅ Cleanup script updated to reassign meal orders before deletion

## If You Still See Duplicates in UI

If you're still seeing duplicates in the user interface:

1. **Hard refresh the page**: Press `Ctrl+Shift+R` (or `Cmd+Shift+R` on Mac)
2. **Clear browser cache**: The UI might be caching old data
3. **Restart the dev server**: Stop and restart `npm run dev`

## Notes

- The script keeps the **most recent** resident for each room number
- Meal orders are automatically reassigned to the kept resident before deletion
- The unique constraint prevents future duplicates from being created
- The seed script now checks for existing residents before creating new ones
