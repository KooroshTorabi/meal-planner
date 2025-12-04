# Design Document: Meal Planner System

## Overview

The Meal Planner System is a comprehensive digital solution built on Payload CMS that replaces the manual, paper-based meal ordering workflow in an elderly care home. The system enables caregivers to efficiently capture meal preferences on tablets, allows kitchen staff to view aggregated ingredient needs and track preparation progress, and provides administrators with full system management capabilities.

### Key Design Principles

1. **Role-Based Security**: Implement RBAC + ACL for granular access control across three user roles
2. **Data Integrity**: Use versioned records for audit trails and historical analytics
3. **Performance**: Optimize ingredient aggregation queries for real-time dashboard updates
4. **Usability**: Responsive, accessible UI with dark mode support using TailwindCSS
5. **Extensibility**: Modular architecture allowing future enhancements without major refactoring

### Technology Stack

- **Backend**: Payload CMS 3.x with Next.js 14+ API Routes
- **Database**: PostgreSQL with @payloadcms/db-postgres adapter
- **Authentication**: Custom JWT-based auth with refresh tokens and 2FA support
- **UI Framework**: React with TailwindCSS for responsive, accessible interfaces
- **Real-time**: WebSocket support for alert notifications
- **Testing**: Jest for unit tests, fast-check for property-based testing

## Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Layer                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Caregiver  │  │   Kitchen    │  │    Admin     │      │
│  │   Interface  │  │  Dashboard   │  │   Interface  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  API Layer (Next.js)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │     Auth     │  │   Meal       │  │  Reporting   │      │
│  │   Endpoints  │  │  Endpoints   │  │  Endpoints   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐                        │
│  │  WebSocket   │  │  Aggregation │                        │
│  │   Service    │  │   Service    │                        │
│  └──────────────┘  └──────────────┘                        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                 Payload CMS Core                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Collection  │  │    Access    │  │   Hooks &    │      │
│  │   Schemas    │  │   Control    │  │  Validation  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              PostgreSQL Database                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Users &    │  │  Residents & │  │  Versioned   │      │
│  │    Roles     │  │ Meal Orders  │  │   Records    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### Authentication Flow

```
┌──────────┐                                    ┌──────────┐
│  Client  │                                    │  Server  │
└────┬─────┘                                    └────┬─────┘
     │                                                │
     │  1. POST /api/users/login                     │
     │    { email, password, [2faCode] }             │
     ├──────────────────────────────────────────────>│
     │                                                │
     │                                    2. Validate credentials
     │                                       Generate tokens
     │                                                │
     │  3. { accessToken, refreshToken }             │
     │<──────────────────────────────────────────────┤
     │                                                │
     │  4. Authenticated requests                    │
     │    Authorization: Bearer {accessToken}        │
     ├──────────────────────────────────────────────>│
     │                                                │
     │  5. Access token expires                      │
     │                                                │
     │  6. POST /api/users/refresh                   │
     │    { refreshToken }                           │
     ├──────────────────────────────────────────────>│
     │                                                │
     │  7. { accessToken, refreshToken }             │
     │<──────────────────────────────────────────────┤
     │                                                │
```

## Components and Interfaces

### Core Collections

#### 1. Users Collection

```typescript
interface User {
  id: string;
  email: string;
  password: string; // hashed
  role: 'admin' | 'caregiver' | 'kitchen';
  name: string;
  active: boolean;
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  refreshTokens: RefreshToken[];
  createdAt: Date;
  updatedAt: Date;
}

interface RefreshToken {
  token: string;
  expiresAt: Date;
  createdAt: Date;
}
```

**Access Control:**
- Admin: Full CRUD access
- Caregiver: Read own profile, update own password
- Kitchen: Read own profile, update own password

#### 2. Residents Collection

```typescript
interface Resident {
  id: string;
  name: string;
  roomNumber: string;
  tableNumber?: string;
  station?: string;
  dietaryRestrictions: string[];
  aversions?: string;
  specialNotes?: string;
  highCalorie: boolean;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: User;
  updatedBy: User;
}
```

**Access Control:**
- Admin: Full CRUD access
- Caregiver: Read access only
- Kitchen: Read access only

