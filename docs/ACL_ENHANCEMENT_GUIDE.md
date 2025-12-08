✅ Enhancement Levels:
Level 1: Owner-Based - Users can only modify their own resources
Level 2: Status-Based - Permissions depend on resource status
Level 3: Time-Based (ABAC) - Access depends on time/date context
Level 4: Full ACL - Complete fine-grained access control
✅ Practical Implementation Path:
Phase 1: Owner-Based (1-2 hours) - Quick wins
Phase 2: Status-Based (2-3 hours) - Workflow control
Phase 3: Time-Based (2-3 hours) - Context-aware
Phase 4: Full ACL (1-2 days) - Complete system
✅ Code Examples:
Enhanced RBAC with context function
API endpoint integration
UI component usage
Testing checklist
✅ Benefits:
Better security (ownership tracking)
Data integrity (status-based restrictions)
Performance (time-based filtering)
Compliance (audit trails)





# ACL Enhancement Guide: From RBAC to Fine-Grained Access Control

## Overview

Your current system uses **Role-Based Access Control (RBAC)**, which provides good access control based on user roles (admin, caregiver, kitchen). This guide explains how to enhance it with **Access Control Lists (ACL)** and **Attribute-Based Access Control (ABAC)** for more fine-grained permissions.

## Current RBAC System

**Location**: `/lib/policies/rbac.ts`

**How it works**:
- Permissions are assigned to roles
- A user inherits all permissions of their role
- Simple check: "Does this role have access to this resource type?"

**Example**:
```typescript
'meal.update': ['admin', 'kitchen']  // Only admin and kitchen can update meals
```

**Limitations**:
- No resource-level control (who created it, when, status)
- No context-aware rules (time of day, user status)
- No owner-based permissions (can only edit your own items)

## Enhancement Levels

### Level 1: Owner-Based Permissions (Quick Win)

**What**: Users can only modify resources they created

**Example Use Cases**:
- Caregivers can only edit their own meal orders
- Kitchen can't modify orders, only update status
- Users can update their own profile only

**Implementation**:
```typescript
// Add to meal order check in API
if (user.role === 'caregiver') {
  const order = await payload.findByID({ collection: 'meal-orders', id })
  if (order.createdBy !== user.id) {
    return res.status(403).json({ message: 'Can only edit your own orders' })
  }
}
```

**Files to modify**:
- `/app/api/meal-orders/[id]/route.ts` - Add ownership check
- `/app/api/users/[id]/route.ts` - Add self-update check

### Level 2: Status-Based Permissions

**What**: Permissions depend on resource status

**Example Use Cases**:
- Caregivers can only edit "pending" orders
- Kitchen can't edit "completed" orders
- Admins can edit any status

**Implementation**:
```typescript
// In meal order update endpoint
if (user.role === 'caregiver' && order.status !== 'pending') {
  return res.status(403).json({ 
    message: 'Can only edit pending orders' 
  })
}

if (user.role === 'kitchen') {
  // Kitchen can only update status field
  const allowedFields = ['status']
  const updatedFields = Object.keys(req.body)
  const hasInvalidField = updatedFields.some(f => !allowedFields.includes(f))
  
  if (hasInvalidField) {
    return res.status(403).json({ 
      message: 'Kitchen can only update order status' 
    })
  }
}
```

### Level 3: Time-Based Permissions (ABAC)

**What**: Access depends on time/date context

**Example Use Cases**:
- Caregivers can only see today's orders
- Kitchen staff can only access during working hours (6 AM - 8 PM)
- Orders can only be modified within 24 hours of creation

**Implementation**:
```typescript
// In meal orders list endpoint
if (user.role === 'caregiver') {
  const today = new Date().toDateString()
  
  // Filter to show only today's orders or own orders
  const orders = await payload.find({
    collection: 'meal-orders',
    where: {
      or: [
        { date: { equals: today } },
        { createdBy: { equals: user.id } }
      ]
    }
  })
}
```

### Level 4: Full ACL System

**What**: Complete fine-grained access control with rules engine

**Features**:
- Resource-level permissions (per document)
- Attribute-based rules (user attributes, resource attributes)
- Context-aware (time, location, device)
- Hierarchical permissions
- Permission inheritance

## Recommended Implementation Path

### Phase 1: Owner-Based (1-2 hours)

1. **Add `createdBy` field tracking**:
   ```typescript
   // In collections (if not already present)
   {
     name: 'createdBy',
     type: 'relationship',
     relationTo: 'users',
     required: true,
   }
   ```

2. **Add ownership checks in API endpoints**:
   - `/app/api/meal-orders/[id]/route.ts`
   - `/app/api/users/[id]/route.ts`

3. **Update UI to show/hide edit buttons based on ownership**

### Phase 2: Status-Based (2-3 hours)

1. **Add status validation in update endpoints**
2. **Create helper function**:
   ```typescript
   // /lib/policies/permissions.ts
   export function canModifyOrder(user, order) {
     if (user.role === 'admin') return true
     if (user.role === 'kitchen') return order.status !== 'completed'
     if (user.role === 'caregiver') {
       return order.status === 'pending' && order.createdBy === user.id
     }
     return false
   }
   ```

3. **Use in API and UI**

### Phase 3: Time-Based (2-3 hours)

1. **Add date filtering in list endpoints**
2. **Add time-window validation**:
   ```typescript
   export function canModifyOrderByTime(order) {
     const hoursSinceCreation = 
       (Date.now() - new Date(order.createdAt).getTime()) / (1000 * 60 * 60)
     return hoursSinceCreation <= 24
   }
   ```

