# API Documentation

This document provides comprehensive documentation for all API endpoints in the Meal Planner System.

## Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Authentication Endpoints](#authentication-endpoints)
- [Meal Order Endpoints](#meal-order-endpoints)
- [Kitchen Endpoints](#kitchen-endpoints)
- [Alert Endpoints](#alert-endpoints)
- [Report Endpoints](#report-endpoints)
- [Resident Endpoints](#resident-endpoints)
- [Audit Log Endpoints](#audit-log-endpoints)
- [Archived Data Endpoints](#archived-data-endpoints)

## Overview

The Meal Planner API is a RESTful API built with Next.js API Routes and Payload CMS. All endpoints return JSON responses and use standard HTTP status codes.

### Base URL

```
Development: http://localhost:3000
Production: https://your-domain.com
```

### Content Type

All requests and responses use `application/json` content type.

### API Versioning

Currently, the API is unversioned. Future versions will use URL-based versioning (e.g., `/api/v2/...`).

## Authentication

Most endpoints require authentication using JWT (JSON Web Tokens).

### Authentication Header

Include the access token in the Authorization header:

```
Authorization: Bearer <access_token>
```

### Token Types

1. **Access Token**: Short-lived (15 minutes), used for API requests
2. **Refresh Token**: Long-lived (7 days), used to obtain new access tokens

### Authentication Flow

1. Login with credentials → Receive access token + refresh token
2. Use access token for API requests
3. When access token expires → Use refresh token to get new access token
4. When refresh token expires → Login again


## Error Handling

### Error Response Format

All errors follow a consistent format:

```json
{
  "error": "Error Type",
  "message": "User-friendly error message",
  "statusCode": 400,
  "field": "fieldName",
  "requestId": "req_1234567890_abc123"
}
```

### HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request succeeded |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid request data |
| 401 | Unauthorized | Authentication required or failed |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Duplicate resource or version conflict |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |
| 503 | Service Unavailable | External service failure |

### Common Error Messages

**Validation Error (400)**:
```json
{
  "error": "Validation Error",
  "message": "Email is required",
  "statusCode": 400,
  "field": "email"
}
```

**Authentication Error (401)**:
```json
{
  "error": "Authentication failed",
  "message": "Invalid credentials provided",
  "statusCode": 401
}
```

**Authorization Error (403)**:
```json
{
  "error": "Access denied",
  "message": "Kitchen staff cannot modify resident records",
  "statusCode": 403
}
```

**Not Found Error (404)**:
```json
{
  "error": "Resource not found",
  "message": "Meal order with ID abc123 does not exist",
  "statusCode": 404
}
```

**Conflict Error (409)**:
```json
{
  "error": "Conflict detected",
  "message": "A meal order already exists for this resident, date, and meal type",
  "statusCode": 409,
  "existingOrder": { "id": "xyz789" }
}
```

## Rate Limiting

Authentication endpoints are rate-limited to prevent brute force attacks.

### Limits

- **Max Attempts**: 5 failed login attempts
- **Window**: 15 minutes
- **Lockout**: 15 minutes after max attempts

### Rate Limit Response

```json
{
  "error": "Too many failed login attempts. Please try again later.",
  "retryAfter": 900,
  "statusCode": 429
}
```


## Authentication Endpoints

### POST /api/users/login

Authenticate user with email and password. Returns access token and refresh token.

**Authentication**: None required

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123",
  "twoFactorCode": "123456"
}
```

**Request Fields**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | string | Yes | User's email address |
| password | string | Yes | User's password |
| twoFactorCode | string | Conditional | Required if 2FA is enabled |

**Success Response (200)**:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "caregiver"
  }
}
```

**Error Responses**:
- `400`: Missing email or password
- `401`: Invalid credentials, inactive account, or invalid 2FA code
- `429`: Rate limit exceeded

**Example**:
```bash
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "caregiver@example.com",
    "password": "test"
  }'
```

---

### POST /api/users/refresh

Exchange refresh token for new access token.

**Authentication**: None required (uses refresh token)

**Request Body**:
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Success Response (200)**:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses**:
- `400`: Missing refresh token
- `401`: Invalid or expired refresh token

---

### POST /api/users/logout

Invalidate current refresh token.

**Authentication**: Required (Bearer token)

**Request Body**:
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Success Response (200)**:
```json
{
  "message": "Logged out successfully"
}
```

---

### POST /api/users/enable-2fa

Enable two-factor authentication for the current user.

**Authentication**: Required (Bearer token)

**Request Body**: None

**Success Response (200)**:
```json
{
  "secret": "JBSWY3DPEHPK3PXP",
  "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "message": "2FA enabled successfully"
}
```

---

### POST /api/users/verify-2fa

Verify 2FA code during login.

**Authentication**: None required

**Request Body**:
```json
{
  "email": "user@example.com",
  "twoFactorCode": "123456"
}
```

**Success Response (200)**:
```json
{
  "verified": true
}
```

**Error Responses**:
- `400`: Missing email or 2FA code
- `401`: Invalid 2FA code


## Meal Order Endpoints

### POST /api/meal-orders

Create a new meal order.

**Authentication**: Required (Admin or Caregiver)

**Request Body**:
```json
{
  "resident": "resident-id",
  "date": "2024-01-15",
  "mealType": "breakfast",
  "urgent": false,
  "breakfastOptions": {
    "followsPlan": false,
    "breadItems": ["brötchen", "graubrot"],
    "breadPreparation": ["geschnitten"],
    "spreads": ["butter", "konfitüre"],
    "porridge": false,
    "beverages": ["kaffee"],
    "additions": ["zucker"]
  },
  "specialNotes": "Extra butter please"
}
```

**Request Fields**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| resident | string | Yes | Resident ID |
| date | string | Yes | Date in ISO format (YYYY-MM-DD) |
| mealType | string | Yes | One of: breakfast, lunch, dinner |
| urgent | boolean | No | Mark as urgent (triggers alerts) |
| breakfastOptions | object | Conditional | Required if mealType is breakfast |
| lunchOptions | object | Conditional | Required if mealType is lunch |
| dinnerOptions | object | Conditional | Required if mealType is dinner |
| specialNotes | string | No | Additional notes |

**Success Response (201)**:
```json
{
  "id": "order-id",
  "resident": "resident-id",
  "date": "2024-01-15",
  "mealType": "breakfast",
  "status": "pending",
  "urgent": false,
  "version": 1,
  "breakfastOptions": { ... },
  "createdAt": "2024-01-15T08:00:00.000Z",
  "updatedAt": "2024-01-15T08:00:00.000Z"
}
```

**Error Responses**:
- `400`: Missing required fields or invalid data
- `401`: Not authenticated
- `403`: Insufficient permissions
- `409`: Duplicate order (resident + date + mealType already exists)

---

### GET /api/meal-orders

Get meal orders with optional filtering.

**Authentication**: Required (All roles)

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| date | string | No | Filter by date (YYYY-MM-DD) |
| mealType | string | No | Filter by meal type |
| resident | string | No | Filter by resident ID |
| status | string | No | Filter by status |
| page | number | No | Page number (default: 1) |
| limit | number | No | Results per page (default: 50) |

**Success Response (200)**:
```json
{
  "docs": [
    {
      "id": "order-id",
      "resident": { ... },
      "date": "2024-01-15",
      "mealType": "breakfast",
      "status": "pending",
      ...
    }
  ],
  "totalDocs": 100,
  "limit": 50,
  "page": 1,
  "totalPages": 2,
  "hasNextPage": true,
  "hasPrevPage": false
}
```

**Example**:
```bash
curl -X GET "http://localhost:3000/api/meal-orders?date=2024-01-15&mealType=breakfast" \
  -H "Authorization: Bearer <access_token>"
```

---

### GET /api/meal-orders/:id

Get a specific meal order by ID.

**Authentication**: Required (All roles)

**Success Response (200)**:
```json
{
  "id": "order-id",
  "resident": { ... },
  "date": "2024-01-15",
  "mealType": "breakfast",
  "status": "pending",
  "breakfastOptions": { ... },
  ...
}
```

**Error Responses**:
- `401`: Not authenticated
- `404`: Meal order not found

---

### PATCH /api/meal-orders/:id

Update a meal order.

**Authentication**: Required (Admin, Caregiver for pending orders, Kitchen for status only)

**Request Body**:
```json
{
  "status": "prepared",
  "version": 1
}
```

**Success Response (200)**:
```json
{
  "id": "order-id",
  "status": "prepared",
  "version": 2,
  "preparedAt": "2024-01-15T10:00:00.000Z",
  "preparedBy": "user-id",
  ...
}
```

**Error Responses**:
- `401`: Not authenticated
- `403`: Insufficient permissions or order is prepared/completed
- `404`: Meal order not found
- `409`: Version conflict (concurrent modification detected)

---

### DELETE /api/meal-orders/:id

Delete a meal order.

**Authentication**: Required (Admin only)

**Success Response (200)**:
```json
{
  "message": "Meal order deleted successfully"
}
```

---

### GET /api/meal-orders/search

Search meal orders with advanced filtering.

**Authentication**: Required (All roles)

**Query Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| q | string | Search query (resident name, room number) |
| date | string | Filter by date |
| mealType | string | Filter by meal type |
| status | string | Filter by status |
| urgent | boolean | Filter by urgent flag |
| page | number | Page number |
| limit | number | Results per page |

**Success Response (200)**:
```json
{
  "docs": [ ... ],
  "totalDocs": 50,
  "page": 1,
  "totalPages": 1
}
```

---

### POST /api/meal-orders/:id/resolve-conflict

Resolve a version conflict by providing the merged result.

**Authentication**: Required (Admin or Caregiver)

**Request Body**:
```json
{
  "mergedData": {
    "status": "pending",
    "breakfastOptions": { ... },
    ...
  },
  "version": 2
}
```

**Success Response (200)**:
```json
{
  "id": "order-id",
  "version": 3,
  ...
}
```


## Kitchen Endpoints

### GET /api/kitchen/dashboard

Get kitchen dashboard data including summary statistics, ingredient aggregation, orders, and alerts.

**Authentication**: Required (Admin or Kitchen)

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| date | string | Yes | Date in ISO format (YYYY-MM-DD) |
| mealType | string | Yes | One of: breakfast, lunch, dinner |

**Success Response (200)**:
```json
{
  "summary": {
    "totalOrders": 50,
    "pendingOrders": 30,
    "preparedOrders": 15,
    "completedOrders": 5
  },
  "ingredients": [
    {
      "name": "brötchen",
      "category": "bread",
      "quantity": 82,
      "unit": "pieces"
    },
    {
      "name": "butter",
      "category": "spread",
      "quantity": 65,
      "unit": "portions"
    }
  ],
  "orders": [
    {
      "id": "order-id",
      "resident": { ... },
      "status": "pending",
      ...
    }
  ],
  "alerts": [
    {
      "id": "alert-id",
      "message": "Urgent breakfast order for John Doe (Room 101)",
      "severity": "high",
      "acknowledged": false,
      ...
    }
  ]
}
```

**Error Responses**:
- `400`: Missing or invalid parameters
- `401`: Not authenticated
- `403`: Insufficient permissions

**Example**:
```bash
curl -X GET "http://localhost:3000/api/kitchen/dashboard?date=2024-01-15&mealType=breakfast" \
  -H "Authorization: Bearer <access_token>"
```

---

### GET /api/kitchen/aggregate-ingredients

Get aggregated ingredient quantities for a specific date and meal type.

**Authentication**: Required (Admin or Kitchen)

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| date | string | Yes | Date in ISO format (YYYY-MM-DD) |
| mealType | string | Yes | One of: breakfast, lunch, dinner |

**Success Response (200)**:
```json
{
  "date": "2024-01-15",
  "mealType": "breakfast",
  "totalOrders": 50,
  "ingredients": [
    {
      "name": "brötchen",
      "category": "bread",
      "quantity": 82,
      "unit": "pieces"
    },
    {
      "name": "butter",
      "category": "spread",
      "quantity": 65,
      "unit": "portions"
    },
    {
      "name": "kaffee",
      "category": "beverage",
      "quantity": 45,
      "unit": "cups"
    }
  ],
  "page": 1,
  "totalPages": 1
}
```

**Error Responses**:
- `400`: Missing or invalid parameters
- `401`: Not authenticated
- `403`: Insufficient permissions

**Example**:
```bash
curl -X GET "http://localhost:3000/api/kitchen/aggregate-ingredients?date=2024-01-15&mealType=breakfast" \
  -H "Authorization: Bearer <access_token>"
```


## Alert Endpoints

### POST /api/alerts/:id/acknowledge

Acknowledge an alert.

**Authentication**: Required (Admin or Kitchen)

**Request Body**: None

**Success Response (200)**:
```json
{
  "id": "alert-id",
  "acknowledged": true,
  "acknowledgedBy": "user-id",
  "acknowledgedAt": "2024-01-15T10:00:00.000Z",
  ...
}
```

**Error Responses**:
- `401`: Not authenticated
- `403`: Insufficient permissions
- `404`: Alert not found

**Example**:
```bash
curl -X POST http://localhost:3000/api/alerts/alert-id/acknowledge \
  -H "Authorization: Bearer <access_token>"
```

---

### POST /api/alerts/escalate

Escalate unacknowledged alerts older than 30 minutes to admin users.

**Authentication**: Required (Admin or Kitchen)

**Request Body**: None

**Success Response (200)**:
```json
{
  "escalated": 5,
  "alerts": [
    {
      "id": "alert-id",
      "message": "Urgent breakfast order for John Doe (Room 101)",
      "createdAt": "2024-01-15T09:00:00.000Z",
      ...
    }
  ]
}
```

**Error Responses**:
- `401`: Not authenticated
- `403`: Insufficient permissions


## Report Endpoints

### GET /api/reports/meal-orders

Generate meal order report with filtering and export options.

**Authentication**: Required (Admin or Kitchen)

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| startDate | string | Yes | Start date (YYYY-MM-DD) |
| endDate | string | Yes | End date (YYYY-MM-DD) |
| mealType | string | No | Filter by meal type |
| residentId | string | No | Filter by resident |
| status | string | No | Filter by status |
| format | string | No | Export format: json, csv, excel (default: json) |

**Success Response (200 - JSON)**:
```json
{
  "data": [
    {
      "id": "order-id",
      "resident": { ... },
      "date": "2024-01-15",
      "mealType": "breakfast",
      "status": "prepared",
      ...
    }
  ],
  "summary": {
    "totalOrders": 150,
    "byMealType": {
      "breakfast": 50,
      "lunch": 50,
      "dinner": 50
    },
    "byStatus": {
      "pending": 30,
      "prepared": 70,
      "completed": 50
    }
  }
}
```

**Success Response (200 - CSV)**:
```csv
ID,Resident,Date,Meal Type,Status,Created At
order-1,John Doe,2024-01-15,breakfast,prepared,2024-01-15T08:00:00.000Z
order-2,Jane Smith,2024-01-15,breakfast,pending,2024-01-15T08:05:00.000Z
```

**Error Responses**:
- `400`: Missing or invalid parameters
- `401`: Not authenticated
- `403`: Insufficient permissions

**Example**:
```bash
curl -X GET "http://localhost:3000/api/reports/meal-orders?startDate=2024-01-01&endDate=2024-01-31&format=csv" \
  -H "Authorization: Bearer <access_token>"
```

---

### GET /api/reports/analytics

Get analytics data for ingredient consumption trends.

**Authentication**: Required (Admin or Kitchen)

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| startDate | string | Yes | Start date (YYYY-MM-DD) |
| endDate | string | Yes | End date (YYYY-MM-DD) |
| mealType | string | No | Filter by meal type |

**Success Response (200)**:
```json
{
  "period": {
    "startDate": "2024-01-01",
    "endDate": "2024-01-31"
  },
  "trends": [
    {
      "date": "2024-01-01",
      "ingredients": {
        "brötchen": 82,
        "butter": 65,
        "kaffee": 45
      }
    },
    {
      "date": "2024-01-02",
      "ingredients": {
        "brötchen": 78,
        "butter": 62,
        "kaffee": 43
      }
    }
  ],
  "totals": {
    "brötchen": 2460,
    "butter": 1950,
    "kaffee": 1350
  },
  "averages": {
    "brötchen": 79.4,
    "butter": 62.9,
    "kaffee": 43.5
  }
}
```

**Error Responses**:
- `400`: Missing or invalid parameters
- `401`: Not authenticated
- `403`: Insufficient permissions


## Resident Endpoints

### GET /api/residents/search

Search residents by name, room number, dietary restrictions, and other criteria.

**Authentication**: Required (All roles)

**Query Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| q | string | Search query (name, room number) |
| roomNumber | string | Filter by room number |
| station | string | Filter by station |
| active | boolean | Filter by active status |
| page | number | Page number (default: 1) |
| limit | number | Results per page (default: 50) |

**Success Response (200)**:
```json
{
  "docs": [
    {
      "id": "resident-id",
      "name": "John Doe",
      "roomNumber": "101",
      "tableNumber": "5",
      "station": "West Wing",
      "dietaryRestrictions": [
        { "restriction": "No dairy" },
        { "restriction": "Low sodium" }
      ],
      "active": true,
      ...
    }
  ],
  "totalDocs": 25,
  "page": 1,
  "totalPages": 1
}
```

**Error Responses**:
- `401`: Not authenticated

**Example**:
```bash
curl -X GET "http://localhost:3000/api/residents/search?q=John&active=true" \
  -H "Authorization: Bearer <access_token>"
```


## Audit Log Endpoints

### GET /api/audit-logs

Get audit logs with filtering.

**Authentication**: Required (Admin only)

**Query Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| action | string | Filter by action type |
| userId | string | Filter by user ID |
| email | string | Filter by email |
| status | string | Filter by status (success, failure, denied) |
| startDate | string | Filter by start date |
| endDate | string | Filter by end date |
| page | number | Page number (default: 1) |
| limit | number | Results per page (default: 50) |

**Success Response (200)**:
```json
{
  "docs": [
    {
      "id": "log-id",
      "action": "login_success",
      "userId": "user-id",
      "email": "user@example.com",
      "status": "success",
      "ipAddress": "192.168.1.1",
      "userAgent": "Mozilla/5.0...",
      "createdAt": "2024-01-15T08:00:00.000Z",
      ...
    }
  ],
  "totalDocs": 500,
  "page": 1,
  "totalPages": 10
}
```

**Error Responses**:
- `401`: Not authenticated
- `403`: Insufficient permissions (Admin only)

**Example**:
```bash
curl -X GET "http://localhost:3000/api/audit-logs?action=login_failure&startDate=2024-01-01" \
  -H "Authorization: Bearer <access_token>"
```


## Archived Data Endpoints

### GET /api/archived/:collection/:id

Retrieve archived data for a specific document.

**Authentication**: Required (Admin only)

**Path Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| collection | string | Collection name (e.g., meal-orders) |
| id | string | Document ID |

**Success Response (200)**:
```json
{
  "id": "archived-record-id",
  "collectionName": "meal-orders",
  "documentId": "order-id",
  "data": {
    "id": "order-id",
    "resident": "resident-id",
    "date": "2023-01-15",
    ...
  },
  "originalCreatedAt": "2023-01-15T08:00:00.000Z",
  "archivedAt": "2024-01-15T02:00:00.000Z",
  "retentionPeriodDays": 90
}
```

**Error Responses**:
- `401`: Not authenticated
- `403`: Insufficient permissions (Admin only)
- `404`: Archived record not found

**Example**:
```bash
curl -X GET http://localhost:3000/api/archived/meal-orders/order-id \
  -H "Authorization: Bearer <access_token>"
```

---

## Payload CMS Admin API

In addition to custom endpoints, Payload CMS provides auto-generated REST API endpoints for all collections:

### Collection Endpoints

For each collection (users, residents, meal-orders, etc.):

- `GET /api/{collection}` - List documents
- `POST /api/{collection}` - Create document
- `GET /api/{collection}/:id` - Get document by ID
- `PATCH /api/{collection}/:id` - Update document
- `DELETE /api/{collection}/:id` - Delete document

### Authentication

Use the same Bearer token authentication for Payload CMS endpoints.

### Documentation

For detailed Payload CMS API documentation, see:
- [Payload REST API Docs](https://payloadcms.com/docs/rest-api/overview)

---

## WebSocket API

The system supports WebSocket connections for real-time alerts.

### Connection

```javascript
const ws = new WebSocket('ws://localhost:3000/ws')

ws.onopen = () => {
  console.log('Connected to WebSocket')
}

ws.onmessage = (event) => {
  const alert = JSON.parse(event.data)
  console.log('Received alert:', alert)
}
```

### Alert Message Format

```json
{
  "type": "alert",
  "data": {
    "id": "alert-id",
    "message": "Urgent breakfast order for John Doe (Room 101)",
    "severity": "high",
    "mealOrder": "order-id",
    "createdAt": "2024-01-15T09:00:00.000Z"
  }
}
```

---

## Best Practices

### 1. Always Include Authorization Header

```javascript
fetch('/api/meal-orders', {
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  }
})
```

### 2. Handle Token Expiration

```javascript
async function apiRequest(url, options) {
  let response = await fetch(url, options)
  
  if (response.status === 401) {
    // Token expired, refresh it
    const newToken = await refreshAccessToken()
    options.headers.Authorization = `Bearer ${newToken}`
    response = await fetch(url, options)
  }
  
  return response
}
```

### 3. Implement Retry Logic

```javascript
async function apiRequestWithRetry(url, options, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options)
      if (response.ok) return response
      if (response.status < 500) throw new Error('Client error')
    } catch (error) {
      if (i === maxRetries - 1) throw error
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
    }
  }
}
```

### 4. Use Pagination

```javascript
async function getAllOrders() {
  let page = 1
  let allOrders = []
  let hasMore = true
  
  while (hasMore) {
    const response = await fetch(`/api/meal-orders?page=${page}&limit=50`)
    const data = await response.json()
    allOrders = [...allOrders, ...data.docs]
    hasMore = data.hasNextPage
    page++
  }
  
  return allOrders
}
```

### 5. Handle Errors Gracefully

```javascript
try {
  const response = await fetch('/api/meal-orders', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(orderData)
  })
  
  if (!response.ok) {
    const error = await response.json()
    console.error('API Error:', error.message)
    // Show user-friendly error message
    showError(error.message)
  }
  
  const data = await response.json()
  return data
} catch (error) {
  console.error('Network Error:', error)
  showError('Network error. Please check your connection.')
}
```

---

## Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| /api/users/login | 5 attempts | 15 minutes |
| /api/users/refresh | 10 requests | 1 minute |
| All other endpoints | No limit | - |

---

## Changelog

### Version 1.0.0 (Current)
- Initial API release
- Authentication endpoints
- Meal order CRUD
- Kitchen dashboard
- Alert management
- Reporting
- Audit logging

---

## Support

For API support:
- 📧 Email: api-support@mealplanner.com
- 📚 Documentation: [docs/](../docs/)
- 🐛 Issues: [GitHub Issues](https://github.com/your-repo/issues)

---

**Last Updated**: December 2024