#### 3. Meal Orders Collection

```typescript
interface MealOrder {
  id: string;
  resident: Resident;
  date: Date;
  mealType: 'breakfast' | 'lunch' | 'dinner';
  status: 'pending' | 'prepared' | 'completed';
  urgent: boolean;
  
  // Meal-specific fields (conditional based on mealType)
  breakfastOptions?: BreakfastOptions;
  lunchOptions?: LunchOptions;
  dinnerOptions?: DinnerOptions;
  
  specialNotes?: string;
  preparedAt?: Date;
  preparedBy?: User;
  createdAt: Date;
  updatedAt: Date;
  createdBy: User;
  updatedBy: User;
}

interface BreakfastOptions {
  followsPlan: boolean;
  breadItems: string[]; // brötchen, vollkornbrötchen, graubrot, etc.
  breadPreparation: string[]; // geschnitten, geschmiert
  spreads: string[]; // butter, margarine, konfitüre, etc.
  porridge: boolean;
  beverages: string[]; // kaffee, tee, milch heiß, milch kalt
  additions: string[]; // zucker, süßstoff, kaffeesahne
}

interface LunchOptions {
  portionSize: 'small' | 'large' | 'vegetarian';
  soup: boolean;
  dessert: boolean;
  specialPreparations: string[]; // passierte kost, geschnittenes fleisch, etc.
  restrictions: string[]; // ohne fisch, fingerfood, nur süß
}

interface DinnerOptions {
  followsPlan: boolean;
  breadItems: string[]; // graubrot, vollkornbrot, weißbrot, knäckebrot
  breadPreparation: string[]; // geschmiert, geschnitten
  spreads: string[]; // butter, margarine
  soup: boolean;
  porridge: boolean;
  noFish: boolean;
  beverages: string[]; // tee, kakao, milch heiß, milch kalt
  additions: string[]; // zucker, süßstoff
}
```

**Access Control:**
- Admin: Full CRUD access
- Caregiver: Create, read, update (only if status is 'pending')
- Kitchen: Read all, update status field only

#### 4. Versioned Records Collection

```typescript
interface VersionedRecord {
  id: string;
  collectionName: string;
  documentId: string;
  version: number;
  snapshot: any; // Full document snapshot
  changeType: 'create' | 'update' | 'delete';
  changedFields: string[];
  changedBy: User;
  createdAt: Date;
}
```

**Access Control:**
- Admin: Read access only
- Caregiver: No access
- Kitchen: No access

#### 5. Alerts Collection

```typescript
interface Alert {
  id: string;
  mealOrder: MealOrder;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  acknowledged: boolean;
  acknowledgedBy?: User;
  acknowledgedAt?: Date;
  createdAt: Date;
  createdBy: User;
}
```

**Access Control:**
- Admin: Full CRUD access
- Caregiver: Create only
- Kitchen: Read, update (acknowledge only)

### Custom API Endpoints

#### 1. Ingredient Aggregation Endpoint

```typescript
// GET /api/kitchen/aggregate-ingredients
interface AggregateIngredientsRequest {
  date: string; // ISO date
  mealType: 'breakfast' | 'lunch' | 'dinner';
}

interface AggregateIngredientsResponse {
  date: string;
  mealType: string;
  totalOrders: number;
  ingredients: IngredientSummary[];
}

interface IngredientSummary {
  name: string;
  category: string; // bread, spread, beverage, etc.
  quantity: number;
  unit: string;
}
```

#### 2. Kitchen Dashboard Endpoint

```typescript
// GET /api/kitchen/dashboard
interface DashboardRequest {
  date: string;
  mealType: 'breakfast' | 'lunch' | 'dinner';
}

interface DashboardResponse {
  summary: {
    totalOrders: number;
    pendingOrders: number;
    preparedOrders: number;
    completedOrders: number;
  };
  ingredients: IngredientSummary[];
  orders: MealOrder[];
  alerts: Alert[];
}
```

#### 3. Reports Endpoint

