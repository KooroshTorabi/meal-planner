# Requirements Document

## Introduction

This document specifies the requirements for a digital meal planning and ordering system for an elderly care home. The system will replace the current manual, paper-based workflow where caregivers collect meal preferences on paper forms and kitchen staff manually tally ingredients and track meal preparation. The solution will be built using Payload CMS with PostgreSQL, supporting three user roles (Admin, Caregiver, Kitchen) with appropriate access controls.

## Glossary

- **System**: The Meal Planner System built on Payload CMS
- **Resident**: An elderly care home occupant who receives meals
- **Caregiver**: A staff member who collects meal preferences from residents
- **Kitchen Staff**: Staff members who prepare meals and manage ingredient planning
- **Admin**: System administrator with full access to all functionality
- **Meal Order**: A digital record of a resident's meal preferences for a specific date and meal type
- **Meal Type**: One of three daily meals: Breakfast, Lunch, or Dinner
- **Ingredient Aggregation**: The process of calculating total quantities of ingredients needed across all meal orders
- **Order Status**: The current state of a meal order (pending, prepared, completed)
- **Dietary Restriction**: Special dietary requirements or preferences for a resident
- **Versioned Record**: A historical snapshot of data changes for audit and reporting purposes
- **RBAC**: Role-Based Access Control - permissions assigned based on user roles
- **ACL**: Access Control List - fine-grained permissions for specific resources

## Requirements

### Requirement 1

**User Story:** As an admin, I want to manage all system users and their roles, so that I can control who has access to different parts of the system.

#### Acceptance Criteria

1. WHEN an admin creates a new user account THEN the System SHALL assign one of three roles: admin, caregiver, or kitchen
2. WHEN an admin views the user list THEN the System SHALL display all users with their assigned roles and account status
3. WHEN an admin updates a user's role THEN the System SHALL immediately apply the new permissions associated with that role
4. WHEN an admin deactivates a user account THEN the System SHALL prevent that user from authenticating while preserving their historical data
5. WHERE the admin role is assigned THEN the System SHALL grant full access to all collections, fields, and administrative functions

### Requirement 2

**User Story:** As a caregiver, I want to create meal orders for residents efficiently on a tablet, so that I can quickly capture their preferences during my rounds.

#### Acceptance Criteria

1. WHEN a caregiver selects a resident THEN the System SHALL display that resident's dietary restrictions and preferences
2. WHEN a caregiver creates a meal order THEN the System SHALL require date, meal type, and resident selection before submission
3. WHEN a caregiver submits a meal order THEN the System SHALL validate all required fields and save the order with pending status
4. WHEN a caregiver views meal orders THEN the System SHALL display only orders they created or orders for the current date
5. WHERE a meal order already exists for a resident, date, and meal type THEN the System SHALL prevent duplicate order creation

### Requirement 3

**User Story:** As a caregiver, I want meal order forms to reflect the specific options for each meal type, so that I can accurately capture resident preferences matching the original paper forms.

#### Acceptance Criteria

1. WHEN a caregiver selects Breakfast as the meal type THEN the System SHALL display fields for bread items, spreads, beverages, and breakfast-specific options
2. WHEN a caregiver selects Lunch as the meal type THEN the System SHALL display fields for portion size, soup, dessert, and lunch-specific preparation options
3. WHEN a caregiver selects Dinner as the meal type THEN the System SHALL display fields for bread items, spreads, soup, beverages, and dinner-specific options
4. WHEN a caregiver enters meal preferences THEN the System SHALL allow multiple selections for bread types, spreads, and beverages
5. WHEN a caregiver adds special notes THEN the System SHALL store them in the aversions or other notes fields

### Requirement 4

**User Story:** As kitchen staff, I want to view aggregated ingredient quantities for a specific date and meal type, so that I can plan and prepare the correct amounts of food.

#### Acceptance Criteria

1. WHEN kitchen staff selects a date and meal type THEN the System SHALL calculate total quantities for each ingredient across all orders
2. WHEN displaying aggregated ingredients THEN the System SHALL show each ingredient name with its total count
3. WHEN no orders exist for the selected date and meal type THEN the System SHALL display an empty report with a clear message
4. WHEN kitchen staff generates an ingredient report THEN the System SHALL include only orders with pending or prepared status
5. WHERE multiple residents order the same item THEN the System SHALL sum the quantities correctly in the aggregation

### Requirement 5

**User Story:** As kitchen staff, I want to view individual meal orders and mark them as prepared, so that I can track meal preparation progress throughout the day.

#### Acceptance Criteria

1. WHEN kitchen staff views meal orders for a date and meal type THEN the System SHALL display all orders with resident names, room numbers, and meal preferences
2. WHEN kitchen staff marks an order as prepared THEN the System SHALL update the order status and record the timestamp
3. WHEN kitchen staff views the order list THEN the System SHALL visually distinguish between pending and prepared orders
4. WHEN kitchen staff filters orders by status THEN the System SHALL display only orders matching the selected status
5. WHERE an order is marked as prepared THEN the System SHALL prevent caregivers from modifying that order

### Requirement 6

