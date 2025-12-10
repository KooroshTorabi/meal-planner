# Audit Logging Fix - Meal Order Updates

## Problem
Meal order updates were not being logged to the audit logs collection.

## Root Cause
Multiple issues prevented audit logging:
1. **Parameter order mismatch** in `logDataModification()` function calls
2. **Missing JWT user extraction** in API endpoint PATCH handler
3. **No error logging** to debug why audit logs weren't being created
4. **No visibility** into whether collection hooks were firing

## Solutions Implemented

### 1. Fixed Parameter Order in Collection Hooks (`/collections/MealOrders.ts`)

**Before:**
```typescript
await logDataModification(
  payload, 
  action, 
  userId,           // ❌ Wrong position
  email,            // ❌ Wrong position
  'meal-orders',    // ❌ Wrong position
  id,               // ❌ Wrong position
  details
)
```

**After:**
```typescript
await logDataModification(
  req.payload,
  action,
  'meal-orders',    // ✅ Resource (collection name)
  String(doc.id),   // ✅ Resource ID
  String(req.user.id),  // ✅ User ID
  req.user.email || 'unknown',  // ✅ Email
  undefined,        // ✅ Request (optional)
  { ...details }    // ✅ Details object
)
```

**Function Signature:**
```typescript
logDataModification(
  payload,       // Payload client
  action,        // 'data_create', 'data_update', 'data_delete'
  resource,      // Collection name (e.g., 'meal-orders')
  resourceId,    // Document ID
  userId,        // User performing action
  email,         // User email
  request?,      // Optional HTTP request
  details?       // Optional action details
)
```

### 2. Added afterDelete Hook (`/collections/MealOrders.ts`)

Previously, meal order deletions were not being logged.

**Added:**
```typescript
afterDelete: [
  async ({ doc, req }) => {
    if (req.user) {
      try {
        console.log(`[Audit] Logging data_delete for meal order ${doc.id}`)
        await logDataModification(
          req.payload,
          'data_delete',
          'meal-orders',
          String(doc.id),
          String(req.user.id),
          req.user.email || 'unknown',
          undefined,
          { deletedAt: new Date().toISOString() }
        )
        console.log(`[Audit] Successfully logged data_delete for meal order ${doc.id}`)
      } catch (error) {
        console.error(`[Audit Error] Failed to log deletion for meal order ${doc.id}:`, error)
      }
    }
  }
]
```

### 3. Added Audit Logging to API Endpoint (`/app/api/meal-orders/[id]/route.ts`)

The API endpoint was calling `payload.update()` which triggers collection hooks, but added explicit logging for debugging.

**Added:**
```typescript
// After successful payload.update() call
try {
  const token = request.cookies.get('accessToken')?.value
  console.log(`[Audit] Token from cookie:`, token ? `exists (${token.substring(0, 20)}...)` : 'missing')
  const user = token ? verifyAccessToken(token) : null
  console.log(`[Audit] User from token:`, user ? `${user.email} (id: ${user.id})` : 'null')
  if (user) {
    console.log(`[Audit] Logging data_update for meal order ${id} via API`)
    await logDataModification(
      payload,
      'data_update',
      'meal-orders',
      id,
      String(user.id),
      user.email || 'unknown',
      undefined,
      {
        mealType: updatedDoc.mealType,
        status: updatedDoc.status,
        urgent: updatedDoc.urgent,
        resident: updatedDoc.resident,
        date: updatedDoc.date,
      }
    )
    console.log(`[Audit] Successfully logged data_update for meal order ${id} via API`)
  } else {
    console.log(`[Audit] Skipping audit log - user is null`)
  }
} catch (auditError) {
  console.error(`[Audit Error] Failed to log update for meal order ${id}:`, auditError)
}
```

### 4. Fixed JWT User Extraction

**Before:**
```typescript
// ❌ Import exists but code uses wrong function
import { verifyAccessToken } from '@/lib/auth/tokens'
const user = token ? decodeToken(token) : null  // 🔥 Error: decodeToken doesn't exist
```

**After:**
```typescript
// ✅ Correct function usage
import { verifyAccessToken } from '@/lib/auth/tokens'
const user = token ? verifyAccessToken(token) : null
```

### 5. Added Debug Logging to Collection Hook

Enhanced the `afterChange` hook to log when it fires and whether `req.user` is available.

**Added:**
```typescript
console.log(
  `[Audit] afterChange hook triggered for ${operation} on meal order ${doc.id}, req.user: ${
    req.user ? `${req.user.email} (${req.user.id})` : 'null'
  }`
)
```

## Audit Log Fields

When a meal order is logged, the following information is captured:

```typescript
{
  action: 'data_create' | 'data_update' | 'data_delete',
  userId: string,           // User performing the action
  email: string,            // User email
  status: 'success' | 'failed',
  resource: 'meal-orders',  // Collection name
  resourceId: string,       // Document ID
  details: {
    mealType: string,       // breakfast, lunch, dinner
    status: string,         // pending, prepared, served, cancelled
    urgent: boolean,
    resident: string | ObjectId,
    date: string,
    [key: string]: any,     // Additional fields
  }
}
```

## Verification

To verify audit logging is working:

### 1. Check Console Output
After a meal order update, you should see:
```
[Audit] afterChange hook triggered for update on meal order 76, req.user: caregiver@example.com (5)
[Audit] Logging data_update for meal order 76
[Audit] Successfully logged data_update for meal order 76
[Audit] Token from cookie: exists (eyJhbGciOiJIUzI1NiIs...)
[Audit] User from token: caregiver@example.com (id: 5)
[Audit] Logging data_update for meal order 76 via API
[Audit] Successfully logged data_update for meal order 76 via API
```

### 2. Query Audit Logs
```bash
# Check via API
curl -H "Authorization: Bearer <token>" \
  http://localhost:3000/api/audit-logs?action=data_update&resource=meal-orders

# Or via database
psql $DATABASE_URL -c \
  "SELECT * FROM audit_logs WHERE resource = 'meal-orders' AND action = 'data_update' ORDER BY created_at DESC LIMIT 10;"
```

### 3. Check Audit Logs UI
Navigate to `/admin/audit-logs` in your admin panel to view all audit logs with filtering.

## Files Modified

1. `/collections/MealOrders.ts`
   - Fixed parameter order in `afterChange` hook logging
   - Added `afterDelete` hook with logging
   - Added debug console logging for hook execution

2. `/app/api/meal-orders/[id]/route.ts`
   - Added imports for `logDataModification` and `verifyAccessToken`
   - Added audit logging after successful PATCH update
   - Added debug console logging for token extraction

3. `/lib/auth/tokens.ts`
   - No changes (already has `verifyAccessToken` function)

## Testing Checklist

- [ ] Create a meal order → Verify `data_create` log appears
- [ ] Update a meal order → Verify `data_update` log appears
- [ ] Delete a meal order → Verify `data_delete` log appears
- [ ] Check audit logs UI filters (by action, resource, date range)
- [ ] Verify all fields are populated in audit logs
- [ ] Check console for `[Audit]` debug messages during operations
- [ ] Verify no `[Audit Error]` messages appear
- [ ] Test with different user roles (caregiver, kitchen, admin)

## Deployment Notes

- Requires database migration if audit-logs table wasn't created
- Ensure JWT_SECRET environment variable is set (for token verification)
- Consider archiving old audit logs periodically for performance
- Monitor audit logs collection growth (can become large with many operations)