```typescript
// GET /api/reports/meal-orders
interface ReportRequest {
  startDate: string;
  endDate: string;
  mealType?: 'breakfast' | 'lunch' | 'dinner';
  residentId?: string;
  status?: 'pending' | 'prepared' | 'completed';
  format?: 'json' | 'csv' | 'excel';
}

interface ReportResponse {
  data: MealOrderReport[];
  summary: {
    totalOrders: number;
    byMealType: Record<string, number>;
    byStatus: Record<string, number>;
  };
}
```

## Data Models

### Database Schema

#### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'caregiver', 'kitchen')),
  name VARCHAR(255) NOT NULL,
  active BOOLEAN DEFAULT true,
  two_factor_enabled BOOLEAN DEFAULT false,
  two_factor_secret VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
```

#### Residents Table
```sql
CREATE TABLE residents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  room_number VARCHAR(50) NOT NULL,
  table_number VARCHAR(50),
  station VARCHAR(100),
  dietary_restrictions TEXT[],
  aversions TEXT,
  special_notes TEXT,
  high_calorie BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

CREATE INDEX idx_residents_room ON residents(room_number);
CREATE INDEX idx_residents_active ON residents(active);
```

#### Meal Orders Table
```sql
CREATE TABLE meal_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resident_id UUID REFERENCES residents(id) NOT NULL,
  date DATE NOT NULL,
  meal_type VARCHAR(20) NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'prepared', 'completed')),
  urgent BOOLEAN DEFAULT false,
  breakfast_options JSONB,
  lunch_options JSONB,
  dinner_options JSONB,
  special_notes TEXT,
  prepared_at TIMESTAMP,
  prepared_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  UNIQUE(resident_id, date, meal_type)
);

CREATE INDEX idx_meal_orders_date ON meal_orders(date);
CREATE INDEX idx_meal_orders_meal_type ON meal_orders(meal_type);
CREATE INDEX idx_meal_orders_status ON meal_orders(status);
CREATE INDEX idx_meal_orders_resident ON meal_orders(resident_id);
CREATE INDEX idx_meal_orders_date_meal_type ON meal_orders(date, meal_type);
```

#### Versioned Records Table
```sql
CREATE TABLE versioned_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_name VARCHAR(100) NOT NULL,
  document_id UUID NOT NULL,
  version INTEGER NOT NULL,
  snapshot JSONB NOT NULL,
  change_type VARCHAR(20) NOT NULL CHECK (change_type IN ('create', 'update', 'delete')),
  changed_fields TEXT[],
  changed_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_versioned_collection_doc ON versioned_records(collection_name, document_id);
CREATE INDEX idx_versioned_created_at ON versioned_records(created_at);
```

#### Alerts Table
```sql
CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_order_id UUID REFERENCES meal_orders(id) NOT NULL,
  message TEXT NOT NULL,
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  acknowledged BOOLEAN DEFAULT false,
  acknowledged_by UUID REFERENCES users(id),
  acknowledged_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

CREATE INDEX idx_alerts_acknowledged ON alerts(acknowledged);
CREATE INDEX idx_alerts_created_at ON alerts(created_at);
```

### Relationships

```
Users ──┬─── creates ───> Residents
        ├─── creates ───> Meal Orders
        ├─── prepares ──> Meal Orders
        ├─── creates ───> Alerts
        └─── acknowledges > Alerts

Residents ──── has many ──> Meal Orders

Meal Orders ──── has many ──> Versioned Records
                └─── triggers ──> Alerts

Versioned Records ──── tracks ──> Any Collection
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property Reflection

After analyzing all acceptance criteria, I've identified several areas where properties can be consolidated to eliminate redundancy:

**Consolidation Opportunities:**
1. Properties 4.1 and 4.5 both test ingredient aggregation math - can be combined into one comprehensive aggregation property
2. Properties 12.2 and 12.3 both test role-based access denial - can be combined into one property about unauthorized access
3. Properties 2.2 and 2.3 both test meal order validation - can be combined into one property about order creation validation
4. Properties 8.1 and 8.2 both test versioning - can be combined to test version creation and retrieval together
5. Properties 15.1, 15.2, 15.3, and 15.4 all test search/filter functionality - can be combined into comprehensive search properties

**Properties to Keep Separate:**
- Authentication properties (9.x) each test distinct flows (login, refresh, 2FA, logout)
- Alert properties (10.x) test different aspects of the alert lifecycle
- Access control properties test different roles and scenarios