**User Story:** As kitchen staff, I want to access a custom dashboard for ingredient planning and order tracking, so that I can efficiently manage daily meal preparation.

#### Acceptance Criteria

1. WHEN kitchen staff accesses the kitchen dashboard THEN the System SHALL display date and meal type selection controls
2. WHEN kitchen staff generates an ingredient report THEN the System SHALL display aggregated quantities in a readable format
3. WHEN kitchen staff views the dashboard THEN the System SHALL provide navigation to detailed order lists
4. WHEN the dashboard displays data THEN the System SHALL show real-time information reflecting current order statuses
5. WHERE kitchen staff lacks permission THEN the System SHALL prevent access to caregiver-specific functions

### Requirement 7

**User Story:** As an admin, I want to manage resident information including dietary restrictions and preferences, so that caregivers and kitchen staff have accurate information for meal planning.

#### Acceptance Criteria

1. WHEN an admin creates a resident record THEN the System SHALL require name and room number as mandatory fields
2. WHEN an admin enters resident information THEN the System SHALL allow storage of dietary restrictions, table number, station, and special notes
3. WHEN an admin updates a resident record THEN the System SHALL preserve the resident's historical meal orders
4. WHEN a resident is marked as inactive THEN the System SHALL prevent new meal orders while maintaining historical data
5. WHERE a resident has dietary restrictions THEN the System SHALL display warnings when caregivers create meal orders for that resident

### Requirement 8

**User Story:** As an admin, I want the system to maintain versioned historical records of all meal orders, so that I can generate analytics, reports, and audit trails.

#### Acceptance Criteria

1. WHEN any meal order is modified THEN the System SHALL create a versioned record capturing the previous state
2. WHEN an admin views order history THEN the System SHALL display all versions with timestamps and user information
3. WHEN generating reports THEN the System SHALL allow filtering by date range, meal type, resident, and order status
4. WHEN historical data is queried THEN the System SHALL return results without modifying current operational data
5. WHERE versioned records exist THEN the System SHALL prevent deletion while allowing administrators to view all versions

### Requirement 9

**User Story:** As a system user, I want to authenticate securely with token-based authentication including refresh tokens and optional 2FA, so that my account and data remain protected.

#### Acceptance Criteria

1. WHEN a user submits valid credentials THEN the System SHALL generate an access token and a refresh token
2. WHEN an access token expires THEN the System SHALL allow the user to obtain a new access token using the refresh token
3. WHEN a user enables two-factor authentication THEN the System SHALL require a time-based code in addition to password for login
4. WHEN a user logs out THEN the System SHALL invalidate the current refresh token
5. WHERE a user attempts authentication with invalid credentials THEN the System SHALL reject the request and log the attempt

### Requirement 10

**User Story:** As kitchen staff, I want to receive alerts for emergency situations or urgent meal modifications, so that I can respond quickly to critical needs.

#### Acceptance Criteria

1. WHEN a caregiver marks a meal order as urgent THEN the System SHALL send an immediate notification to all active kitchen staff users
2. WHEN an emergency alert is created THEN the System SHALL display a prominent notification in the kitchen dashboard
3. WHEN kitchen staff acknowledges an alert THEN the System SHALL record the acknowledgment with timestamp and user information
4. WHEN multiple alerts exist THEN the System SHALL display them in chronological order with unacknowledged alerts highlighted
5. WHERE an alert is older than 30 minutes and unacknowledged THEN the System SHALL escalate the notification to admin users

### Requirement 11

**User Story:** As any system user, I want a responsive interface with dark mode support, so that I can use the system comfortably on different devices and in various lighting conditions.

#### Acceptance Criteria

1. WHEN a user accesses the System on a mobile device THEN the System SHALL display a responsive layout optimized for the screen size
2. WHEN a user accesses the System on a tablet THEN the System SHALL provide touch-friendly controls with appropriate sizing
3. WHEN a user enables dark mode THEN the System SHALL apply a dark color scheme to all interface elements
4. WHEN a user switches between light and dark mode THEN the System SHALL persist the preference for future sessions
5. WHERE the System displays forms or tables THEN the System SHALL ensure all elements remain readable and accessible on screens from 320px to 2560px width

### Requirement 12

**User Story:** As an admin, I want to configure role-based access control with granular permissions, so that each user role has appropriate access to data and functionality.

#### Acceptance Criteria

1. WHEN the System enforces access control THEN the System SHALL implement both role-based permissions and resource-level access control lists
2. WHEN a caregiver attempts to access kitchen-specific functions THEN the System SHALL deny access and return an appropriate error message
3. WHEN kitchen staff attempts to create or modify resident records THEN the System SHALL deny the operation
4. WHEN a user accesses a collection THEN the System SHALL filter results to show only records they have permission to view
5. WHERE a user attempts an unauthorized operation THEN the System SHALL log the attempt with user identifier, timestamp, and requested action

### Requirement 13

**User Story:** As a developer, I want the system to include comprehensive seed data, so that I can test all functionality with realistic data immediately after setup.

#### Acceptance Criteria

