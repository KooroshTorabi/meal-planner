# Swagger/OpenAPI Documentation

## Overview

The Meal Planner System includes interactive API documentation powered by Swagger/OpenAPI 3.0. This provides a user-friendly interface for exploring and testing all API endpoints directly in your browser.

## Accessing the Documentation

### Development
Visit [http://localhost:3000/api-docs](http://localhost:3000/api-docs) when running the development server.

### Production
Visit `https://your-domain.com/api-docs` in production.

## Features

### 🎯 Interactive Testing
- Test API endpoints directly in the browser
- No need for Postman or curl
- Real-time request/response viewing
- Built-in authentication support

### 📝 Complete Documentation
- All endpoints documented with descriptions
- Request/response schemas with examples
- Parameter descriptions and validation rules
- Error response documentation

### 🔐 Authentication Testing
- Built-in authorization UI
- Test protected endpoints easily
- Token management interface
- Role-based access testing

### 📊 OpenAPI 3.0 Specification
- Industry-standard API specification
- Machine-readable format
- Can generate client SDKs
- Export specification for external tools

## Quick Start Guide

### 1. Access the Documentation
Navigate to `/api-docs` in your browser.

### 2. Authenticate
1. Expand the **Authentication** section
2. Click on **POST /api/users/login**
3. Click **Try it out**
4. Enter test credentials:
   ```json
   {
     "email": "admin@example.com",
     "password": "test"
   }
   ```
5. Click **Execute**
6. Copy the `token` value from the response

### 3. Authorize
1. Click the **Authorize** button at the top of the page
2. Paste your token in the format: `Bearer <your-token>`
3. Click **Authorize**
4. Click **Close**

### 4. Test Endpoints
Now you can test any protected endpoint:
1. Expand any endpoint section
2. Click **Try it out**
3. Fill in required parameters
4. Click **Execute**
5. View the response

## API Sections

### Authentication
- `POST /api/users/login` - User login
- `POST /api/users/refresh` - Refresh access token
- `POST /api/users/logout` - User logout
- `POST /api/users/enable-2fa` - Enable two-factor authentication
- `POST /api/users/verify-2fa` - Verify 2FA code

### Kitchen
- `GET /api/kitchen/dashboard` - Get kitchen dashboard data
- `GET /api/kitchen/aggregate-ingredients` - Get aggregated ingredients

### Meal Orders
- `GET /api/meal-orders/search` - Search meal orders

### Residents
- `GET /api/residents/search` - Search residents

### Alerts
- `POST /api/alerts/{id}/acknowledge` - Acknowledge an alert
- `POST /api/alerts/escalate` - Escalate unacknowledged alerts

### Reports
- `GET /api/reports/meal-orders` - Generate meal order report
- `GET /api/reports/analytics` - Get analytics data

### Archived Data
- `GET /api/archived/{collection}/{id}` - Retrieve archived data

### Audit Logs
- `GET /api/audit-logs` - Get audit logs

## Test Credentials

After seeding the database, use these credentials:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@example.com | test |
| Caregiver | caregiver@example.com | test |
| Kitchen | kitchen@example.com | test |

## Common Use Cases

### Testing Authentication Flow

1. **Login**:
   ```bash
   POST /api/users/login
   {
     "email": "admin@example.com",
     "password": "test"
   }
   ```

2. **Use Token**:
   - Copy the `token` from response
   - Click **Authorize** button
   - Enter: `Bearer <token>`

3. **Test Protected Endpoint**:
   ```bash
   GET /api/kitchen/dashboard?date=2024-12-04&mealType=breakfast
   ```

### Testing Role-Based Access

1. **Login as Caregiver**:
   ```json
   {
     "email": "caregiver@example.com",
     "password": "test"
   }
   ```

2. **Try Kitchen Endpoint**:
   - Should succeed (caregivers can view)

3. **Try Admin Endpoint**:
   - Should fail with 403 Forbidden

### Testing Search Functionality

1. **Search Residents**:
   ```bash
   GET /api/residents/search?name=John&active=true
   ```

2. **Search Meal Orders**:
   ```bash
   GET /api/meal-orders/search?mealType=breakfast&status=pending
   ```

### Testing Report Generation

1. **Generate Report**:
   ```bash
   GET /api/reports/meal-orders?startDate=2024-12-01&endDate=2024-12-31&format=json
   ```

2. **Export as CSV**:
   ```bash
   GET /api/reports/meal-orders?startDate=2024-12-01&endDate=2024-12-31&format=csv
   ```

## OpenAPI Specification

### Accessing the Spec

The raw OpenAPI specification is available at:
- **JSON**: `GET /api/swagger.json`

### Using the Spec

#### Generate Client SDK

```bash
# Install OpenAPI Generator
npm install -g @openapitools/openapi-generator-cli

# Generate TypeScript client
openapi-generator-cli generate \
  -i http://localhost:3000/api/swagger.json \
  -g typescript-fetch \
  -o ./generated-client
```

#### Import into Postman

1. Open Postman
2. Click **Import**
3. Enter URL: `http://localhost:3000/api/swagger.json`
4. Click **Import**

#### Use with API Testing Tools

```bash
# Test with curl
curl http://localhost:3000/api/swagger.json > openapi.json

# Validate spec
npx @apidevtools/swagger-cli validate openapi.json

# Generate documentation
npx redoc-cli bundle openapi.json
```

## Configuration

### Swagger Configuration

Located in `lib/swagger/config.ts`:

```typescript
export const swaggerConfig = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Meal Planner System API',
      version: '1.0.0',
      description: '...',
    },
    servers: [
      {
        url: process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000',
        description: 'Development server',
      },
    ],
    // ... more configuration
  },
}
```

### Customizing the UI

The Swagger UI page is located at `app/api-docs/page.tsx`:

```typescript
<SwaggerUI 
  url="/api/swagger.json"
  docExpansion="list"        // Expand sections by default
  defaultModelsExpandDepth={1}  // Model expansion depth
  defaultModelExpandDepth={1}   // Schema expansion depth
/>
```

Available options:
- `docExpansion`: `"list"` | `"full"` | `"none"`
- `defaultModelsExpandDepth`: Number (0 = collapsed)
- `filter`: Boolean (enable search filter)
- `showRequestHeaders`: Boolean
- `showCommonExtensions`: Boolean

## Adding New Endpoints

To document a new endpoint:

1. **Add to OpenAPI Spec** (`app/api/swagger.json/route.ts`):

```typescript
'/api/your-endpoint': {
  get: {
    tags: ['Your Tag'],
    summary: 'Brief description',
    description: 'Detailed description',
    parameters: [
      {
        name: 'param1',
        in: 'query',
        required: true,
        schema: { type: 'string' },
        description: 'Parameter description',
      },
    ],
    responses: {
      200: {
        description: 'Success response',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                // Define response schema
              },
            },
          },
        },
      },
    },
  },
}
```

2. **Add Schema** (if needed):

```typescript
components: {
  schemas: {
    YourModel: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        name: { type: 'string' },
        // ... more properties
      },
    },
  },
}
```

3. **Test the Documentation**:
   - Restart the dev server
   - Visit `/api-docs`
   - Verify your endpoint appears
   - Test the endpoint

## Best Practices

### Documentation

1. **Be Descriptive**: Write clear summaries and descriptions
2. **Provide Examples**: Include example values for parameters
3. **Document Errors**: Include all possible error responses
4. **Use Tags**: Group related endpoints with tags
5. **Version Your API**: Include version in the spec

### Testing

1. **Test All Roles**: Verify role-based access control
2. **Test Edge Cases**: Try invalid inputs and edge cases
3. **Test Error Responses**: Verify error handling
4. **Test Pagination**: Check limit and page parameters
5. **Test Filters**: Verify all filter combinations

### Maintenance

1. **Keep in Sync**: Update docs when changing endpoints
2. **Review Regularly**: Ensure docs match implementation
3. **Get Feedback**: Ask developers using the API
4. **Version Changes**: Document breaking changes
5. **Automate**: Consider generating docs from code

## Troubleshooting

### Swagger UI Not Loading

**Problem**: Blank page or loading error

**Solutions**:
1. Check browser console for errors
2. Verify `/api/swagger.json` returns valid JSON
3. Clear browser cache
4. Check for CORS issues

### Authentication Not Working

**Problem**: 401 Unauthorized after authorizing

**Solutions**:
1. Verify token format: `Bearer <token>`
2. Check token hasn't expired
3. Ensure you copied the full token
4. Try logging in again

### Endpoints Not Appearing

**Problem**: New endpoints don't show in Swagger UI

**Solutions**:
1. Restart the development server
2. Check OpenAPI spec syntax
3. Verify endpoint is in `/api/swagger.json`
4. Clear browser cache

### Request Fails in Swagger

**Problem**: Request works in Postman but fails in Swagger

**Solutions**:
1. Check request body format
2. Verify all required parameters are provided
3. Check for CORS issues
4. Verify authentication token

## Related Documentation

- [API Documentation](./API_DOCUMENTATION.md) - Narrative API documentation
- [Authentication Flow](./AUTHENTICATION_FLOW.md) - Authentication details
- [Testing Strategy](./TESTING_STRATEGY.md) - API testing guidelines
- [README](../README.md) - General project documentation

## Resources

### OpenAPI/Swagger
- [OpenAPI Specification](https://swagger.io/specification/)
- [Swagger UI Documentation](https://swagger.io/tools/swagger-ui/)
- [OpenAPI Generator](https://openapi-generator.tech/)

### Tools
- [Swagger Editor](https://editor.swagger.io/) - Online editor
- [Postman](https://www.postman.com/) - API testing
- [Insomnia](https://insomnia.rest/) - API client
- [ReDoc](https://redocly.com/redoc/) - Alternative documentation UI

## Support

For questions or issues with the API documentation:
- 📧 Email: support@mealplanner.com
- 📚 Documentation: [docs/](.)
- 🐛 Issues: [GitHub Issues](https://github.com/your-repo/issues)

---

**Interactive API documentation makes development faster and more enjoyable!** 🚀