### Core Correctness Properties

**Property 1: User role assignment validity**
*For any* user creation request, the assigned role must be one of: admin, caregiver, or kitchen
**Validates: Requirements 1.1**

**Property 2: Role-based permission enforcement**
*For any* user with a specific role, when that role is changed, all subsequent operations must use the permissions of the new role
**Validates: Requirements 1.3**

**Property 3: Deactivated user authentication rejection**
*For any* user account that is marked as inactive, authentication attempts must be rejected while all historical records created by that user remain accessible
**Validates: Requirements 1.4**

**Property 4: Admin full access**
*For any* collection and operation, a user with admin role must be able to perform all CRUD operations successfully
**Validates: Requirements 1.5**

**Property 5: Meal order uniqueness constraint**
*For any* combination of resident, date, and meal type, only one meal order can exist in the system
**Validates: Requirements 2.5**

**Property 6: Meal order creation validation**
*For any* meal order creation attempt, the system must require resident, date, and meal type fields, and valid orders must be saved with pending status
**Validates: Requirements 2.2, 2.3**

**Property 7: Caregiver order visibility filtering**
*For any* caregiver user, querying meal orders must return only orders created by that caregiver or orders for the current date
**Validates: Requirements 2.4**

**Property 8: Ingredient aggregation correctness**
*For any* set of meal orders for a given date and meal type, the aggregated ingredient quantities must equal the sum of each ingredient across all orders with pending or prepared status
**Validates: Requirements 4.1, 4.4, 4.5**

**Property 9: Order status update with metadata**
*For any* meal order marked as prepared by kitchen staff, the order status must be updated to prepared and the prepared timestamp and user must be recorded
**Validates: Requirements 5.2**

**Property 10: Status-based order modification prevention**
*For any* meal order with status prepared or completed, caregiver users must be prevented from modifying the order
**Validates: Requirements 5.5**

**Property 11: Resident required fields validation**
*For any* resident creation attempt without name or room number, the system must reject the creation
**Validates: Requirements 7.1**

**Property 12: Resident update preserves meal orders**
*For any* resident record update, all existing meal orders referencing that resident must remain intact and correctly associated
**Validates: Requirements 7.3**

**Property 13: Inactive resident order prevention**
*For any* resident marked as inactive, attempts to create new meal orders for that resident must be rejected while historical orders remain accessible
**Validates: Requirements 7.4**

**Property 14: Versioned record creation on modification**
*For any* meal order update, a versioned record must be created capturing the complete previous state with timestamp and user information
**Validates: Requirements 8.1, 8.2**

**Property 15: Historical data immutability**
*For any* versioned record, deletion attempts must be prevented while read access is allowed for administrators
**Validates: Requirements 8.5**

**Property 16: Authentication token generation**
*For any* valid login credentials, the system must generate both an access token and a refresh token
**Validates: Requirements 9.1**

**Property 17: Refresh token exchange**
*For any* valid refresh token, the system must issue a new access token without requiring password re-entry
**Validates: Requirements 9.2**

**Property 18: Two-factor authentication enforcement**
*For any* user with 2FA enabled, login attempts must require both valid password and valid time-based code
**Validates: Requirements 9.3**

**Property 19: Logout token invalidation**
*For any* user logout operation, the current refresh token must be invalidated and subsequent use must be rejected
**Validates: Requirements 9.4**

**Property 20: Failed authentication logging**
*For any* authentication attempt with invalid credentials, the system must reject the request and create an audit log entry with user identifier, timestamp, and failure reason
**Validates: Requirements 9.5**

**Property 21: Urgent order alert creation**
*For any* meal order marked as urgent, the system must create alert records for all active kitchen staff users
**Validates: Requirements 10.1**

**Property 22: Alert acknowledgment recording**
*For any* alert acknowledged by kitchen staff, the system must record the acknowledging user and timestamp
**Validates: Requirements 10.3**

**Property 23: Alert escalation on timeout**
*For any* alert that remains unacknowledged for more than 30 minutes, the system must create escalation notifications for admin users
**Validates: Requirements 10.5**

