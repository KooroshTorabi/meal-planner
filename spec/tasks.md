# Implementation Plan: Meal Planner System

## Task List

- [x] 1. Initialize project structure and dependencies
  - Create Next.js project with TypeScript
  - Install Payload CMS with PostgreSQL adapter
  - Install TailwindCSS and configure for responsive design with dark mode
  - Install testing dependencies (Jest, fast-check)
  - Install authentication dependencies (jsonwebtoken, bcrypt, speakeasy for 2FA)
  - Set up environment variables and configuration files
  - _Requirements: 14.1_

- [-] 2. Configure Payload CMS core
  - [x] 2.1 Create payload.config.ts with PostgreSQL adapter
    - Configure database connection
    - Set up admin panel customization
    - Configure CORS and security settings
    - _Requirements: 14.1, 14.2_
  
  - [x] 2.2 Implement seed script with onInit hook
    - Create three user accounts (admin, caregiver, kitchen) with specified credentials
    - Generate 10+ sample residents with varied dietary restrictions
    - Generate 20+ sample meal orders across all meal types and dates
    - Include mix of pending and prepared orders
    - Implement idempotency check to prevent duplicate seeding
    - _Requirements: 13.1, 13.2, 13.3, 13.4_
  
  - [x] 2.3 Write property test for seed script idempotency
    - **Property 28: Seed script idempotency**
    - **Validates: Requirements 13.5**

- [x] 3. Implement Users collection with authentication
  - [x] 3.1 Create Users collection schema
    - Define fields: email, password, role, name, active, twoFactorEnabled, twoFactorSecret
    - Implement role enum validation (admin, caregiver, kitchen)
    - Set up password hashing with bcrypt
    - Configure refresh token storage
    - _Requirements: 1.1, 9.1_
  
  - [x] 3.2 Write property test for user role assignment
    - **Property 1: User role assignment validity**
    - **Validates: Requirements 1.1**
  
  - [x] 3.3 Implement access control rules for Users collection
    - Admin: Full CRUD access
    - Caregiver: Read own profile, update own password
    - Kitchen: Read own profile, update own password
    - _Requirements: 1.5, 12.1_
  
  - [x] 3.4 Write property test for admin full access
    - **Property 4: Admin full access**
    - **Validates: Requirements 1.5**
  
  - [x] 3.5 Create custom authentication endpoints
    - POST /api/users/login - validate credentials, generate tokens
    - POST /api/users/refresh - exchange refresh token for new access token
    - POST /api/users/logout - invalidate refresh token
    - POST /api/users/enable-2fa - enable two-factor authentication
    - POST /api/users/verify-2fa - verify 2FA code during login
    - _Requirements: 9.1, 9.2, 9.3, 9.4_
  
  - [x] 3.6 Write property tests for authentication flows
    - **Property 16: Authentication token generation**
    - **Property 17: Refresh token exchange**
    - **Property 18: Two-factor authentication enforcement**
    - **Property 19: Logout token invalidation**
    - **Property 20: Failed authentication logging**
    - **Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5**
  
  - [x] 3.7 Implement rate limiting for authentication
    - Limit to 5 failed attempts per 15 minutes per IP
    - Log all failed authentication attempts
    - _Requirements: 9.5, NFR-2_
  
  - [x] 3.8 Write property test for role-based permission enforcement
    - **Property 2: Role-based permission enforcement**
    - **Validates: Requirements 1.3**
  
  - [x] 3.9 Write property test for deactivated user authentication
    - **Property 3: Deactivated user authentication rejection**
    - **Validates: Requirements 1.4**

