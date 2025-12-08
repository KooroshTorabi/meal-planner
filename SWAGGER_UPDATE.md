# Swagger API Documentation Update

## What Was Updated

Updated the Swagger/OpenAPI documentation to include all current API endpoints, especially the meal orders and authentication endpoints.

## New Endpoints Added to Swagger

### 1. Meal Orders CRUD Operations

#### GET /api/meal-orders
- Get list of meal orders with filtering
- Parameters: date, mealType, status, residentId, limit, page
- Returns paginated list of meal orders

#### POST /api/meal-orders
- Create a new meal order
- Request body: MealOrder schema
- Returns created meal order

#### GET /api/meal-orders/{id}
- Get a specific meal order by ID
- Returns single meal order

#### PATCH /api/meal-orders/{id}
- Update a meal order
- Kitchen users can only update status field
- Supports optimistic locking with version checking
- Returns updated meal order or 409 conflict if version mismatch
- **Examples included:**
  - Mark as prepared: `{"status": "prepared"}`
  - Mark as completed: `{"status": "completed"}`

#### DELETE /api/meal-orders/{id}
- Delete a meal order
- Only pending orders can be deleted
- Returns success message

### 2. Authentication Endpoint

#### POST /api/users/login-payload
- Login using Payload CMS authentication
- Request body: email and password
- Returns user object and access/refresh tokens
- **Examples included for all user types:**
  - Admin: `admin@example.com` / `test`
  - Caregiver: `caregiver@example.com` / `test`
  - Kitchen: `kitchen@example.com` / `test`

## How to Access Swagger Documentation

### Option 1: Swagger UI
Visit: http://localhost:3000/api-docs

This provides an interactive interface where you can:
- Browse all API endpoints
- See request/response schemas
- Try out API calls directly from the browser
- View examples for each endpoint

### Option 2: OpenAPI JSON
Visit: http://localhost:3000/api/swagger.json

This returns the raw OpenAPI 3.0 specification in JSON format.

## Testing with Swagger UI

### 1. Login
1. Go to http://localhost:3000/api-docs
2. Find `POST /api/users/login-payload` under "Authentication"
3. Click "Try it out"
4. Select an example (admin, caregiver, or kitchen)
5. Click "Execute"
6. Copy the `accessToken` from the response

### 2. Use Authenticated Endpoints
1. Click the "Authorize" button at the top of the page
2. Paste the access token
3. Click "Authorize"
4. Now you can test authenticated endpoints

### 3. Update Order Status (Kitchen User)
1. Login as kitchen user first
2. Find `PATCH /api/meal-orders/{id}` under "Meal Orders"
3. Click "Try it out"
4. Enter an order ID (e.g., 47)
5. Select the "Mark as prepared" example
6. Click "Execute"
7. See the updated order in the response

## API Endpoint Summary

### Authentication
- `POST /api/users/login` - Original login endpoint
- `POST /api/users/login-payload` - Payload CMS login (NEW)
- `POST /api/users/refresh` - Refresh access token
- `POST /api/users/logout` - Logout
- `POST /api/users/enable-2fa` - Enable 2FA
- `POST /api/users/verify-2fa` - Verify 2FA code

### Meal Orders
- `GET /api/meal-orders` - List meal orders (NEW)
- `POST /api/meal-orders` - Create meal order (NEW)
- `GET /api/meal-orders/{id}` - Get meal order (NEW)
- `PATCH /api/meal-orders/{id}` - Update meal order (NEW)
- `DELETE /api/meal-orders/{id}` - Delete meal order (NEW)
- `GET /api/meal-orders/search` - Search meal orders

### Kitchen
- `GET /api/kitchen/dashboard` - Get kitchen dashboard data
- `GET /api/kitchen/aggregate-ingredients` - Get aggregated ingredients

### Residents
- `GET /api/residents/search` - Search residents

### Alerts
- `POST /api/alerts/{id}/acknowledge` - Acknowledge alert
- `POST /api/alerts/escalate` - Escalate unacknowledged alerts

### Reports
- `GET /api/reports/meal-orders` - Generate meal order report
- `GET /api/reports/analytics` - Get analytics data

### Audit Logs
- `GET /api/audit-logs` - Get audit logs (admin only)

### Archived Data
- `GET /api/archived/{collection}/{id}` - Retrieve archived data (admin only)

## Response Schemas

All endpoints return proper response schemas with:
- Success responses (200, 201)
- Error responses (400, 401, 403, 404, 409, 500)
- Detailed error messages
- Proper content types

## Security

- Most endpoints require authentication (Bearer token)
- Role-based access control documented
- Admin-only endpoints clearly marked
- Kitchen users can only update order status

## Files Modified

- ✅ `app/api/swagger.json/route.ts` - Added meal orders CRUD and login-payload endpoints

## Next Steps

1. Visit http://localhost:3000/api-docs to see the updated documentation
2. Test the new endpoints using the Swagger UI
3. Use the examples provided for quick testing
4. Share the API documentation with your team

## Benefits

1. **Complete Documentation**: All current endpoints are now documented
2. **Interactive Testing**: Test APIs directly from the browser
3. **Examples Included**: Pre-filled examples for common use cases
4. **Role-Based Access**: Clear documentation of who can access what
5. **Error Handling**: All error responses documented
6. **Easy Integration**: OpenAPI spec can be imported into Postman, Insomnia, etc.