**Property 24: Theme preference persistence**
*For any* user theme preference change (light/dark mode), the preference must be stored and retrieved in subsequent sessions
**Validates: Requirements 11.4**

**Property 25: Unauthorized access denial**
*For any* operation attempted by a user without appropriate role permissions, the system must deny access and return an error message
**Validates: Requirements 12.2, 12.3**

**Property 26: Permission-based data filtering**
*For any* collection query, the system must filter results to include only records the requesting user has permission to view
**Validates: Requirements 12.4**

**Property 27: Unauthorized operation logging**
*For any* unauthorized operation attempt, the system must create an audit log entry with user identifier, timestamp, and requested action
**Validates: Requirements 12.5**

**Property 28: Seed script idempotency**
*For any* execution of the seed script when data already exists, the system must detect existing records and skip creation to prevent duplicates
**Validates: Requirements 13.5**

**Property 29: Search filter combination**
*For any* set of search filters applied to meal orders or residents, the system must return only records matching all filter criteria using logical AND operations
**Validates: Requirements 15.1, 15.4**

**Property 30: Multi-channel alert delivery**
*For any* alert created, the system must attempt delivery through all configured channels (dashboard, WebSocket, push, email) and retry failed deliveries through alternative channels
**Validates: Requirements 16.1, 16.2, 16.3, 16.4, 16.5**

**Property 31: Report filtering and aggregation**
*For any* report generation request with date range and filters, the system must return only matching records with correct summary totals for ingredients and meal types
**Validates: Requirements 17.1, 17.2**

**Property 32: Report export format validity**
*For any* report export request, the system must generate valid CSV or Excel format output containing all report data
**Validates: Requirements 17.3**

**Property 33: Concurrent edit conflict detection**
*For any* two simultaneous updates to the same meal order, the system must detect the conflict and prevent the second update from overwriting the first without notification
**Validates: Requirements 18.1, 18.2**

**Property 34: Conflict resolution with versioning**
*For any* resolved conflict, the system must save the merged result and create a versioned record capturing the resolution
**Validates: Requirements 18.4**

**Property 35: Non-conflicting concurrent operations**
*For any* set of concurrent operations on different meal orders, all operations must succeed without interference
**Validates: Requirements 18.5**

**Property 36: Data retention policy enforcement**
*For any* versioned record or audit log older than the configured retention period, the system must archive the data while maintaining referential integrity
**Validates: Requirements 19.2, 19.3**

**Property 37: Archived data retrieval with authorization**
*For any* request for archived data, the system must verify admin authorization before retrieving and returning the data
**Validates: Requirements 19.5**

**Property 38: Accessibility attribute presence**
*For any* form or interactive element, the system must include appropriate ARIA labels and semantic HTML elements
**Validates: Requirements 20.3**

**Property 39: Form label association**
*For any* form input field, the system must associate a label element and provide clear validation error messages
**Validates: Requirements 20.4**

## Error Handling

### Error Categories

#### 1. Validation Errors (400 Bad Request)
- Missing required fields
- Invalid field values
- Duplicate unique constraints
- Invalid date formats
- Invalid enum values

**Example Response:**
```json
{
  "errors": [
    {
      "field": "mealType",
      "message": "Meal type must be one of: breakfast, lunch, dinner"
    }
  ]
}
```

#### 2. Authentication Errors (401 Unauthorized)
- Invalid credentials
- Expired access token
- Invalid refresh token
- Missing 2FA code
- Invalid 2FA code

**Example Response:**
```json
{
  "error": "Authentication failed",
  "message": "Invalid credentials provided"
}
```

#### 3. Authorization Errors (403 Forbidden)
- Insufficient role permissions
- Resource-level access denied
- Status-based modification prevention

**Example Response:**
```json
{
  "error": "Access denied",
  "message": "Kitchen staff cannot modify resident records"
}
```

#### 4. Not Found Errors (404 Not Found)
- Resource does not exist
- Deleted or archived resource

**Example Response:**
```json
{
  "error": "Resource not found",
  "message": "Meal order with ID abc123 does not exist"
}
```

#### 5. Conflict Errors (409 Conflict)
- Duplicate meal order for resident/date/meal type
- Concurrent modification conflict
- Version mismatch