- [x] 4. Implement Residents collection
  - [x] 4.1 Create Residents collection schema
    - Define fields: name, roomNumber, tableNumber, station, dietaryRestrictions, aversions, specialNotes, highCalorie, active
    - Implement required field validation for name and roomNumber
    - Set up audit fields (createdBy, updatedBy, createdAt, updatedAt)
    - _Requirements: 7.1, 7.2_
  
  - [x] 4.2 Write property test for resident required fields
    - **Property 11: Resident required fields validation**
    - **Validates: Requirements 7.1**
  
  - [x] 4.3 Implement access control rules for Residents collection
    - Admin: Full CRUD access
    - Caregiver: Read access only
    - Kitchen: Read access only
    - _Requirements: 12.2, 12.3_
  
  - [x] 4.4 Write property test for unauthorized access denial
    - **Property 25: Unauthorized access denial**
    - **Validates: Requirements 12.2, 12.3**
  
  - [x] 4.5 Implement beforeChange hook for resident updates
    - Verify meal order preservation on resident updates
    - Display warnings for dietary restrictions
    - _Requirements: 7.3, 7.5_
  
  - [x] 4.6 Write property test for resident update preservation
    - **Property 12: Resident update preserves meal orders**
    - **Validates: Requirements 7.3**
  
  - [x] 4.7 Write property test for inactive resident order prevention
    - **Property 13: Inactive resident order prevention**
    - **Validates: Requirements 7.4**

- [x] 5. Implement Meal Orders collection
  - [x] 5.1 Create Meal Orders collection schema
    - Define fields: resident, date, mealType, status, urgent
    - Define conditional fields: breakfastOptions, lunchOptions, dinnerOptions
    - Implement unique constraint on (resident, date, mealType)
    - Set up audit fields and status tracking
    - _Requirements: 2.2, 2.3, 2.5, 3.1, 3.2, 3.3_
  
  - [x] 5.2 Write property test for meal order uniqueness
    - **Property 5: Meal order uniqueness constraint**
    - **Validates: Requirements 2.5**
  
  - [x] 5.3 Write property test for meal order creation validation
    - **Property 6: Meal order creation validation**
    - **Validates: Requirements 2.2, 2.3**
  
  - [x] 5.4 Create meal-specific option schemas
    - BreakfastOptions: breadItems, breadPreparation, spreads, porridge, beverages, additions
    - LunchOptions: portionSize, soup, dessert, specialPreparations, restrictions
    - DinnerOptions: breadItems, breadPreparation, spreads, soup, porridge, noFish, beverages, additions
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
  
  - [x] 5.5 Implement access control rules for Meal Orders collection
    - Admin: Full CRUD access
    - Caregiver: Create, read, update (only if status is pending)
    - Kitchen: Read all, update status field only
    - _Requirements: 2.4, 5.5, 12.4_
  
  - [x] 5.6 Write property test for caregiver order visibility
    - **Property 7: Caregiver order visibility filtering**
    - **Validates: Requirements 2.4**
  
  - [x] 5.7 Write property test for status-based modification prevention
    - **Property 10: Status-based order modification prevention**
    - **Validates: Requirements 5.5**
  
  - [x] 5.8 Implement beforeChange hook for meal orders
    - Validate meal type specific options
    - Check for duplicate orders
    - Prevent modification of prepared/completed orders by caregivers
    - Trigger alert creation for urgent orders
    - _Requirements: 2.5, 5.5, 10.1_
  
  - [x] 5.9 Implement afterChange hook for status updates
    - Record preparedAt timestamp and preparedBy user when status changes to prepared
    - _Requirements: 5.2_
  
  - [x] 5.10 Write property test for order status update
    - **Property 9: Order status update with metadata**
    - **Validates: Requirements 5.2**

- [x] 6. Implement Versioned Records collection
  - [x] 6.1 Create Versioned Records collection schema
    - Define fields: collectionName, documentId, version, snapshot, changeType, changedFields, changedBy
    - Set up indexes for efficient querying
    - _Requirements: 8.1, 8.2_
  
  - [x] 6.2 Implement access control rules for Versioned Records
    - Admin: Read access only
    - Caregiver: No access
    - Kitchen: No access
    - _Requirements: 8.5_
  
  - [x] 6.3 Create versioning hooks for Meal Orders
    - Implement afterChange hook to create versioned records
    - Capture complete document snapshot before changes
    - Track changed fields and user information
    - _Requirements: 8.1_
  
  - [x] 6.4 Write property test for versioned record creation
    - **Property 14: Versioned record creation on modification**
    - **Validates: Requirements 8.1, 8.2**
  
  - [x] 6.5 Write property test for historical data immutability
    - **Property 15: Historical data immutability**
    - **Validates: Requirements 8.5**