3. **Apply in update operations**

### Phase 4: Full ACL (Optional, 1-2 days)

Create comprehensive ACL system with:
- Policy engine
- Rule evaluation
- Permission caching
- Audit trail for access decisions

## Code Examples

### Enhanced RBAC with Context

```typescript
// /lib/policies/enhanced-rbac.ts

export interface AccessContext {
  user: {
    id: string
    role: 'admin' | 'caregiver' | 'kitchen'
    active: boolean
  }
  resource?: {
    id: string
    createdBy?: string
    status?: string
    createdAt?: Date
  }
  action: 'read' | 'create' | 'update' | 'delete'
  timestamp: Date
}

export function canAccess(ctx: AccessContext): boolean {
  const { user, resource, action } = ctx
  
  // Admin can do anything
  if (user.role === 'admin') return true
  
  // Inactive users can't do anything
  if (!user.active) return false
  
  // Resource-specific rules
  if (action === 'update' && resource) {
    // Caregivers can only update their own pending orders
    if (user.role === 'caregiver') {
      return resource.createdBy === user.id && resource.status === 'pending'
    }
    
    // Kitchen can update any non-completed order
    if (user.role === 'kitchen') {
      return resource.status !== 'completed'
    }
  }
  
  if (action === 'read' && user.role === 'caregiver') {
    // Caregivers can read their own orders or today's orders
    if (!resource) return true // List view
    
    const isOwner = resource.createdBy === user.id
    const isToday = new Date(resource.createdAt).toDateString() === new Date().toDateString()
    
    return isOwner || isToday
  }
  
  // Default: check basic RBAC
  return can(user.role, `meal.${action}`)
}
```

### Usage in API Endpoint

```typescript
// /app/api/meal-orders/[id]/route.ts

import { canAccess } from '@/lib/policies/enhanced-rbac'

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const user = await getAuthenticatedUser(req)
  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }
  
  // Get the order
  const order = await payload.findByID({
    collection: 'meal-orders',
    id: params.id
  })
  
  // Check permissions with context
  const hasPermission = canAccess({
    user,
    resource: {
      id: order.id,
      createdBy: order.createdBy,
      status: order.status,
      createdAt: new Date(order.createdAt)
    },
    action: 'update',
    timestamp: new Date()
  })
  
  if (!hasPermission) {
    return NextResponse.json(
      { message: 'You do not have permission to update this order' },
      { status: 403 }
    )
  }
  
  // Proceed with update
  // ...
}
```

### Usage in UI

```typescript
// Component code
import { canAccess } from '@/lib/policies/enhanced-rbac'

function OrderCard({ order, user }) {
  const canEdit = canAccess({
    user,
    resource: {
      id: order.id,
      createdBy: order.createdBy,
      status: order.status,
      createdAt: new Date(order.createdAt)
    },
    action: 'update',
    timestamp: new Date()
  })
  
  const canDelete = canAccess({
    user,
    resource: order,
    action: 'delete',
    timestamp: new Date()
  })
  
  return (
    <div>
      <h3>{order.resident.name}</h3>
      <p>Status: {order.status}</p>
      
      {canEdit && (
        <button onClick={() => editOrder(order)}>
          Edit Order
        </button>
      )}
      
      {canDelete && (
        <button onClick={() => deleteOrder(order)}>
          Delete Order
        </button>
      )}
    </div>
  )
}
```

## Testing Checklist

After implementing each phase, test:

### Owner-Based
- [ ] Admin can edit any resource
- [ ] Caregiver can edit own orders only
- [ ] Caregiver cannot edit other caregivers' orders
- [ ] Kitchen cannot edit orders (only status)

### Status-Based
- [ ] Caregiver cannot edit prepared/completed orders
- [ ] Kitchen can update pending/prepared order status
- [ ] Kitchen cannot update completed order status
- [ ] Admin can edit any status

### Time-Based
- [ ] Caregivers only see today's orders in list
- [ ] Caregivers can still see own historical orders
- [ ] Orders older than 24h cannot be modified (except admin)
- [ ] Kitchen staff blocked outside working hours (if implemented)

## Benefits

### Owner-Based Permissions
- **Security**: Users can't tamper with others' data
- **Privacy**: Users only see their own items
- **Accountability**: Clear ownership trail

### Status-Based Permissions
- **Data Integrity**: Prevents modification of finalized records
- **Workflow Control**: Enforces proper status transitions
- **Audit Trail**: Completed orders remain unchanged

### Time-Based Permissions  
- **Efficiency**: Users see only relevant recent data
- **Performance**: Smaller result sets, faster queries
- **Compliance**: Automatic access restrictions over time

## Migration Steps

1. **Review current permissions** in `/lib/policies/rbac.ts`
2. **Add context-aware checks** gradually
3. **Test thoroughly** with different user roles
4. **Update UI** to reflect new permissions
5. **Document** the new permission rules
6. **Train users** on new access patterns

## Future Enhancements

Once basic ACL is working:

1. **Permission Caching**: Cache permission checks for performance
2. **Delegation**: Allow users to delegate permissions
3. **Temporary Grants**: Time-limited elevated permissions
4. **Group Permissions**: Team-based access control
5. **Field-Level Permissions**: Control access to specific fields
6. **Hierarchical Resources**: Parent-child resource relationships

## Questions?

For implementation help, review:
- Current RBAC: `/lib/policies/rbac.ts`
- API endpoints: `/app/api/**/route.ts`
- Collection schemas: `/collections/*.ts`

Start with Phase 1 (owner-based) for quick wins, then gradually add more sophisticated rules as needed.