**Example Response:**
```json
{
  "error": "Conflict detected",
  "message": "A meal order already exists for this resident, date, and meal type",
  "existingOrder": { "id": "xyz789" }
}
```

#### 6. Server Errors (500 Internal Server Error)
- Database connection failures
- Unexpected exceptions
- External service failures

**Example Response:**
```json
{
  "error": "Internal server error",
  "message": "An unexpected error occurred. Please try again later.",
  "requestId": "req_abc123"
}
```

### Error Handling Strategy

1. **Validation**: Use Payload's built-in validation with custom validators for complex rules
2. **Logging**: Log all errors with context (user, timestamp, request details) using structured logging
3. **User Feedback**: Provide clear, actionable error messages without exposing sensitive system details
4. **Retry Logic**: Implement exponential backoff for transient failures (database, external services)
5. **Graceful Degradation**: Continue operation with reduced functionality when non-critical services fail
6. **Monitoring**: Track error rates and patterns for proactive issue detection

### Critical Error Scenarios

#### Database Connection Loss
```typescript
// Implement connection pooling with automatic retry
const retryConfig = {
  maxRetries: 3,
  backoffMultiplier: 2,
  initialDelay: 1000
};
```

#### Alert Delivery Failure
```typescript
// Fallback chain: WebSocket → Push → Email → Dashboard
// Store failed alerts for manual review
```

#### Concurrent Modification
```typescript
// Use optimistic locking with version numbers
// Provide conflict resolution UI with both versions
```

## Testing Strategy

### Unit Testing

**Framework**: Jest with TypeScript support

**Coverage Goals**:
- Minimum 80% code coverage
- 100% coverage for critical paths (authentication, access control, aggregation)

**Key Areas**:
1. **Collection Hooks**: Test beforeChange, afterChange, beforeRead hooks
2. **Access Control**: Test all permission rules for each role
3. **Validation**: Test field validators and custom validation logic
4. **Utility Functions**: Test aggregation, filtering, formatting functions
5. **API Endpoints**: Test custom endpoints with various inputs

**Example Unit Tests**:
```typescript
describe('Ingredient Aggregation', () => {
  test('aggregates bread items correctly', () => {
    const orders = [
      { breakfastOptions: { breadItems: ['brötchen', 'graubrot'] } },
      { breakfastOptions: { breadItems: ['brötchen', 'vollkornbrot'] } }
    ];
    const result = aggregateIngredients(orders, 'breakfast');
    expect(result.find(i => i.name === 'brötchen').quantity).toBe(2);
  });

  test('filters by order status', () => {
    const orders = [
      { status: 'pending', breakfastOptions: { breadItems: ['brötchen'] } },
      { status: 'completed', breakfastOptions: { breadItems: ['brötchen'] } }
    ];
    const result = aggregateIngredients(orders, 'breakfast');
    expect(result.find(i => i.name === 'brötchen').quantity).toBe(1);
  });
});
```

### Property-Based Testing

**Framework**: fast-check (JavaScript/TypeScript property-based testing library)

**Configuration**: Minimum 100 iterations per property test

**Property Test Tagging**: Each property-based test must include a comment with the format:
```typescript
// **Feature: meal-planner-system, Property 8: Ingredient aggregation correctness**
```

**Key Properties to Test**:

1. **Aggregation Properties**:
```typescript
// **Feature: meal-planner-system, Property 8: Ingredient aggregation correctness**
fc.assert(
  fc.property(
    fc.array(mealOrderGenerator()),
    (orders) => {
      const aggregated = aggregateIngredients(orders, 'breakfast');
      const manualCount = countIngredientsManually(orders);
      return aggregated.every(item => 
        item.quantity === manualCount[item.name]
      );
    }
  ),
  { numRuns: 100 }
);
```

2. **Access Control Properties**:
```typescript
// **Feature: meal-planner-system, Property 25: Unauthorized access denial**
fc.assert(
  fc.property(
    fc.record({
      role: fc.constantFrom('caregiver', 'kitchen'),
      operation: fc.constantFrom('create', 'update', 'delete'),
      collection: fc.constant('residents')
    }),
    async ({ role, operation, collection }) => {
      const user = await createUserWithRole(role);
      const result = await attemptOperation(user, operation, collection);
      return result.status === 403;
    }
  ),
  { numRuns: 100 }
);
```