- [x] 7. Implement Alerts collection
  - [x] 7.1 Create Alerts collection schema
    - Define fields: mealOrder, message, severity, acknowledged, acknowledgedBy, acknowledgedAt
    - Set up indexes for efficient querying
    - _Requirements: 10.1, 10.2, 10.3_
  
  - [x] 7.2 Implement access control rules for Alerts
    - Admin: Full CRUD access
    - Caregiver: Create only
    - Kitchen: Read, update (acknowledge only)
    - _Requirements: 10.2, 10.3_
  
  - [x] 7.3 Create alert generation logic
    - Trigger alerts when meal orders are marked urgent
    - Create alerts for all active kitchen staff users
    - _Requirements: 10.1_
  
  - [x] 7.4 Write property test for urgent order alert creation
    - **Property 21: Urgent order alert creation**
    - **Validates: Requirements 10.1**
  
  - [x] 7.5 Implement alert acknowledgment endpoint
    - POST /api/alerts/:id/acknowledge
    - Record acknowledging user and timestamp
    - _Requirements: 10.3_
  
  - [x] 7.6 Write property test for alert acknowledgment
    - **Property 22: Alert acknowledgment recording**
    - **Validates: Requirements 10.3**
  
  - [x] 7.7 Implement alert escalation logic
    - Create background job to check for unacknowledged alerts older than 30 minutes
    - Escalate to admin users
    - _Requirements: 10.5_
  
  - [x] 7.8 Write property test for alert escalation
    - **Property 23: Alert escalation on timeout**
    - **Validates: Requirements 10.5**

- [x] 8. Implement ingredient aggregation service
  - [x] 8.1 Create aggregation utility functions
    - Implement aggregateBreakfastIngredients function
    - Implement aggregateLunchIngredients function
    - Implement aggregateDinnerIngredients function
    - Filter by order status (pending, prepared only)
    - _Requirements: 4.1, 4.4, 4.5_
  
  - [x] 8.2 Write property test for ingredient aggregation
    - **Property 8: Ingredient aggregation correctness**
    - **Validates: Requirements 4.1, 4.4, 4.5**
  
  - [x] 8.3 Create ingredient aggregation API endpoint
    - GET /api/kitchen/aggregate-ingredients
    - Accept date and mealType parameters
    - Return aggregated ingredient quantities
    - _Requirements: 4.1, 4.2_
  
  - [x] 8.4 Write unit tests for aggregation edge cases
    - Test empty order sets
    - Test single order
    - Test orders with no ingredients selected
    - _Requirements: 4.3_

- [x] 9. Implement kitchen dashboard
  - [x] 9.1 Create kitchen dashboard API endpoint
    - GET /api/kitchen/dashboard
    - Accept date and mealType parameters
    - Return summary statistics, ingredient aggregation, order list, and alerts
    - _Requirements: 6.1, 6.2, 6.3, 6.4_
  
  - [x] 9.2 Create kitchen dashboard UI component
    - Date and meal type selector
    - Ingredient report display
    - Order list with status indicators
    - Alert notifications
    - _Requirements: 6.1, 6.2, 6.3_
  
  - [x] 9.3 Implement order status update UI
    - Mark orders as prepared
    - Visual distinction between pending and prepared orders
    - Filter orders by status
    - _Requirements: 5.1, 5.2, 5.3, 5.4_
  
  - [x] 9.4 Write property test for permission-based data filtering
    - **Property 26: Permission-based data filtering**
    - **Validates: Requirements 12.4**

