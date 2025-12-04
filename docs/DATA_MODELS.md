# Data Models Documentation

This document provides comprehensive documentation for all data models (Payload CMS collections) in the Meal Planner System.

## Table of Contents

- [Overview](#overview)
- [Collections](#collections)
  - [Users](#users-collection)
  - [Residents](#residents-collection)
  - [Meal Orders](#meal-orders-collection)
  - [Versioned Records](#versioned-records-collection)
  - [Alerts](#alerts-collection)
  - [Audit Logs](#audit-logs-collection)
  - [Archived Records](#archived-records-collection)
- [Relationships](#relationships)
- [Access Control Summary](#access-control-summary)
- [Indexes](#indexes)

## Overview

The Meal Planner System uses Payload CMS with PostgreSQL to manage seven core collections. Each collection implements role-based access control (RBAC) with granular permissions for three user roles: Admin, Caregiver, and Kitchen.

### Design Principles

1. **Immutability**: Historical records (versioned records, audit logs, archived records) are immutable once created
2. **Audit Trail**: All changes to meal orders are versioned and logged
3. **Access Control**: Role-based permissions with field-level access control where needed
4. **Data Integrity**: Unique constraints, required fields, and validation hooks ensure data quality
5. **Performance**: Strategic indexes on frequently queried fields

## Collections

### Users Collection

**Purpose**: Manages user accounts with authentication and role-based access control.

**Slug**: `users`

#### Fields

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| `id` | UUID | Yes | Auto-generated unique identifier |
| `email` | Email | Yes | User's email address (unique, used for login) |
| `password` | Password | Yes | Hashed password (bcrypt with 12 salt rounds) |
| `name` | Text | Yes | Full name of the user |
| `role` | Select | Yes | User role: `admin`, `caregiver`, or `kitchen` |
| `active` | Checkbox | Yes | Whether the user account is active (default: true) |
| `twoFactorEnabled` | Checkbox | Yes | Whether 2FA is enabled (default: false) |
| `twoFactorSecret` | Text | No | TOTP secret for 2FA (only if 2FA enabled) |
| `refreshTokens` | Array | No | Active refresh tokens for this user |
| `createdAt` | Date | Yes | Auto-generated creation timestamp |
| `updatedAt` | Date | Yes | Auto-generated update timestamp |

#### Refresh Token Sub-fields

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| `token` | Text | Yes | JWT refresh token string |
| `expiresAt` | Date | Yes | Token expiration timestamp |
| `createdAt` | Date | Yes | Token creation timestamp |

#### Access Control

| Role | Create | Read | Update | Delete |
|------|--------|------|--------|--------|
| Admin | ✅ All | ✅ All | ✅ All | ✅ All |
| Caregiver | ❌ | ✅ Own profile | ✅ Own profile | ❌ |
| Kitchen | ❌ | ✅ Own profile | ✅ Own profile | ❌ |

**Field-Level Access**:
- `role`: Only admin can update
- `active`: Only admin can update
- `twoFactorEnabled`: Users can update their own, admin can update all
- `twoFactorSecret`: Users can update their own, admin can update all
- `refreshTokens`: System-managed (no manual updates)

#### Hooks

**beforeChange**:
- Hash password with bcrypt (12 salt rounds) on create or update

**afterChange**:
- Invalidate user permissions cache if role changed

#### Authentication

- **Token Expiration**: 15 minutes for access tokens
- **Max Login Attempts**: 5 failed attempts
- **Lockout Time**: 15 minutes after max attempts
- **Email Verification**: Disabled

#### Validation

- Email must be unique
- Role must be one of: `admin`, `caregiver`, `kitchen`
- Password is automatically hashed before storage

---

### Residents Collection

**Purpose**: Stores information about care home residents including dietary restrictions and preferences.

**Slug**: `residents`

#### Fields

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| `id` | UUID | Yes | Auto-generated unique identifier |
| `name` | Text | Yes | Full name of the resident |
| `roomNumber` | Text | Yes | Room number where resident stays |
| `tableNumber` | Text | No | Table number in dining area |
| `station` | Text | No | Station or wing of the care home |
| `dietaryRestrictions` | Array | No | List of dietary restrictions |
| `aversions` | Textarea | No | Foods or ingredients the resident dislikes |
| `specialNotes` | Textarea | No | Additional notes about meal preferences |
| `highCalorie` | Checkbox | Yes | Whether resident requires high-calorie meals (default: false) |
| `active` | Checkbox | Yes | Whether resident is active (default: true) |
| `createdAt` | Date | Yes | Auto-generated creation timestamp |
| `updatedAt` | Date | Yes | Auto-generated update timestamp |

#### Dietary Restrictions Sub-fields

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| `restriction` | Text | No | Name of the dietary restriction |

#### Access Control

| Role | Create | Read | Update | Delete |
|------|--------|------|--------|--------|
| Admin | ✅ | ✅ All | ✅ All | ✅ All |
| Caregiver | ❌ | ✅ All | ❌ | ❌ |
| Kitchen | ❌ | ✅ All | ❌ | ❌ |

#### Hooks

**beforeChange**:
- Log dietary restriction warnings
- Verify resident ID remains unchanged (prevents breaking meal order relationships)

**afterChange**:
- Invalidate resident cache

**afterDelete**:
- Invalidate resident cache

#### Validation

- `name` and `roomNumber` are required
- Inactive residents cannot have new meal orders (enforced in Meal Orders collection)
- Resident ID cannot be changed (prevents orphaned meal orders)

#### Business Rules

- Inactive residents preserve all historical meal orders
- Dietary restrictions trigger warnings when creating meal orders
- Resident data is cached for performance

---

### Meal Orders Collection

**Purpose**: Stores meal orders for residents with meal-specific options for breakfast, lunch, and dinner.

**Slug**: `meal-orders`

#### Fields

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| `id` | UUID | Yes | Auto-generated unique identifier |
| `resident` | Relationship | Yes | Reference to Residents collection |
| `date` | Date | Yes | Date for which the meal is ordered |
| `mealType` | Select | Yes | Type of meal: `breakfast`, `lunch`, or `dinner` |
| `status` | Select | Yes | Order status: `pending`, `prepared`, or `completed` (default: pending) |
| `urgent` | Checkbox | Yes | Whether order is urgent (triggers alerts) (default: false) |
| `version` | Number | Yes | Version number for optimistic locking (default: 1) |
| `breakfastOptions` | Group | Conditional | Breakfast-specific options (only if mealType is breakfast) |
| `lunchOptions` | Group | Conditional | Lunch-specific options (only if mealType is lunch) |
| `dinnerOptions` | Group | Conditional | Dinner-specific options (only if mealType is dinner) |
| `specialNotes` | Textarea | No | Additional notes or special instructions |
| `preparedAt` | Date | No | Timestamp when order was marked as prepared (read-only) |
| `preparedBy` | Relationship | No | User who marked order as prepared (read-only) |
| `createdAt` | Date | Yes | Auto-generated creation timestamp |
| `updatedAt` | Date | Yes | Auto-generated update timestamp |

#### Breakfast Options Sub-fields

| Field Name | Type | Description |
|------------|------|-------------|
| `followsPlan` | Checkbox | Resident follows standard breakfast plan |
| `breadItems` | Multi-Select | Bread types: brötchen, vollkornbrötchen, graubrot, vollkornbrot, weißbrot, knäckebrot |
| `breadPreparation` | Multi-Select | Preparation: geschnitten (sliced), geschmiert (spread) |
| `spreads` | Multi-Select | Spreads: butter, margarine, konfitüre, honig, käse, wurst |
| `porridge` | Checkbox | Include porridge/brei |
| `beverages` | Multi-Select | Beverages: kaffee, tee, milch heiß, milch kalt |
| `additions` | Multi-Select | Additions: zucker, süßstoff, kaffeesahne |

#### Lunch Options Sub-fields

| Field Name | Type | Description |
|------------|------|-------------|
| `portionSize` | Select | Portion size: small, large, vegetarian |
| `soup` | Checkbox | Include soup |
| `dessert` | Checkbox | Include dessert |
| `specialPreparations` | Multi-Select | Preparations: passierte kost, passiertes fleisch, geschnittenes fleisch, kartoffelbrei |
| `restrictions` | Multi-Select | Restrictions: ohne fisch, fingerfood, nur süß |

#### Dinner Options Sub-fields

| Field Name | Type | Description |
|------------|------|-------------|
| `followsPlan` | Checkbox | Resident follows standard dinner plan |
| `breadItems` | Multi-Select | Bread types: graubrot, vollkornbrot, weißbrot, knäckebrot |
| `breadPreparation` | Multi-Select | Preparation: geschmiert (spread), geschnitten (sliced) |
| `spreads` | Multi-Select | Spreads: butter, margarine |
| `soup` | Checkbox | Include soup |
| `porridge` | Checkbox | Include porridge/brei |
| `noFish` | Checkbox | No fish |
| `beverages` | Multi-Select | Beverages: tee, kakao, milch heiß, milch kalt |
| `additions` | Multi-Select | Additions: zucker, süßstoff |

#### Access Control

| Role | Create | Read | Update | Delete |
|------|--------|------|--------|--------|
| Admin | ✅ | ✅ All | ✅ All | ✅ All |
| Caregiver | ✅ | ✅ Own or current date | ✅ Pending only | ❌ |
| Kitchen | ❌ | ✅ All | ✅ Status field only | ❌ |

**Field-Level Access**:
- `status`: Only admin and kitchen can update
- `preparedAt`: Read-only (system-managed)
- `preparedBy`: Read-only (system-managed)
- `version`: Read-only (system-managed)

#### Hooks

**beforeChange**:
- Validate meal type specific options are provided
- Check for duplicate orders (resident + date + mealType must be unique)
- Implement optimistic locking (version check)
- Prevent caregivers from modifying prepared/completed orders
- Increment version number on update

**afterChange**:
- Record `preparedAt` and `preparedBy` when status changes to prepared
- Create alerts for urgent orders
- Deliver alerts via multi-channel (WebSocket, push, email)
- Create versioned records for audit trail
- Log data modifications to audit logs
- Invalidate meal order caches

#### Validation

- Unique constraint on (resident, date, mealType)
- Breakfast orders must include `breakfastOptions`
- Lunch orders must include `lunchOptions`
- Dinner orders must include `dinnerOptions`
- Caregivers cannot modify prepared/completed orders
- Version mismatch triggers conflict error

#### Business Rules

- **Uniqueness**: Only one order per resident per date per meal type
- **Concurrency Control**: Optimistic locking with version numbers
- **Status Workflow**: pending → prepared → completed
- **Urgent Orders**: Trigger multi-channel alerts to kitchen staff
- **Versioning**: All changes create versioned records
- **Immutability**: Prepared/completed orders cannot be modified by caregivers

---

### Versioned Records Collection

**Purpose**: Stores historical snapshots of document changes for audit trails and reporting.

**Slug**: `versioned-records`

#### Fields

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| `id` | UUID | Yes | Auto-generated unique identifier |
| `collectionName` | Text | Yes | Name of the collection this version belongs to |
| `documentId` | Text | Yes | ID of the document that was versioned |
| `version` | Number | Yes | Version number (increments with each change) |
| `snapshot` | JSON | Yes | Complete snapshot of the document before the change |
| `changeType` | Select | Yes | Type of change: `create`, `update`, or `delete` |
| `changedFields` | Array | No | List of fields that were changed |
| `changedBy` | Relationship | No | User who made the change |
| `createdAt` | Date | Yes | Auto-generated creation timestamp |
| `updatedAt` | Date | Yes | Auto-generated update timestamp |

#### Changed Fields Sub-fields

| Field Name | Type | Description |
|------------|------|-------------|
| `field` | Text | Name of the field that changed |

#### Access Control

| Role | Create | Read | Update | Delete |
|------|--------|------|--------|--------|
| Admin | ❌ System only | ✅ All | ❌ Immutable | ❌ Immutable |
| Caregiver | ❌ | ❌ | ❌ | ❌ |
| Kitchen | ❌ | ❌ | ❌ | ❌ |

#### Validation

- Records are immutable once created
- Only system can create versioned records (via hooks)
- No updates or deletes allowed

#### Business Rules

- **Immutability**: Records cannot be modified or deleted
- **Automatic Creation**: Created automatically by meal order hooks
- **Complete Snapshots**: Stores full document state before changes
- **Audit Trail**: Provides complete history of all changes

---

### Alerts Collection

**Purpose**: Manages alerts for urgent meal orders and emergency situations.

**Slug**: `alerts`

#### Fields

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| `id` | UUID | Yes | Auto-generated unique identifier |
| `mealOrder` | Relationship | Yes | Reference to the meal order that triggered the alert |
| `message` | Text | Yes | Alert message describing the urgent situation |
| `severity` | Select | Yes | Severity level: `low`, `medium`, `high`, or `critical` (default: medium) |
| `acknowledged` | Checkbox | Yes | Whether alert has been acknowledged (default: false) |
| `acknowledgedBy` | Relationship | No | User who acknowledged the alert (read-only) |
| `acknowledgedAt` | Date | No | Timestamp when alert was acknowledged (read-only) |
| `createdAt` | Date | Yes | Auto-generated creation timestamp |
| `updatedAt` | Date | Yes | Auto-generated update timestamp |

#### Access Control

| Role | Create | Read | Update | Delete |
|------|--------|------|--------|--------|
| Admin | ✅ | ✅ All | ✅ All | ✅ All |
| Caregiver | ✅ | ❌ | ❌ | ❌ |
| Kitchen | ❌ | ✅ All | ✅ Acknowledge only | ❌ |

**Field-Level Access**:
- `acknowledged`: Only admin and kitchen can update
- `acknowledgedBy`: Read-only (system-managed)
- `acknowledgedAt`: Read-only (system-managed)

#### Hooks

**beforeChange**:
- Record `acknowledgedBy` and `acknowledgedAt` when acknowledged is set to true

#### Validation

- Alert must reference a valid meal order
- Severity must be one of: low, medium, high, critical

#### Business Rules

- **Multi-Channel Delivery**: Alerts delivered via dashboard, WebSocket, push, and email
- **Escalation**: Unacknowledged alerts older than 30 minutes escalate to admin
- **Acknowledgment**: Kitchen staff can acknowledge alerts
- **Automatic Creation**: Created automatically when meal orders are marked urgent

---

### Audit Logs Collection

**Purpose**: Stores audit logs for authentication, authorization, and data modification events.

**Slug**: `audit-logs`

#### Fields

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| `id` | UUID | Yes | Auto-generated unique identifier |
| `action` | Select | Yes | Type of action (see Action Types below) |
| `userId` | Text | No | ID of the user who performed the action |
| `email` | Text | No | Email of the user (for authentication attempts) |
| `status` | Select | Yes | Status: `success`, `failure`, or `denied` |
| `ipAddress` | Text | No | IP address of the client |
| `userAgent` | Text | No | User agent string of the client |
| `resource` | Text | No | Resource being accessed (collection name, endpoint) |
| `resourceId` | Text | No | ID of the specific resource |
| `details` | JSON | No | Additional details about the action |
| `errorMessage` | Text | No | Error message if action failed |
| `createdAt` | Date | Yes | Auto-generated creation timestamp |
| `updatedAt` | Date | Yes | Auto-generated update timestamp |

#### Action Types

- `login_attempt`: User attempted to log in
- `login_success`: Successful login
- `login_failure`: Failed login attempt
- `logout`: User logged out
- `token_refresh`: Access token refreshed
- `2fa_enable`: 2FA enabled for user
- `2fa_verify`: 2FA code verified
- `unauthorized_access`: Unauthorized access attempt
- `data_create`: Data created
- `data_update`: Data updated
- `data_delete`: Data deleted
- `data_read`: Data read

#### Access Control

| Role | Create | Read | Update | Delete |
|------|--------|------|--------|--------|
| Admin | ❌ System only | ✅ All | ❌ Immutable | ❌ Immutable |
| Caregiver | ❌ | ❌ | ❌ | ❌ |
| Kitchen | ❌ | ❌ | ❌ | ❌ |

#### Validation

- Records are immutable once created
- Only system can create audit logs
- No updates or deletes allowed

#### Business Rules

- **Immutability**: Records cannot be modified or deleted
- **Automatic Creation**: Created automatically by authentication and authorization systems
- **Security Monitoring**: Tracks all authentication attempts and unauthorized access
- **Compliance**: Provides audit trail for security compliance

---

### Archived Records Collection

**Purpose**: Stores archived historical data that has exceeded the retention period.

**Slug**: `archived-records`

#### Fields

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| `id` | UUID | Yes | Auto-generated unique identifier |
| `collectionName` | Text | Yes | Name of the original collection |
| `documentId` | Text | Yes | ID of the original document |
| `data` | JSON | Yes | Complete archived data |
| `originalCreatedAt` | Date | Yes | Original creation date of the record |
| `archivedAt` | Date | Yes | Date when the record was archived |
| `retentionPeriodDays` | Number | Yes | Retention period that was applied (in days) |
| `createdAt` | Date | Yes | Auto-generated creation timestamp |
| `updatedAt` | Date | Yes | Auto-generated update timestamp |

#### Access Control

| Role | Create | Read | Update | Delete |
|------|--------|------|--------|--------|
| Admin | ❌ System only | ✅ All | ❌ Immutable | ✅ All |
| Caregiver | ❌ | ❌ | ❌ | ❌ |
| Kitchen | ❌ | ❌ | ❌ | ❌ |

#### Validation

- Records are immutable once created
- Only system can create archived records (via archival service)
- Only admin can delete archived records (for cleanup)

#### Business Rules

- **Automatic Archival**: Created by scheduled archival service
- **Retention Policies**: Configurable retention periods per collection
- **Immutability**: Records cannot be modified
- **Admin Retrieval**: Admin can retrieve archived data when needed
- **Cleanup**: Admin can delete archived records for space management

---

## Relationships

### Entity Relationship Diagram

```
Users ──┬─── creates ───> Residents
        ├─── creates ───> Meal Orders
        ├─── prepares ──> Meal Orders
        ├─── creates ───> Alerts
        ├─── acknowledges > Alerts
        └─── changes ───> Versioned Records

Residents ──── has many ──> Meal Orders

Meal Orders ──┬─── triggers ──> Alerts
              └─── has many ──> Versioned Records

Versioned Records ──── tracks ──> Any Collection

Audit Logs ──── tracks ──> All User Actions

Archived Records ──── stores ──> Expired Historical Data
```

### Relationship Details

#### Users → Residents
- **Type**: One-to-Many
- **Description**: Users (admin) create and update residents
- **Fields**: `createdBy`, `updatedBy` in Residents

#### Users → Meal Orders
- **Type**: One-to-Many
- **Description**: Users create meal orders and mark them as prepared
- **Fields**: `createdBy`, `updatedBy`, `preparedBy` in Meal Orders

#### Residents → Meal Orders
- **Type**: One-to-Many
- **Description**: Each resident can have multiple meal orders
- **Fields**: `resident` in Meal Orders
- **Constraint**: Unique (resident, date, mealType)

#### Meal Orders → Alerts
- **Type**: One-to-Many
- **Description**: Urgent meal orders trigger alerts
- **Fields**: `mealOrder` in Alerts

#### Users → Alerts
- **Type**: One-to-Many
- **Description**: Users acknowledge alerts
- **Fields**: `acknowledgedBy` in Alerts

#### Meal Orders → Versioned Records
- **Type**: One-to-Many
- **Description**: Each meal order change creates a versioned record
- **Fields**: `collectionName`, `documentId` in Versioned Records

---

## Access Control Summary

### Role Permissions Matrix

| Collection | Admin | Caregiver | Kitchen |
|------------|-------|-----------|---------|
| **Users** | Full CRUD | Read/Update own | Read/Update own |
| **Residents** | Full CRUD | Read only | Read only |
| **Meal Orders** | Full CRUD | Create, Read own/current, Update pending | Read all, Update status |
| **Versioned Records** | Read only | No access | No access |
| **Alerts** | Full CRUD | Create only | Read, Acknowledge |
| **Audit Logs** | Read only | No access | No access |
| **Archived Records** | Read, Delete | No access | No access |

### Access Control Implementation

The system implements **Role-Based Access Control (RBAC)** with **Access Control Lists (ACL)** for fine-grained permissions:

1. **Collection-Level**: Controls which roles can access which collections
2. **Operation-Level**: Controls which operations (CRUD) each role can perform
3. **Field-Level**: Controls which fields each role can read or update
4. **Record-Level**: Controls which specific records each role can access (e.g., caregivers can only see their own orders)

---

## Indexes

### Database Indexes for Performance

#### Users Collection
- `email` - Unique index for login lookups
- `role` - Index for role-based queries

#### Residents Collection
- `roomNumber` - Index for room-based lookups
- `active` - Index for filtering active residents

#### Meal Orders Collection
- `resident` - Index for resident-based queries
- `date` - Index for date-based queries
- `mealType` - Index for meal type filtering
- `status` - Index for status filtering
- `(date, mealType)` - Composite index for dashboard queries
- `(resident, date, mealType)` - Unique composite index for duplicate prevention

#### Versioned Records Collection
- `(collectionName, documentId)` - Composite index for version history queries
- `createdAt` - Index for time-based queries

#### Alerts Collection
- `acknowledged` - Index for filtering unacknowledged alerts
- `createdAt` - Index for time-based queries

#### Audit Logs Collection
- `action` - Index for action type filtering
- `userId` - Index for user-based queries
- `email` - Index for email-based queries
- `status` - Index for status filtering
- `ipAddress` - Index for IP-based queries

#### Archived Records Collection
- `collectionName` - Index for collection-based queries
- `documentId` - Index for document lookups
- `originalCreatedAt` - Index for time-based queries

---

## Data Integrity Rules

### Unique Constraints

1. **Users**: `email` must be unique
2. **Meal Orders**: `(resident, date, mealType)` must be unique

### Required Fields

All collections enforce required fields at the database level to ensure data integrity.

### Referential Integrity

- Foreign key relationships are enforced by Payload CMS
- Deleting a resident does not delete their meal orders (historical data preserved)
- Deleting a user does not delete their created records (audit trail preserved)

### Validation Rules

1. **Users**: Role must be one of: admin, caregiver, kitchen
2. **Meal Orders**: Status must be one of: pending, prepared, completed
3. **Meal Orders**: Meal type must be one of: breakfast, lunch, dinner
4. **Alerts**: Severity must be one of: low, medium, high, critical
5. **Versioned Records**: Change type must be one of: create, update, delete

---

## Caching Strategy

### Cached Data

1. **Resident Data**: Cached because it changes infrequently
2. **User Permissions**: Cached for performance
3. **Meal Orders**: Cache invalidated on any change

### Cache Invalidation

- **Residents**: Invalidated on create, update, delete
- **Users**: Invalidated when role changes
- **Meal Orders**: Invalidated on any change

---

## Data Retention Policies

### Configurable Retention Periods

| Collection | Default Retention | Configurable |
|------------|-------------------|--------------|
| Versioned Records | 365 days | Yes |
| Audit Logs | 730 days (2 years) | Yes |
| Completed Meal Orders | 90 days | Yes |

### Archival Process

1. Scheduled job runs daily at configured hour (default: 2 AM)
2. Identifies records exceeding retention period
3. Moves records to Archived Records collection
4. Maintains referential integrity
5. Admin can retrieve archived data when needed

---

## Best Practices

### When Creating Records

1. Always provide required fields
2. Validate data before submission
3. Check for duplicate meal orders
4. Ensure resident is active before creating meal orders

### When Updating Records

1. Check user permissions before attempting updates
2. Use version numbers for concurrency control
3. Caregivers cannot modify prepared/completed orders
4. Kitchen can only update status field

### When Querying Records

1. Use indexes for better performance
2. Filter by date range for large datasets
3. Implement pagination for large result sets
4. Cache frequently accessed data

### Security Considerations

1. Never expose password hashes
2. Log all authentication attempts
3. Log unauthorized access attempts
4. Implement rate limiting for authentication
5. Use HTTPS in production
6. Validate all user input

---

## Migration Guide

### Adding New Fields

1. Update collection schema in `collections/` directory
2. Run database migration (Payload handles automatically)
3. Update TypeScript types if needed
4. Update API documentation
5. Update tests

### Modifying Existing Fields

1. Consider backward compatibility
2. Update collection schema
3. Create data migration script if needed
4. Update related code and tests
5. Update documentation

### Deleting Fields

1. Ensure no code depends on the field
2. Update collection schema
3. Consider archiving data before deletion
4. Update documentation

---

## Troubleshooting

### Common Issues

**Issue**: Duplicate meal order error
**Solution**: Check if order already exists for resident/date/meal type combination

**Issue**: Cannot update meal order
**Solution**: Check if order status is prepared/completed (caregivers cannot modify)

**Issue**: Version conflict error
**Solution**: Reload the order and try again (concurrent modification detected)

**Issue**: Cannot access collection
**Solution**: Check user role and permissions

---

## Additional Resources

- [API Documentation](API_DOCUMENTATION.md)
- [Authentication Flow](AUTHENTICATION_FLOW.md)
- [Access Control Guide](ACCESS_CONTROL.md)
- [Payload CMS Documentation](https://payloadcms.com/docs)

---

**Last Updated**: December 2024