3. **Versioning Properties**:
```typescript
// **Feature: meal-planner-system, Property 14: Versioned record creation on modification**
fc.assert(
  fc.property(
    mealOrderGenerator(),
    fc.record({ status: fc.constantFrom('prepared', 'completed') }),
    async (originalOrder, updates) => {
      const created = await createMealOrder(originalOrder);
      const versionsBefore = await getVersions(created.id);
      await updateMealOrder(created.id, updates);
      const versionsAfter = await getVersions(created.id);
      return versionsAfter.length === versionsBefore.length + 1 &&
             versionsAfter[0].snapshot.status === originalOrder.status;
    }
  ),
  { numRuns: 100 }
);
```

4. **Uniqueness Properties**:
```typescript
// **Feature: meal-planner-system, Property 5: Meal order uniqueness constraint**
fc.assert(
  fc.property(
    mealOrderGenerator(),
    async (order) => {
      await createMealOrder(order);
      const duplicate = await createMealOrder(order);
      return duplicate.error && duplicate.status === 409;
    }
  ),
  { numRuns: 100 }
);
```

### Integration Testing

**Scope**: End-to-end workflows across multiple collections and API endpoints

**Key Scenarios**:
1. Complete caregiver workflow: Login → Select resident → Create meal order → Verify order
2. Complete kitchen workflow: Login → View dashboard → Aggregate ingredients → Mark orders prepared
3. Admin workflow: Create users → Create residents → View reports → Access historical data
4. Alert workflow: Create urgent order → Verify alert delivery → Acknowledge alert
5. Conflict resolution: Concurrent edits → Detect conflict → Resolve → Verify versioning

### Test Data Generators

**Purpose**: Generate realistic, varied test data for property-based tests

```typescript
const mealOrderGenerator = () => fc.record({
  resident: residentIdGenerator(),
  date: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }),
  mealType: fc.constantFrom('breakfast', 'lunch', 'dinner'),
  status: fc.constantFrom('pending', 'prepared', 'completed'),
  breakfastOptions: fc.option(breakfastOptionsGenerator()),
  lunchOptions: fc.option(lunchOptionsGenerator()),
  dinnerOptions: fc.option(dinnerOptionsGenerator())
});

const breakfastOptionsGenerator = () => fc.record({
  followsPlan: fc.boolean(),
  breadItems: fc.array(fc.constantFrom('brötchen', 'vollkornbrötchen', 'graubrot'), { minLength: 0, maxLength: 3 }),
  spreads: fc.array(fc.constantFrom('butter', 'margarine', 'konfitüre'), { minLength: 0, maxLength: 3 }),
  beverages: fc.array(fc.constantFrom('kaffee', 'tee', 'milch heiß'), { minLength: 1, maxLength: 2 })
});
```

### Test Environment

**Database**: Separate PostgreSQL test database with automatic cleanup between tests
**Seeding**: Use test-specific seed data, not production seed script
**Isolation**: Each test runs in a transaction that rolls back after completion
**Mocking**: Mock external services (email, push notifications) but test real database operations

### Continuous Testing

**Pre-commit**: Run unit tests and linting
**CI Pipeline**: Run full test suite (unit + property + integration) on every push
**Coverage Reports**: Generate and track coverage trends over time
**Performance Tests**: Monitor aggregation query performance with increasing data volumes

## Implementation Notes

### Payload CMS Configuration

**Key Configuration Decisions**:

1. **Collections Structure**: Separate collections for Users, Residents, Meal Orders, Versioned Records, and Alerts
2. **Access Control**: Use Payload's access control functions with custom logic for RBAC + ACL
3. **Hooks**: Implement beforeChange hooks for versioning, afterChange hooks for alerts
4. **Custom Endpoints**: Create custom API routes for aggregation, dashboard, and reports
5. **Admin UI**: Customize admin panel with custom views for kitchen dashboard

### Authentication Implementation