- [x] 10. Implement search and filtering
  - [x] 10.1 Create search utility functions
    - Implement meal order search with multiple filters
    - Implement resident search with multiple filters
    - Combine filters using logical AND
    - _Requirements: 15.1, 15.3, 15.4_
  
  - [x] 10.2 Write property test for search filter combination
    - **Property 29: Search filter combination**
    - **Validates: Requirements 15.1, 15.4**
  
  - [x] 10.3 Create search API endpoints
    - GET /api/meal-orders/search
    - GET /api/residents/search
    - Support real-time filtering
    - _Requirements: 15.1, 15.2, 15.3_
  
  - [x] 10.4 Write unit tests for search edge cases
    - Test no results scenario
    - Test single filter
    - Test all filters combined
    - _Requirements: 15.5_

- [x] 11. Implement reporting and analytics
  - [x] 11.1 Create report generation service
    - Implement filtering by date range, meal type, resident, status
    - Calculate summary totals for ingredients and meal types
    - Support multiple output formats (JSON, CSV, Excel)
    - _Requirements: 17.1, 17.2, 17.3_
  
  - [x] 11.2 Write property test for report filtering
    - **Property 31: Report filtering and aggregation**
    - **Validates: Requirements 17.1, 17.2**
  
  - [x] 11.3 Write property test for report export formats
    - **Property 32: Report export format validity**
    - **Validates: Requirements 17.3**
  
  - [x] 11.4 Create analytics API endpoint
    - GET /api/reports/meal-orders
    - GET /api/reports/analytics
    - Return ingredient consumption trends over time
    - _Requirements: 17.1, 17.4_
  
  - [x] 11.5 Create reports UI component
    - Date range selector
    - Filter controls
    - Summary display
    - Export buttons
    - _Requirements: 17.1, 17.2, 17.3_

- [x] 12. Implement concurrency control
  - [x] 12.1 Add version field to Meal Orders
    - Implement optimistic locking with version numbers
    - _Requirements: 18.1, 18.2_
  
  - [x] 12.2 Implement conflict detection logic
    - Check version on update
    - Return both versions on conflict
    - _Requirements: 18.1, 18.2, 18.3_
  
  - [x] 12.3 Write property test for concurrent edit conflict detection
    - **Property 33: Concurrent edit conflict detection**
    - **Validates: Requirements 18.1, 18.2**
  
  - [x] 12.4 Create conflict resolution endpoint
    - POST /api/meal-orders/:id/resolve-conflict
    - Accept merged result
    - Create versioned record
    - _Requirements: 18.4_
  
  - [x] 12.5 Write property test for conflict resolution
    - **Property 34: Conflict resolution with versioning**
    - **Validates: Requirements 18.4**
  
  - [x] 12.6 Write property test for non-conflicting operations
    - **Property 35: Non-conflicting concurrent operations**
    - **Validates: Requirements 18.5**

- [x] 13. Implement data retention and archival
  - [x] 13.1 Create retention policy configuration
    - Add retention period settings to config
    - _Requirements: 19.1_
  
  - [x] 13.2 Write property test for retention policy enforcement
    - **Property 36: Data retention policy enforcement**
    - **Validates: Requirements 19.2, 19.3**
  
  - [x] 13.3 Create archival service
    - Implement background job to archive old data
    - Maintain referential integrity
    - Schedule during low-usage periods
    - _Requirements: 19.2, 19.3, 19.4_
  
  - [x] 13.4 Create archived data retrieval endpoint
    - GET /api/archived/:collection/:id
    - Verify admin authorization
    - _Requirements: 19.5_
  
  - [x] 13.5 Write property test for archived data retrieval
    - **Property 37: Archived data retrieval with authorization**
    - **Validates: Requirements 19.5**

