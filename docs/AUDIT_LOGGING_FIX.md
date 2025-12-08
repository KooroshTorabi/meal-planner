# Audit Logging Fix - Meal Order Updates

## Problem Identified
Meal order updates and deletions were not being properly logged to audit logs.

## Root Cause
The `logDataModification` function calls had incorrect parameter order. The function signature in `/lib/audit.ts` expects parameters in this order:

```typescript
logDataModification(
  payload: Payload,
  action: 'data_create' | 'data_update' | 'data_delete',
  resource: string,        // ← Collection name
  resourceId: string,      // ← Document ID
  userId: string,          // ← User ID
  email: string,           // ← User email
  request?: NextRequest | Request,
  details?: Record<string, any>
)
```

But the calls were passing parameters in a different order.

## Solution Implemented

### 1. Fixed Update Logging (Lines 320-344)
```typescript
// Corrected parameter order for update operations
await logDataModification(
  req.payload,
  action,                              // data_create or data_update
  'meal-orders',                       // resource (collection name)
  String(doc.id),                      // resourceId (document ID)
  String(req.user.id),                 // userId
  req.user.email || 'unknown',         // email
  undefined,                           // request (optional)
  {                                    // details (optional metadata)
    mealType: doc.mealType,
    status: doc.status,
    urgent: doc.urgent,
    resident: doc.resident,
    date: doc.date,
  }
)
```

### 2. Added Delete Logging (Lines 352-365)
Added new `afterDelete` hook to log meal order deletions:

```typescript
afterDelete: [
  async ({ req, id }) => {
    if (req.user) {
      try {
        await logDataModification(
          req.payload,
          'data_delete',
          'meal-orders',
          String(id),
          String(req.user.id),
          req.user.email || 'unknown',
          undefined,
          { deletedAt: new Date().toISOString() }
        )
      } catch (error) {
        console.error('Failed to log meal order deletion:', error)
      }
    }
    
    // Invalidate caches after deletion
    const { invalidateMealOrders } = await import('../lib/cache')
    invalidateMealOrders()
  },
]
```

### 3. Added Error Handling
Wrapped all audit logging calls in try-catch blocks to prevent request failures if logging fails:
- Errors are logged to console
- Requests continue normally even if audit logging fails
- This ensures availability isn't impacted by audit system issues

## Changes Made

**File**: `/collections/MealOrders.ts`

1. **Update Logging** (afterChange hook, line 320):
   - Fixed parameter order for `logDataModification` calls
   - Added metadata details (mealType, status, urgent, resident, date)
   - Added try-catch error handling

2. **Delete Logging** (new afterDelete hook, line 352):
   - Logs all meal order deletions
   - Records deletion timestamp
   - Invalidates related caches

## Testing

To verify the logging is working:

1. **Create a meal order** - Check audit logs for `data_create` action
2. **Update a meal order** - Check audit logs for `data_update` action
3. **Delete a meal order** - Check audit logs for `data_delete` action

All audit entries should include:
- Correct action type (create/update/delete)
- User ID and email
- Meal order details (mealType, status, urgent, resident, date)
- Timestamp

## Database Query to Verify

```sql
SELECT 
  action, 
  "userId", 
  email, 
  resource, 
  "resourceId", 
  details, 
  "createdAt"
FROM "audit_logs"
WHERE resource = 'meal-orders'
ORDER BY "createdAt" DESC
LIMIT 20;
```

Expected results:
- Multiple `data_create` entries when caregivers create orders
- Multiple `data_update` entries when kitchen updates status
- `data_delete` entries when admins delete orders
- Each with complete metadata in `details` field

## Impact

✅ **Before**: Meal order updates not logged  
✅ **After**: All CRUD operations on meal orders now properly logged to audit trail

This ensures:
- Compliance with audit trail requirements
- Ability to track who changed what and when
- Investigation capabilities for issues or disputes
- Complete history of meal order lifecycle
