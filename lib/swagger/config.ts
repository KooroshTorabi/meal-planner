/**
 * Swagger/OpenAPI Configuration
 * 
 * This file defines the OpenAPI 3.0 specification for the Meal Planner System API.
 * It provides interactive documentation accessible at /api-docs
 */

export const swaggerConfig = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Meal Planner System API',
      version: '1.0.0',
      description: `


A comprehensive digital meal planning and ordering system for elderly care homes.

## Features

- **Digital Meal Ordering**: Capture meal preferences for breakfast, lunch, and dinner
- **Ingredient Aggregation**: Automatically calculate total ingredient quantities
- **Preparation Tracking**: Mark orders as prepared and track progress
- **Multi-Channel Alerts**: Urgent order notifications via multiple channels
- **Role-Based Access Control**: Three user roles with granular permissions

## Authentication

Most endpoints require authentication using JWT tokens. Include the access token in the Authorization header:

\`\`\`
Authorization: Bearer <access_token>
\`\`\`

### Getting Started

1. **Login**: POST /api/users/login with credentials
2. **Get Token**: Receive access_token and refresh_token
3. **Use Token**: Include in Authorization header for subsequent requests
4. **Refresh**: Use refresh_token to get new access_token when expired

## User Roles

- **Admin**: Full system access
- **Caregiver**: Create and manage meal orders
- **Kitchen**: View orders, update status, manage preparation

## Rate Limiting

Authentication endpoints are rate-limited to 5 attempts per 15 minutes per IP address.
      `,
      contact: {
        name: 'API Support',
        email: 'support@mealplanner.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000',
        description: 'Development server',
      },
      {
        url: 'https://api.mealplanner.com',
        description: 'Production server',
      },
    ],
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and token management',
      },
      {
        name: 'Meal Orders',
        description: 'Meal order CRUD operations',
      },
      {
        name: 'Kitchen',
        description: 'Kitchen dashboard and ingredient aggregation',
      },
      {
        name: 'Residents',
        description: 'Resident search and information',
      },
      {
        name: 'Alerts',
        description: 'Alert management and acknowledgment',
      },
      {
        name: 'Reports',
        description: 'Report generation and analytics',
      },
      {
        name: 'Archived Data',
        description: 'Access to archived historical data',
      },
      {
        name: 'Audit Logs',
        description: 'System audit log access',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT access token obtained from /api/users/login',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error type',
            },
            message: {
              type: 'string',
              description: 'Human-readable error message',
            },
            details: {
              type: 'object',
              description: 'Additional error details',
            },
          },
        },
        ValidationError: {
          type: 'object',
          properties: {
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: {
                    type: 'string',
                  },
                  message: {
                    type: 'string',
                  },
                },
              },
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            email: {
              type: 'string',
              format: 'email',
            },
            role: {
              type: 'string',
              enum: ['admin', 'caregiver', 'kitchen'],
            },
            name: {
              type: 'string',
            },
            active: {
              type: 'boolean',
            },
            twoFactorEnabled: {
              type: 'boolean',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Resident: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            name: {
              type: 'string',
            },
            roomNumber: {
              type: 'string',
            },
            tableNumber: {
              type: 'string',
              nullable: true,
            },
            station: {
              type: 'string',
              nullable: true,
            },
            dietaryRestrictions: {
              type: 'array',
              items: {
                type: 'string',
              },
            },
            aversions: {
              type: 'string',
              nullable: true,
            },
            specialNotes: {
              type: 'string',
              nullable: true,
            },
            highCalorie: {
              type: 'boolean',
            },
            active: {
              type: 'boolean',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        MealOrder: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            resident: {
              oneOf: [
                { type: 'string', format: 'uuid' },
                { $ref: '#/components/schemas/Resident' },
              ],
            },
            date: {
              type: 'string',
              format: 'date',
            },
            mealType: {
              type: 'string',
              enum: ['breakfast', 'lunch', 'dinner'],
            },
            status: {
              type: 'string',
              enum: ['pending', 'prepared', 'completed'],
            },
            urgent: {
              type: 'boolean',
            },
            breakfastOptions: {
              type: 'object',
              nullable: true,
            },
            lunchOptions: {
              type: 'object',
              nullable: true,
            },
            dinnerOptions: {
              type: 'object',
              nullable: true,
            },
            specialNotes: {
              type: 'string',
              nullable: true,
            },
            preparedAt: {
              type: 'string',
              format: 'date-time',
              nullable: true,
            },
            preparedBy: {
              type: 'string',
              format: 'uuid',
              nullable: true,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
            createdBy: {
              type: 'string',
              format: 'uuid',
            },
            updatedBy: {
              type: 'string',
              format: 'uuid',
            },
          },
        },
        Alert: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            mealOrder: {
              type: 'string',
              format: 'uuid',
            },
            message: {
              type: 'string',
            },
            severity: {
              type: 'string',
              enum: ['low', 'medium', 'high', 'critical'],
            },
            acknowledged: {
              type: 'boolean',
            },
            acknowledgedBy: {
              type: 'string',
              format: 'uuid',
              nullable: true,
            },
            acknowledgedAt: {
              type: 'string',
              format: 'date-time',
              nullable: true,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./app/api/**/*.ts', './lib/swagger/paths/*.ts'],
}