- [x] 14. Implement multi-channel alert delivery
  - [x] 14.1 Create WebSocket service for real-time alerts
    - Set up WebSocket server
    - Implement alert broadcasting to kitchen staff
    - _Requirements: 16.2_
  
  - [x] 14.2 Implement push notification service
    - Integrate with push notification provider
    - Send alerts to kitchen staff devices
    - _Requirements: 16.3_
  
  - [x] 14.3 Implement email notification service
    - Set up SMTP configuration
    - Send alert emails to kitchen staff
    - _Requirements: 16.4_
  
  - [x] 14.4 Create alert delivery orchestration
    - Attempt delivery through all configured channels
    - Implement retry logic with fallback
    - _Requirements: 16.5_
  
  - [x] 14.5 Write property test for multi-channel alert delivery
    - **Property 30: Multi-channel alert delivery**
    - **Validates: Requirements 16.1, 16.2, 16.3, 16.4, 16.5**

- [x] 15. Implement caregiver interface
  - [x] 15.1 Create resident selector component
    - Display resident list with search
    - Show dietary restrictions and preferences
    - _Requirements: 2.1_
  
  - [x] 15.2 Create meal order form component
    - Date and meal type selectors
    - Conditional fields based on meal type
    - Multiple selection for arrays (bread, spreads, beverages)
    - Special notes input
    - Urgent flag checkbox
    - _Requirements: 2.2, 3.1, 3.2, 3.3, 3.4, 3.5_
  
  - [x] 15.3 Implement form validation and submission
    - Client-side validation for required fields
    - Handle duplicate order errors
    - Display success/error messages
    - _Requirements: 2.3, 2.5_
  
  - [x] 15.4 Create meal order list view for caregivers
    - Display orders created by caregiver or for current date
    - Allow editing of pending orders
    - _Requirements: 2.4_

- [x] 16. Implement responsive UI with TailwindCSS
  - [x] 16.1 Configure TailwindCSS with dark mode
    - Set up dark mode with class strategy
    - Define custom color palette
    - Configure responsive breakpoints
    - _Requirements: 11.3, 11.4_
  
  - [x] 16.2 Create theme toggle component
    - Implement light/dark mode switcher
    - Persist preference to localStorage
    - _Requirements: 11.3, 11.4_
  
  - [x] 16.3 Write property test for theme preference persistence
    - **Property 24: Theme preference persistence**
    - **Validates: Requirements 11.4**
  
  - [x] 16.4 Implement responsive layouts
    - Mobile-first design (320px+)
    - Tablet optimization (768px+)
    - Desktop layout (1024px+)
    - Touch-friendly controls (44x44px minimum)
    - _Requirements: 11.1, 11.2, 11.5_
  
  - [x] 16.5 Style all components with TailwindCSS
    - Apply consistent spacing and typography
    - Implement dark mode variants
    - Ensure accessibility (contrast ratios, focus indicators)
    - _Requirements: 11.3_

- [x] 17. Implement accessibility features
  - [x] 17.1 Add ARIA labels and semantic HTML
    - Use semantic HTML elements (nav, main, section, etc.)
    - Add ARIA labels to interactive elements
    - Implement proper heading hierarchy
    - _Requirements: 20.3_
  
  - [x] 17.2 Write property test for accessibility attributes
    - **Property 38: Accessibility attribute presence**
    - **Validates: Requirements 20.3**
  
  - [x] 17.3 Implement keyboard navigation
    - Ensure logical tab order
    - Add visible focus indicators
    - Support keyboard shortcuts for common actions
    - _Requirements: 20.2_
  
  - [x] 17.4 Implement form accessibility
    - Associate labels with inputs
    - Provide clear error messages
    - Add field descriptions where needed
    - _Requirements: 20.4_
  
  - [x] 17.5 Write property test for form label association
    - **Property 39: Form label association**
    - **Validates: Requirements 20.4**
  
  - [x] 17.6 Ensure color accessibility
    - Meet WCAG contrast requirements
    - Provide text/icon alternatives to color-only information
    - _Requirements: 20.5_

- [x] 18. Implement audit logging
  - [x] 18.1 Create audit log service
    - Log all authentication attempts
    - Log unauthorized access attempts
    - Log data modifications
    - _Requirements: 9.5, 12.5_
  
  - [x] 18.2 Write property test for unauthorized operation logging
    - **Property 27: Unauthorized operation logging**
    - **Validates: Requirements 12.5**
  
  - [x] 18.3 Create audit log viewing interface
    - Admin-only access
    - Filter by user, action, date range
    - _Requirements: 8.2_