**Token Strategy**:
- Access tokens: JWT with 15-minute expiration
- Refresh tokens: Stored in database with 7-day expiration
- 2FA: TOTP (Time-based One-Time Password) using speakeasy library

**Security Measures**:
- Password hashing: bcrypt with salt rounds = 12
- Rate limiting: 5 failed attempts per 15 minutes per IP
- Session management: Invalidate refresh tokens on logout
- HTTPS enforcement: All production traffic over TLS

### Performance Optimization

**Database Indexes**:
- Composite index on (date, meal_type) for meal orders
- Index on resident_id for meal orders
- Index on status for meal orders
- Index on (collection_name, document_id) for versioned records

**Query Optimization**:
- Use database-level aggregation for ingredient counting
- Implement pagination for large result sets
- Cache frequently accessed data (residents, user roles)
- Use connection pooling for database connections

**Caching Strategy**:
- Cache resident data (rarely changes)
- Cache user role permissions (changes infrequently)
- Invalidate cache on updates
- Use Redis for distributed caching in production

### Responsive UI Implementation

**TailwindCSS Approach**:
- Mobile-first design with breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Touch-friendly controls: Minimum 44x44px tap targets
- Dark mode: Use Tailwind's dark: variant with system preference detection
- Accessibility: Use semantic HTML, ARIA labels, keyboard navigation

**Component Structure**:
```
src/
  components/
    caregiver/
      MealOrderForm.tsx
      ResidentSelector.tsx
    kitchen/
      Dashboard.tsx
      IngredientReport.tsx
      OrderList.tsx
    admin/
      UserManagement.tsx
      ResidentManagement.tsx
      Reports.tsx
    shared/
      Alert.tsx
      ThemeToggle.tsx
```

### Deployment Considerations

**Environment Variables**:
```
DATABASE_URL=postgresql://...
JWT_SECRET=...
JWT_REFRESH_SECRET=...
PAYLOAD_SECRET=...
SMTP_HOST=...
SMTP_PORT=...
WEBSOCKET_URL=...
```

**Production Checklist**:
- [ ] Enable HTTPS/TLS
- [ ] Configure CORS appropriately
- [ ] Set up database backups
- [ ] Configure monitoring and alerting
- [ ] Set up logging aggregation
- [ ] Enable rate limiting
- [ ] Configure CDN for static assets
- [ ] Set up health check endpoints

## Appendix

### Glossary of German Terms

The original paper forms use German terminology. Here's a reference:

**Breakfast Terms**:
- Brötchen: Bread roll
- Vollkornbrötchen: Whole grain roll
- Graubrot: Grey bread
- Vollkornbrot: Whole grain bread
- Weißbrot: White bread
- Knäckebrot: Crispbread
- Brei: Porridge/puree
- geschnitten: Sliced
- geschmiert: Spread
- Konfitüre: Jam
- Honig: Honey
- Käse: Cheese
- Wurst: Sausage
- Kaffee: Coffee
- Tee: Tea
- Milch: Milk
- Zucker: Sugar
- Süßstoff: Sweetener
- Kaffeesahne: Coffee creamer

**Lunch Terms**:
- Kleine Portion: Small portion
- Große Portion: Large portion
- Vollwertkost vegetarisch: Whole-food vegetarian
- Suppe: Soup
- passierte Kost: Pureed food
- passiertes Fleisch: Pureed meat
- geschnittenes Fleisch: Sliced meat
- Kartoffelbrei: Mashed potatoes
- ohne Fisch: No fish
- nur süß: Only sweet

**Dinner Terms**:
- Abendessen: Dinner
- Kakao: Cocoa

**Common Terms**:
- Zimmer: Room
- Tisch: Table
- Hochkalorisch: High calorie
- Abneigungen: Aversions/dislikes
- Sonstiges: Other notes

### Technology References

- **Payload CMS**: https://payloadcms.com/docs
- **PostgreSQL**: https://www.postgresql.org/docs/
- **Next.js**: https://nextjs.org/docs
- **TailwindCSS**: https://tailwindcss.com/docs
- **fast-check**: https://fast-check.dev/
- **Jest**: https://jestjs.io/docs
- **speakeasy (2FA)**: https://github.com/speakeasyjs/speakeasy
