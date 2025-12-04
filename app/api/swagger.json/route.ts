import { NextResponse } from 'next/server'
import { swaggerConfig } from '@/lib/swagger/config'

/**
 * GET /api/swagger.json
 * 
 * Returns the OpenAPI 3.0 specification in JSON format
 */
export async function GET() {
  const spec = {
    ...swaggerConfig.definition,
    paths: {
      '/api/users/login': {
        post: {
          tags: ['Authentication'],
          summary: 'User login',
          description: 'Authenticate with email and password. Returns access and refresh tokens.',
          security: [],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password'],
                  properties: {
                    email: {
                      type: 'string',
                      format: 'email',
                      example: 'admin@example.com',
                    },
                    password: {
                      type: 'string',
                      format: 'password',
                      example: 'test',
                    },
                    twoFactorCode: {
                      type: 'string',
                      description: 'Required if 2FA is enabled',
                      example: '123456',
                    },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: 'Login successful',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      user: {
                        $ref: '#/components/schemas/User',
                      },
                      token: {
                        type: 'string',
                        description: 'JWT access token',
                      },
                      refreshToken: {
                        type: 'string',
                        description: 'JWT refresh token',
                      },
                      exp: {
                        type: 'number',
                        description: 'Token expiration timestamp',
                      },
                    },
                  },
                },
              },
            },
            401: {
              description: 'Invalid credentials',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error',
                  },
                },
              },
            },
            429: {
              description: 'Too many login attempts',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error',
                  },
                },
              },
            },
          },
        },
      },
      '/api/users/refresh': {
        post: {
          tags: ['Authentication'],
          summary: 'Refresh access token',
          description: 'Exchange a refresh token for a new access token',
          security: [],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['refreshToken'],
                  properties: {
                    refreshToken: {
                      type: 'string',
                      description: 'Valid refresh token',
                    },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: 'Token refreshed successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      token: {
                        type: 'string',
                        description: 'New JWT access token',
                      },
                      refreshToken: {
                        type: 'string',
                        description: 'New JWT refresh token',
                      },
                      exp: {
                        type: 'number',
                        description: 'Token expiration timestamp',
                      },
                    },
                  },
                },
              },
            },
            401: {
              description: 'Invalid or expired refresh token',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error',
                  },
                },
              },
            },
          },
        },
      },
      '/api/users/logout': {
        post: {
          tags: ['Authentication'],
          summary: 'User logout',
          description: 'Invalidate the current refresh token',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['refreshToken'],
                  properties: {
                    refreshToken: {
                      type: 'string',
                      description: 'Refresh token to invalidate',
                    },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: 'Logout successful',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      message: {
                        type: 'string',
                        example: 'Logged out successfully',
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/users/enable-2fa': {
        post: {
          tags: ['Authentication'],
          summary: 'Enable two-factor authentication',
          description: 'Generate a 2FA secret and QR code for the authenticated user',
          responses: {
            200: {
              description: '2FA enabled successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      secret: {
                        type: 'string',
                        description: 'TOTP secret',
                      },
                      qrCode: {
                        type: 'string',
                        description: 'QR code data URL',
                      },
                    },
                  },
                },
              },
            },
            401: {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error',
                  },
                },
              },
            },
          },
        },
      },
      '/api/users/verify-2fa': {
        post: {
          tags: ['Authentication'],
          summary: 'Verify 2FA code',
          description: 'Verify a TOTP code during login',
          security: [],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'code'],
                  properties: {
                    email: {
                      type: 'string',
                      format: 'email',
                    },
                    code: {
                      type: 'string',
                      description: '6-digit TOTP code',
                      example: '123456',
                    },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: '2FA verification successful',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      valid: {
                        type: 'boolean',
                      },
                    },
                  },
                },
              },
            },
            401: {
              description: 'Invalid code',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error',
                  },
                },
              },
            },
          },
        },
      },
      '/api/kitchen/dashboard': {
        get: {
          tags: ['Kitchen'],
          summary: 'Get kitchen dashboard data',
          description: 'Returns summary statistics, ingredient aggregation, orders, and alerts for a specific date and meal type',
          parameters: [
            {
              name: 'date',
              in: 'query',
              required: true,
              schema: {
                type: 'string',
                format: 'date',
              },
              description: 'Date in YYYY-MM-DD format',
              example: '2024-12-04',
            },
            {
              name: 'mealType',
              in: 'query',
              required: true,
              schema: {
                type: 'string',
                enum: ['breakfast', 'lunch', 'dinner'],
              },
              description: 'Meal type',
              example: 'breakfast',
            },
          ],
          responses: {
            200: {
              description: 'Dashboard data retrieved successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      summary: {
                        type: 'object',
                        properties: {
                          totalOrders: { type: 'number' },
                          pendingOrders: { type: 'number' },
                          preparedOrders: { type: 'number' },
                          completedOrders: { type: 'number' },
                        },
                      },
                      ingredients: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            name: { type: 'string' },
                            category: { type: 'string' },
                            quantity: { type: 'number' },
                            unit: { type: 'string' },
                          },
                        },
                      },
                      orders: {
                        type: 'array',
                        items: {
                          $ref: '#/components/schemas/MealOrder',
                        },
                      },
                      alerts: {
                        type: 'array',
                        items: {
                          $ref: '#/components/schemas/Alert',
                        },
                      },
                    },
                  },
                },
              },
            },
            400: {
              description: 'Invalid parameters',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error',
                  },
                },
              },
            },
            401: {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error',
                  },
                },
              },
            },
          },
        },
      },
      '/api/kitchen/aggregate-ingredients': {
        get: {
          tags: ['Kitchen'],
          summary: 'Get aggregated ingredients',
          description: 'Calculate total ingredient quantities for a specific date and meal type',
          parameters: [
            {
              name: 'date',
              in: 'query',
              required: true,
              schema: {
                type: 'string',
                format: 'date',
              },
              description: 'Date in YYYY-MM-DD format',
            },
            {
              name: 'mealType',
              in: 'query',
              required: true,
              schema: {
                type: 'string',
                enum: ['breakfast', 'lunch', 'dinner'],
              },
              description: 'Meal type',
            },
          ],
          responses: {
            200: {
              description: 'Ingredients aggregated successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      date: { type: 'string', format: 'date' },
                      mealType: { type: 'string' },
                      totalOrders: { type: 'number' },
                      ingredients: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            name: { type: 'string' },
                            category: { type: 'string' },
                            quantity: { type: 'number' },
                            unit: { type: 'string' },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/meal-orders/search': {
        get: {
          tags: ['Meal Orders'],
          summary: 'Search meal orders',
          description: 'Search and filter meal orders by various criteria',
          parameters: [
            {
              name: 'residentName',
              in: 'query',
              schema: { type: 'string' },
              description: 'Filter by resident name (partial match)',
            },
            {
              name: 'roomNumber',
              in: 'query',
              schema: { type: 'string' },
              description: 'Filter by room number',
            },
            {
              name: 'mealType',
              in: 'query',
              schema: {
                type: 'string',
                enum: ['breakfast', 'lunch', 'dinner'],
              },
              description: 'Filter by meal type',
            },
            {
              name: 'status',
              in: 'query',
              schema: {
                type: 'string',
                enum: ['pending', 'prepared', 'completed'],
              },
              description: 'Filter by order status',
            },
            {
              name: 'startDate',
              in: 'query',
              schema: { type: 'string', format: 'date' },
              description: 'Filter by start date',
            },
            {
              name: 'endDate',
              in: 'query',
              schema: { type: 'string', format: 'date' },
              description: 'Filter by end date',
            },
            {
              name: 'urgent',
              in: 'query',
              schema: { type: 'boolean' },
              description: 'Filter by urgent flag',
            },
            {
              name: 'limit',
              in: 'query',
              schema: { type: 'number', default: 50 },
              description: 'Number of results per page',
            },
            {
              name: 'page',
              in: 'query',
              schema: { type: 'number', default: 1 },
              description: 'Page number',
            },
          ],
          responses: {
            200: {
              description: 'Search results',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      docs: {
                        type: 'array',
                        items: {
                          $ref: '#/components/schemas/MealOrder',
                        },
                      },
                      totalDocs: { type: 'number' },
                      limit: { type: 'number' },
                      page: { type: 'number' },
                      totalPages: { type: 'number' },
                      hasNextPage: { type: 'boolean' },
                      hasPrevPage: { type: 'boolean' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/residents/search': {
        get: {
          tags: ['Residents'],
          summary: 'Search residents',
          description: 'Search and filter residents by various criteria',
          parameters: [
            {
              name: 'name',
              in: 'query',
              schema: { type: 'string' },
              description: 'Filter by name (partial match)',
            },
            {
              name: 'roomNumber',
              in: 'query',
              schema: { type: 'string' },
              description: 'Filter by room number',
            },
            {
              name: 'station',
              in: 'query',
              schema: { type: 'string' },
              description: 'Filter by station',
            },
            {
              name: 'active',
              in: 'query',
              schema: { type: 'boolean' },
              description: 'Filter by active status',
            },
            {
              name: 'limit',
              in: 'query',
              schema: { type: 'number', default: 50 },
              description: 'Number of results per page',
            },
            {
              name: 'page',
              in: 'query',
              schema: { type: 'number', default: 1 },
              description: 'Page number',
            },
          ],
          responses: {
            200: {
              description: 'Search results',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      docs: {
                        type: 'array',
                        items: {
                          $ref: '#/components/schemas/Resident',
                        },
                      },
                      totalDocs: { type: 'number' },
                      limit: { type: 'number' },
                      page: { type: 'number' },
                      totalPages: { type: 'number' },
                      hasNextPage: { type: 'boolean' },
                      hasPrevPage: { type: 'boolean' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/alerts/{id}/acknowledge': {
        post: {
          tags: ['Alerts'],
          summary: 'Acknowledge an alert',
          description: 'Mark an alert as acknowledged by the current user',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' },
              description: 'Alert ID',
            },
          ],
          responses: {
            200: {
              description: 'Alert acknowledged successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      message: { type: 'string' },
                      alert: {
                        $ref: '#/components/schemas/Alert',
                      },
                    },
                  },
                },
              },
            },
            404: {
              description: 'Alert not found',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error',
                  },
                },
              },
            },
          },
        },
      },
      '/api/alerts/escalate': {
        post: {
          tags: ['Alerts'],
          summary: 'Escalate unacknowledged alerts',
          description: 'Escalate alerts that have been unacknowledged for more than 30 minutes',
          responses: {
            200: {
              description: 'Alerts escalated successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      escalated: { type: 'number' },
                      alerts: {
                        type: 'array',
                        items: {
                          $ref: '#/components/schemas/Alert',
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/reports/meal-orders': {
        get: {
          tags: ['Reports'],
          summary: 'Generate meal order report',
          description: 'Generate a report of meal orders with filtering and export options',
          parameters: [
            {
              name: 'startDate',
              in: 'query',
              required: true,
              schema: { type: 'string', format: 'date' },
              description: 'Report start date',
            },
            {
              name: 'endDate',
              in: 'query',
              required: true,
              schema: { type: 'string', format: 'date' },
              description: 'Report end date',
            },
            {
              name: 'mealType',
              in: 'query',
              schema: {
                type: 'string',
                enum: ['breakfast', 'lunch', 'dinner'],
              },
              description: 'Filter by meal type',
            },
            {
              name: 'residentId',
              in: 'query',
              schema: { type: 'string', format: 'uuid' },
              description: 'Filter by resident ID',
            },
            {
              name: 'status',
              in: 'query',
              schema: {
                type: 'string',
                enum: ['pending', 'prepared', 'completed'],
              },
              description: 'Filter by status',
            },
            {
              name: 'format',
              in: 'query',
              schema: {
                type: 'string',
                enum: ['json', 'csv', 'excel'],
                default: 'json',
              },
              description: 'Export format',
            },
          ],
          responses: {
            200: {
              description: 'Report generated successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: {
                        type: 'array',
                        items: {
                          $ref: '#/components/schemas/MealOrder',
                        },
                      },
                      summary: {
                        type: 'object',
                        properties: {
                          totalOrders: { type: 'number' },
                          byMealType: { type: 'object' },
                          byStatus: { type: 'object' },
                        },
                      },
                    },
                  },
                },
                'text/csv': {
                  schema: {
                    type: 'string',
                  },
                },
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
                  schema: {
                    type: 'string',
                    format: 'binary',
                  },
                },
              },
            },
          },
        },
      },
      '/api/reports/analytics': {
        get: {
          tags: ['Reports'],
          summary: 'Get analytics data',
          description: 'Get ingredient consumption trends and analytics over time',
          parameters: [
            {
              name: 'startDate',
              in: 'query',
              required: true,
              schema: { type: 'string', format: 'date' },
            },
            {
              name: 'endDate',
              in: 'query',
              required: true,
              schema: { type: 'string', format: 'date' },
            },
          ],
          responses: {
            200: {
              description: 'Analytics data retrieved successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      trends: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            date: { type: 'string', format: 'date' },
                            totalOrders: { type: 'number' },
                            byMealType: { type: 'object' },
                          },
                        },
                      },
                      topIngredients: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            name: { type: 'string' },
                            totalQuantity: { type: 'number' },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/archived/{collection}/{id}': {
        get: {
          tags: ['Archived Data'],
          summary: 'Retrieve archived data',
          description: 'Retrieve archived historical data (admin only)',
          parameters: [
            {
              name: 'collection',
              in: 'path',
              required: true,
              schema: { type: 'string' },
              description: 'Collection name',
              example: 'meal-orders',
            },
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' },
              description: 'Document ID',
            },
          ],
          responses: {
            200: {
              description: 'Archived data retrieved successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                  },
                },
              },
            },
            403: {
              description: 'Forbidden - Admin access required',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error',
                  },
                },
              },
            },
            404: {
              description: 'Archived data not found',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error',
                  },
                },
              },
            },
          },
        },
      },
      '/api/audit-logs': {
        get: {
          tags: ['Audit Logs'],
          summary: 'Get audit logs',
          description: 'Retrieve system audit logs (admin only)',
          parameters: [
            {
              name: 'userId',
              in: 'query',
              schema: { type: 'string', format: 'uuid' },
              description: 'Filter by user ID',
            },
            {
              name: 'action',
              in: 'query',
              schema: { type: 'string' },
              description: 'Filter by action type',
            },
            {
              name: 'startDate',
              in: 'query',
              schema: { type: 'string', format: 'date-time' },
              description: 'Filter by start date',
            },
            {
              name: 'endDate',
              in: 'query',
              schema: { type: 'string', format: 'date-time' },
              description: 'Filter by end date',
            },
            {
              name: 'limit',
              in: 'query',
              schema: { type: 'number', default: 50 },
            },
            {
              name: 'page',
              in: 'query',
              schema: { type: 'number', default: 1 },
            },
          ],
          responses: {
            200: {
              description: 'Audit logs retrieved successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      docs: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            id: { type: 'string', format: 'uuid' },
                            userId: { type: 'string', format: 'uuid' },
                            action: { type: 'string' },
                            collection: { type: 'string' },
                            documentId: { type: 'string' },
                            details: { type: 'object' },
                            createdAt: { type: 'string', format: 'date-time' },
                          },
                        },
                      },
                      totalDocs: { type: 'number' },
                      limit: { type: 'number' },
                      page: { type: 'number' },
                      totalPages: { type: 'number' },
                    },
                  },
                },
              },
            },
            403: {
              description: 'Forbidden - Admin access required',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error',
                  },
                },
              },
            },
          },
        },
      },
    },
  }

  return NextResponse.json(spec)
}