- [x] 19. Implement error handling and logging
  - [x] 19.1 Create centralized error handling middleware
    - Handle validation errors (400)
    - Handle authentication errors (401)
    - Handle authorization errors (403)
    - Handle not found errors (404)
    - Handle conflict errors (409)
    - Handle server errors (500)
    - _Requirements: NFR-2, NFR-5_
  
  - [x] 19.2 Implement structured logging
    - Log all errors with context
    - Log performance metrics
    - Log security events
    - _Requirements: NFR-5_
  
  - [x] 19.3 Create user-friendly error messages
    - Provide clear, actionable error messages
    - Avoid exposing sensitive system details
    - _Requirements: NFR-8_

- [x] 20. Implement performance optimizations
  - [x] 20.1 Add database indexes
    - Create composite index on (date, meal_type) for meal_orders
    - Create index on resident_id for meal_orders
    - Create index on status for meal_orders
    - Create index on (collection_name, document_id) for versioned_records
    - _Requirements: NFR-1_
  
  - [x] 20.2 Implement query optimization
    - Use database-level aggregation for ingredient counting
    - Implement pagination for large result sets
    - Optimize joins and subqueries
    - _Requirements: NFR-1_
  
  - [x] 20.3 Implement caching strategy
    - Cache resident data
    - Cache user role permissions
    - Implement cache invalidation on updates
    - _Requirements: NFR-1_

- [x] 21. Create comprehensive documentation
  - [x] 21.1 Write README.md
    - Project overview
    - Setup instructions
    - Environment variables
    - Running the project
    - Testing instructions
    - _Requirements: 14.1_
  
  - [x] 21.2 Document data models
    - Collection schemas
    - Field descriptions
    - Relationships
    - Access control rules
    - _Requirements: 14.2_
  
  - [x] 21.3 Document API endpoints
    - Endpoint descriptions
    - Request/response formats
    - Authentication requirements
    - Example requests
    - _Requirements: 14.1_
  
  - [x] 21.4 Document authentication flow
    - Token validation process
    - Refresh token flow
    - 2FA implementation
    - _Requirements: 14.3_
  
  - [x] 21.5 Document kitchen dashboard
    - Aggregation logic
    - Custom UI components
    - Usage instructions
    - _Requirements: 14.4_
  
  - [x] 21.6 Add inline code comments
    - Document complex logic
    - Explain design decisions
    - Add JSDoc comments for functions
    - _Requirements: 14.5_
  
  - [x] 21.7 Create comprehensive testing documentation
    - Write TESTING_STRATEGY.md with testing philosophy, frameworks, and property catalog
    - Write TEST_CATALOG.md with complete test file inventory and categorization
    - Link testing documentation in README.md
    - _Requirements: 14.1, 14.5_
  
  - [x] 21.8 Implement interactive API documentation
    - Install and configure Swagger/OpenAPI dependencies
    - Create OpenAPI 3.0 specification with all endpoints
    - Implement interactive Swagger UI at /api-docs
    - Document all authentication, kitchen, search, alert, and report endpoints
    - Create comprehensive Swagger documentation guides
    - Link API documentation in README.md and home page
    - _Requirements: 14.1, 14.3_

- [x] 22. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
  - Run full test suite (unit + property + integration)
  - Verify all property-based tests run 100+ iterations
  - Check test coverage meets 80% minimum
  - Verify seed script works correctly
  - Test all user roles and permissions
  - Test all API endpoints
  - Verify responsive design on multiple screen sizes
  - Test dark mode functionality
  - Verify accessibility with screen reader
  - Test alert delivery through all channels
  - Verify ingredient aggregation accuracy
  - Test concurrent edit scenarios
  - Verify data retention and archival
  - Test authentication flows including 2FA