1. WHEN the System initializes THEN the System SHALL execute the seed script and create three user accounts with specified credentials
2. WHEN the seed script runs THEN the System SHALL create at least 10 sample residents with varied dietary restrictions and preferences
3. WHEN the seed script creates meal orders THEN the System SHALL generate at least 20 orders covering all three meal types and multiple dates
4. WHEN seed data is created THEN the System SHALL include a mix of pending and prepared orders to demonstrate workflow states
5. WHERE the seed script has already run THEN the System SHALL detect existing data and skip re-seeding to prevent duplicates

### Requirement 14

**User Story:** As a system architect, I want comprehensive documentation covering all architectural decisions and system components, so that the system is maintainable and extensible.

#### Acceptance Criteria

1. WHEN documentation is provided THEN the System SHALL include a README file with setup instructions and architecture overview
2. WHEN documenting data models THEN the System SHALL describe each collection, its fields, relationships, and access control rules
3. WHEN documenting authentication THEN the System SHALL explain token validation, refresh token flow, and 2FA implementation
4. WHEN documenting the kitchen dashboard THEN the System SHALL describe the aggregation logic and custom UI components
5. WHERE code implements complex logic THEN the System SHALL include inline comments explaining the approach and rationale

### Requirement 15

**User Story:** As a user, I want to search and filter meal orders and residents by name, room number, dietary restrictions, and other criteria, so that I can quickly find relevant data.

#### Acceptance Criteria

1. WHEN a user enters search criteria THEN the System SHALL filter meal orders by resident name, room number, meal type, status, and dietary restrictions
2. WHEN a user applies filters THEN the System SHALL update search results in real-time without requiring page refresh
3. WHEN a user searches for residents THEN the System SHALL filter by name, room number, dietary restrictions, and station
4. WHEN multiple filters are applied THEN the System SHALL combine them using logical AND operations
5. WHERE no results match the search criteria THEN the System SHALL display a clear message indicating no matches found

### Requirement 16

**User Story:** As kitchen staff, I want alerts to be delivered reliably via multiple channels, so that urgent changes are immediately visible and actionable.

#### Acceptance Criteria

1. WHEN an alert is created THEN the System SHALL display it prominently on the kitchen dashboard
2. WHERE WebSocket connection is available THEN the System SHALL deliver alerts via real-time WebSocket messages
3. WHERE push notifications are configured THEN the System SHALL send alerts via push notification to kitchen staff devices
4. WHERE email notifications are enabled THEN the System SHALL send alert emails to kitchen staff email addresses
5. WHEN an alert delivery fails THEN the System SHALL retry using alternative configured channels

### Requirement 17

**User Story:** As an admin or kitchen staff, I want reports and analytics for meal orders and ingredient usage, so that I can track trends and plan resources effectively.

#### Acceptance Criteria

1. WHEN generating reports THEN the System SHALL allow filtering by date range, meal type, resident, and order status
2. WHEN displaying report summaries THEN the System SHALL show totals for each ingredient and meal type
3. WHEN exporting reports THEN the System SHALL provide options for CSV and Excel formats
4. WHEN viewing analytics THEN the System SHALL display ingredient consumption trends over time with visual charts
5. WHERE historical data spans multiple months THEN the System SHALL aggregate data efficiently without performance degradation

### Requirement 18

**User Story:** As a caregiver, I want the system to handle simultaneous edits on the same meal order, so that data integrity is maintained and no changes are lost.

#### Acceptance Criteria

1. WHEN multiple users edit the same meal order simultaneously THEN the System SHALL detect conflicting updates
2. WHEN a conflict is detected THEN the System SHALL prevent the second update from overwriting the first without notification
3. WHEN a user attempts to save conflicting changes THEN the System SHALL display both versions and provide resolution options
4. WHEN a conflict is resolved THEN the System SHALL save the merged result and create a versioned record
5. WHERE no conflicts exist THEN the System SHALL allow concurrent edits to different meal orders without interference

### Requirement 19

**User Story:** As an admin, I want policies for archiving or cleaning up old historical data, so that the database remains manageable and performant.

#### Acceptance Criteria

1. WHEN configuring data retention THEN the System SHALL allow specification of retention periods for versioned records and audit logs
2. WHEN the retention period expires THEN the System SHALL archive historical data to separate storage
3. WHEN archiving data THEN the System SHALL maintain referential integrity and allow retrieval if needed
4. WHEN cleanup is scheduled THEN the System SHALL execute during low-usage periods to minimize performance impact
5. WHERE archived data is requested THEN the System SHALL retrieve it with appropriate admin authorization

### Requirement 20

**User Story:** As a user with accessibility needs, I want the system interface to support screen readers and accessibility standards, so that it is usable by everyone.

#### Acceptance Criteria

1. WHEN the System renders interface elements THEN the System SHALL meet WCAG 2.1 Level AA accessibility guidelines
2. WHEN a user navigates with keyboard THEN the System SHALL provide logical tab order and visible focus indicators
3. WHEN screen readers are used THEN the System SHALL provide appropriate ARIA labels and semantic HTML elements
4. WHEN forms are displayed THEN the System SHALL associate labels with inputs and provide clear error messages
5. WHERE color conveys information THEN the System SHALL provide alternative indicators such as icons or text labels
