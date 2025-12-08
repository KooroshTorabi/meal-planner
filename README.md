# Meal Planner System

A comprehensive digital meal planning and ordering system for elderly care homes, built with Next.js, Payload CMS, and PostgreSQL.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [Testing](#testing)
- [Project Structure](#project-structure)
- [User Roles](#user-roles)
- [Specification Documents](#specification-documents)
- [API Documentation](#api-documentation)
- [Development Guidelines](#development-guidelines)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## Overview

The Meal Planner System digitizes the manual, paper-based meal ordering workflow in elderly care homes. It replaces physical forms with an efficient digital solution that:

- **Caregivers** can efficiently capture meal preferences on tablets during their rounds
- **Kitchen Staff** can view aggregated ingredient needs and track meal preparation progress
- **Administrators** can manage users, residents, policies, and access comprehensive reports through a dedicated admin panel

### The Problem It Solves

**Before**: Caregivers walked room-to-room with paper forms, kitchen staff manually tallied ingredients across dozens of forms, and no historical data was retained after meals were served.

**After**: Digital meal ordering with real-time ingredient aggregation, preparation tracking, historical analytics, and role-based access control.

## Features

### Core Functionality
- ✅ **Digital Meal Ordering**: Capture meal preferences for breakfast, lunch, and dinner
- ✅ **Ingredient Aggregation**: Automatically calculate total ingredient quantities needed
- ✅ **Preparation Tracking**: Mark orders as prepared and track progress
- ✅ **Historical Data**: Maintain versioned records for analytics and reporting
- ✅ **Multi-Channel Alerts**: Urgent order notifications via dashboard, WebSocket, push, and email

### Security & Access Control
- ✅ **Role-Based Access Control (RBAC)**: Three user roles with granular permissions and centralized policy management
- ✅ **JWT Authentication**: Access tokens with secure token handling
- ✅ **Admin Dashboard**: Dedicated admin panel for system management
- ✅ **User Management**: Full CRUD operations for users with role assignments
- ✅ **Policy Editor**: Interactive policy editor for role-based access control
- ✅ **Audit Logging**: Comprehensive logging of all security events

### User Experience
- ✅ **Responsive Design**: Mobile-first design optimized for tablets and phones
- ✅ **Dark Mode**: System-wide dark mode with preference persistence
- ✅ **Accessibility**: WCAG 2.1 Level AA compliant with keyboard navigation
- ✅ **Real-Time Updates**: WebSocket support for live notifications
- ✅ **Search & Filtering**: Advanced search across residents and meal orders

### Data Management
- ✅ **Versioned Records**: Complete audit trail of all changes
- ✅ **Concurrency Control**: Optimistic locking to prevent data conflicts
- ✅ **Data Retention**: Configurable archival policies for old data
- ✅ **Reporting**: Customizable reports with CSV and Excel export

## Technology Stack

### Backend
- **Framework**: Next.js 15 with App Router
- **CMS**: Payload CMS 3.x (Beta)
- **Database**: PostgreSQL 14+ with @payloadcms/db-postgres adapter
- **Authentication**: JWT with bcrypt password hashing
- **2FA**: Speakeasy (TOTP)

### Frontend
- **UI Framework**: React 19
- **Styling**: TailwindCSS 3 with dark mode support
- **Components**: Custom UI component library
- **State Management**: React hooks (useState, useEffect, useCallback)

### Testing
- **Unit Tests**: Jest with ts-jest
- **Property-Based Tests**: fast-check (100+ iterations per property)
- **Component Tests**: @testing-library/react
- **Coverage**: 80%+ code coverage maintained

### Development Tools
- **Language**: TypeScript 5
- **Linting**: Biome
- **Package Manager**: npm
- **Runtime**: Node.js 18+

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: Version 18.0.0 or higher
- **npm**: Version 9.0.0 or higher (comes with Node.js)
- **PostgreSQL**: Version 14.0 or higher
- **Git**: For version control

### Verify Installation

```bash
node --version  # Should be v18.0.0 or higher
npm --version   # Should be 9.0.0 or higher
psql --version  # Should be 14.0 or higher
```

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd meal-planner
```

### 2. Install Dependencies

```bash
npm install
```

This will install all production and development dependencies listed in `package.json`.

### 3. Set Up PostgreSQL Database

Create a new PostgreSQL database for the application:

```bash
# Using createdb command
createdb meal_planner

# Or using psql
psql -U postgres
CREATE DATABASE meal_planner;
\q
```

### 4. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and update the following required variables:

```bash
# Database
DATABASE_URI=postgresql://postgres:your_password@localhost:5432/meal_planner

# Payload CMS
PAYLOAD_SECRET=your-secret-key-here-change-in-production

# JWT
JWT_SECRET=your-jwt-secret-here-change-in-production

# Server URL
NEXT_PUBLIC_SERVER_URL=http://localhost:3000
```

### 5. Set Up Authentication

Run the automated setup script to initialize the database and create test users:

```bash
npm run setup:auth
```

This will:
- Reset the database
- Create the schema
- Seed test users (admin, caregiver, kitchen)
- Configure the system for runtime

**Test Credentials:**
- Admin: `admin@example.com` / `test`
- Caregiver: `caregiver@example.com` / `test`
- Kitchen: `kitchen@example.com` / `test`

## Configuration

### Environment Variables

#### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URI` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/meal_planner` |
| `POSTGRES_URL` | Alternative PostgreSQL connection string | Same as DATABASE_URI |
| `PAYLOAD_SECRET` | Secret key for Payload CMS encryption | Generate with `openssl rand -base64 32` |
| `JWT_SECRET` | Secret key for JWT token signing | Generate with `openssl rand -base64 32` |

#### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_SERVER_URL` | Public URL of the application | `http://localhost:3000` |
| `JWT_ACCESS_TOKEN_EXPIRY` | Access token expiration time | `15m` |
| `JWT_REFRESH_TOKEN_EXPIRY` | Refresh token expiration time | `7d` |
| `NODE_ENV` | Environment mode | `development` |
| `SEED_DATABASE` | Auto-seed database on startup | `false` |

#### Data Retention Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `RETENTION_VERSIONED_RECORDS_DAYS` | Days to keep versioned records | `365` |
| `RETENTION_AUDIT_LOGS_DAYS` | Days to keep audit logs | `730` |
| `RETENTION_COMPLETED_ORDERS_DAYS` | Days to keep completed orders | `90` |
| `ARCHIVAL_ENABLED` | Enable automatic archival | `false` |
| `ARCHIVAL_SCHEDULE_HOUR` | Hour (0-23) to run archival | `2` |

#### Push Notification Configuration

Generate VAPID keys with: `npx web-push generate-vapid-keys`

| Variable | Description |
|----------|-------------|
| `VAPID_PUBLIC_KEY` | VAPID public key for web push |
| `VAPID_PRIVATE_KEY` | VAPID private key for web push |
| `VAPID_SUBJECT` | Contact email for push notifications |

#### Email Notification Configuration

| Variable | Description | Example |
|----------|-------------|---------|
| `SMTP_HOST` | SMTP server hostname | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP server port | `587` |
| `SMTP_SECURE` | Use TLS/SSL | `false` |
| `SMTP_USER` | SMTP username | `your-email@gmail.com` |
| `SMTP_PASSWORD` | SMTP password | `your-app-password` |
| `SMTP_FROM` | From email address | `noreply@mealplanner.com` |

### Generating Secrets

```bash
# Generate PAYLOAD_SECRET
openssl rand -base64 32

# Generate JWT_SECRET
openssl rand -base64 32

# Generate VAPID keys for push notifications
npx web-push generate-vapid-keys
```

## Running the Application

### Development Mode

Start the development server with hot reloading:

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

### Logging In

Access the login page at [http://localhost:3000/login](http://localhost:3000/login) or click the "Sign In" button on the home page.

**Default Credentials** (after seeding):
- Admin: `admin@example.com` / `test`
- Caregiver: `caregiver@example.com` / `test`
- Kitchen: `kitchen@example.com` / `test`

For detailed authentication information, see the [Authentication Guide](docs/AUTHENTICATION_GUIDE.md).

### Production Mode

Build and start the production server:

```bash
# Build the application
npm run build

# Start production server
npm start
```

### Seeding the Database

The database is automatically seeded on first run. To manually seed:

```bash
npm run seed
```

This creates:
- 3 user accounts (admin, caregiver, kitchen)
- 10+ sample residents with varied dietary restrictions
- 20+ sample meal orders across all meal types

### Adding Database Indexes

For optimal performance, add database indexes:

```bash
npm run add-indexes
```

This creates indexes on:
- `meal_orders(date, meal_type)` - For dashboard queries
- `meal_orders(resident_id)` - For resident lookups
- `meal_orders(status)` - For status filtering
- `versioned_records(collection_name, document_id)` - For history queries

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

### Test Structure

The project uses three types of tests:

#### 1. Unit Tests
Test individual functions and components in isolation.

```bash
# Run specific test file
npm test -- __tests__/ingredient-aggregation.test.ts
```

#### 2. Property-Based Tests
Test universal properties across many generated inputs (100+ iterations).

```bash
# Run property-based tests
npm test -- --testNamePattern="Property"
```

#### 3. Integration Tests
Test complete workflows across multiple components.

```bash
# Run integration tests
npm test -- --testNamePattern="Integration"
```

### Test Coverage

Minimum coverage requirements:
- **Overall**: 80%
- **Critical paths**: 100% (authentication, access control, aggregation)

View coverage report:
```bash
npm run test:coverage
open coverage/lcov-report/index.html
```

### Writing Tests

See the [Testing Strategy](docs/TESTING_STRATEGY.md) document for guidelines on writing tests, and the [Test Catalog](docs/TEST_CATALOG.md) for a complete overview of all test files and their organization.

## Project Structure

```
meal-planner/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes
│   │   ├── admin/               # Admin panel endpoints
│   │   │   └── policies/        # Policy management
│   │   ├── alerts/              # Alert endpoints
│   │   ├── archived/            # Archived data retrieval
│   │   ├── audit-logs/          # Audit log endpoints
│   │   ├── kitchen/             # Kitchen dashboard endpoints
│   │   ├── meal-orders/         # Meal order CRUD
│   │   ├── reports/             # Reporting endpoints
│   │   ├── residents/           # Resident search
│   │   └── users/               # Authentication and user management
│   ├── admin/                   # Admin panel
│   │   ├── page.tsx             # Admin dashboard
│   │   ├── users/               # User management UI
│   │   └── policies/            # Policy editor UI
│   ├── audit-logs/              # Audit log UI
│   ├── caregiver/               # Caregiver interface
│   ├── kitchen/                 # Kitchen dashboard UI
│   ├── reports/                 # Reports UI
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Home page
│   └── globals.css              # Global styles
│
├── collections/                  # Payload CMS collections
│   ├── Alerts.ts                # Alert collection schema
│   ├── ArchivedRecords.ts       # Archived data schema
│   ├── AuditLogs.ts             # Audit log schema
│   ├── MealOrders.ts            # Meal order schema
│   ├── Residents.ts             # Resident schema
│   ├── Users.ts                 # User schema
│   └── VersionedRecords.ts      # Version history schema
│
├── components/                   # React components
│   ├── caregiver/               # Caregiver-specific components
│   ├── ui/                      # Reusable UI components
│   ├── KeyboardNavigation.tsx   # Keyboard shortcuts
│   ├── SkipLink.tsx             # Accessibility skip link
│   └── ThemeToggle.tsx          # Dark mode toggle
│
├── lib/                          # Utility libraries
│   ├── aggregation/             # Ingredient aggregation logic
│   │   ├── index.ts             # Main aggregation functions
│   │   ├── optimized.ts         # Optimized queries
│   │   └── README.md            # Aggregation documentation
│   ├── alerts/                  # Alert delivery system
│   │   ├── delivery-orchestration.ts
│   │   ├── email-notification.ts
│   │   ├── push-notification.ts
│   │   └── websocket.ts
│   ├── audit/                   # Audit logging
│   ├── auth/                    # Authentication utilities
│   │   ├── rate-limiter.ts      # Rate limiting
│   │   └── tokens.ts            # JWT token management
│   ├── policies/                # RBAC policies
│   │   └── rbac.ts              # Centralized role-based access control
│   ├── cache/                   # Caching layer
│   │   ├── index.ts             # Cache utilities
│   │   ├── permissions.ts       # Permission caching
│   │   └── residents.ts         # Resident data caching
│   ├── db/                      # Database utilities
│   │   └── add-indexes.ts       # Index creation
│   ├── errors/                  # Error handling
│   │   ├── types.ts             # Error type definitions
│   │   ├── handler.ts           # Error handler
│   │   ├── messages.ts          # User-friendly messages
│   │   └── README.md            # Error handling docs
│   ├── logging/                 # Structured logging
│   ├── reports/                 # Report generation
│   ├── retention/               # Data retention policies
│   ├── search/                  # Search utilities
│   └── utils/                   # General utilities
│
├── __tests__/                    # Test files
│   ├── *.test.ts                # Unit tests
│   ├── *.test.tsx               # Component tests
│   └── setup.test.ts            # Test setup verification
│
├── spec/                         # Specification documents
│   ├── requirements.md          # System requirements (EARS format)
│   ├── design.md                # System design & correctness properties
│   ├── tasks.md                 # Implementation task list
│   └── non-functional-requirements.md
│
├── docs/                         # Documentation
│   ├── ACCESSIBILITY_SUMMARY.md # Accessibility features
│   ├── API_DOCUMENTATION.md     # API endpoint reference
│   ├── AUTHENTICATION_GUIDE.md  # Login and authentication guide
│   ├── DATA_MODELS.md           # Database schema documentation
│   ├── ERROR_HANDLING_IMPLEMENTATION.md
│   ├── PERFORMANCE_OPTIMIZATIONS.md
│   ├── STYLING_GUIDE.md         # UI styling guide
│   ├── SWAGGER_API_DOCS.md      # Interactive API documentation guide
│   ├── TEST_CATALOG.md          # Complete test file catalog
│   └── TESTING_STRATEGY.md      # Testing guidelines
│
├── migrations/                   # Database migrations
├── public/                       # Static assets
├── scripts/                      # Utility scripts
│   ├── add-indexes.ts           # Add database indexes
│   └── seed.ts                  # Seed database
│
├── .env.example                  # Environment template
├── .gitignore                    # Git ignore rules
├── biome.json                    # Biome configuration
├── jest.config.js                # Jest configuration
├── jest.setup.js                 # Jest setup
├── next.config.ts                # Next.js configuration
├── package.json                  # Dependencies
├── payload.config.ts             # Payload CMS configuration
├── server.ts                     # Custom server
├── tailwind.config.ts            # TailwindCSS configuration
└── tsconfig.json                 # TypeScript configuration
```

## User Roles

The system implements Role-Based Access Control (RBAC) with three distinct roles:

### 1. Admin
**Full system access** with all permissions and dedicated admin panel.

**Capabilities**:
- ✅ Access admin dashboard at `/admin`
- ✅ Create, read, update, delete users with full name management
- ✅ Manage user roles and permissions
- ✅ Edit role-based access control policies via interactive editor
- ✅ Create, read, update, delete residents
- ✅ View all meal orders
- ✅ Access audit logs and versioned records
- ✅ Generate and export reports
- ✅ Configure system settings
- ✅ Access archived data

**Admin Panel Features**:
- User Management: Create, edit, activate/deactivate users
- Policy Editor: Configure role permissions with visual interface
- Quick access to all system areas (caregiver, kitchen, reports, audit logs)

**Access**: All collections, all operations

### 2. Caregiver
**Meal order management** for residents.

**Capabilities**:
- ✅ View resident information (read-only)
- ✅ Create meal orders for residents
- ✅ Edit pending meal orders (own orders only)
- ✅ View meal orders (own orders or current date)
- ✅ Mark orders as urgent
- ❌ Cannot modify prepared/completed orders
- ❌ Cannot access kitchen dashboard
- ❌ Cannot manage users or residents

**Access**: Residents (read), Meal Orders (create, read, update pending)

### 3. Kitchen
**Meal preparation and ingredient planning**.

**Capabilities**:
- ✅ View resident information (read-only)
- ✅ View all meal orders
- ✅ Update order status (pending → prepared → completed)
- ✅ View kitchen dashboard
- ✅ Generate ingredient aggregation reports
- ✅ Acknowledge alerts
- ❌ Cannot create or delete meal orders
- ❌ Cannot manage users or residents
- ❌ Cannot modify order details (only status)

**Access**: Residents (read), Meal Orders (read, update status), Alerts (read, acknowledge)

## Specification Documents

The system was built using a specification-driven development approach. All specifications are located in the `spec/` folder:

- **[Specification Overview](spec/README.md)** - Complete guide to the specification documents
- **[Requirements](spec/requirements.md)** - Complete system requirements in EARS format with acceptance criteria
- **[Design](spec/design.md)** - System architecture, data models, and 39 correctness properties
- **[Tasks](spec/tasks.md)** - Implementation task list with property-based test mappings
- **[Non-Functional Requirements](spec/non-functional-requirements.md)** - Performance, security, and scalability requirements

These documents provide the foundation for the entire system and are referenced throughout the codebase and tests. See the [Specification Overview](spec/README.md) for detailed information about the specification-driven development process.

## API Documentation

### Interactive API Documentation (Swagger)

Access the interactive API documentation at [http://localhost:3000/api-docs](http://localhost:3000/api-docs) when running the development server.

**Features:**
- 🎯 Try API endpoints directly in your browser
- 📝 Complete request/response examples
- 🔐 Built-in authentication testing
- 📊 All endpoints documented with OpenAPI 3.0

For detailed narrative documentation, see [API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md).

### Quick Reference

#### Authentication Endpoints
- `POST /api/users/login` - Login with credentials
- `POST /api/users/logout` - Logout and invalidate tokens
- `GET /api/users` - List all users (admin only)
- `POST /api/users` - Create new user (admin only)
- `PATCH /api/users/:id` - Update user (admin only)
- `DELETE /api/users/:id` - Delete user (admin only)

#### Admin Endpoints
- `POST /api/admin/policies` - Update RBAC policies (admin only)

#### Meal Order Endpoints
- `GET /api/meal-orders` - List meal orders
- `POST /api/meal-orders` - Create meal order
- `GET /api/meal-orders/:id` - Get meal order details
- `PATCH /api/meal-orders/:id` - Update meal order
- `DELETE /api/meal-orders/:id` - Delete meal order
- `GET /api/meal-orders/search` - Search meal orders

#### Kitchen Endpoints
- `GET /api/kitchen/dashboard` - Get kitchen dashboard data
- `GET /api/kitchen/aggregate-ingredients` - Get ingredient aggregation

#### Alert Endpoints
- `POST /api/alerts/:id/acknowledge` - Acknowledge alert
- `POST /api/alerts/escalate` - Escalate unacknowledged alerts

#### Report Endpoints
- `GET /api/reports/meal-orders` - Generate meal order report
- `GET /api/reports/analytics` - Get analytics data

## Development Guidelines

### Code Style

- **TypeScript**: Use strict mode, avoid `any` types
- **Formatting**: Use Biome for consistent formatting
- **Naming**: Use camelCase for variables, PascalCase for components
- **Comments**: Document complex logic with JSDoc comments

### Best Practices

- Write tests for all new features
- Maintain 80%+ code coverage
- Use property-based testing for critical logic
- Test accessibility with screen readers
- Follow the centralized RBAC pattern for access control
- Use dark mode classes (`dark:`) for all new UI components

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "feat: add your feature"

# Run tests before pushing
npm test
npm run lint

# Push and create pull request
git push origin feature/your-feature-name
```

### Commit Message Format

Follow conventional commits:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `test:` Test additions or changes
- `refactor:` Code refactoring
- `style:` Formatting changes
- `chore:` Maintenance tasks

## Deployment

### Production Checklist

Before deploying to production:

- [ ] Set `NODE_ENV=production`
- [ ] Use strong secrets for `PAYLOAD_SECRET` and `JWT_SECRET` (generated with openssl)
- [ ] Configure production database with backups
- [ ] Enable HTTPS/TLS
- [ ] Configure CORS appropriately
- [ ] Set up monitoring and alerting
- [ ] Configure logging aggregation
- [ ] Set up CDN for static assets
- [ ] Configure health check endpoints
- [ ] Test all user roles and permissions (admin, caregiver, kitchen)
- [ ] Verify admin panel access controls work correctly
- [ ] Run full test suite
- [ ] Perform security audit
- [ ] Review and update RBAC policies in `/lib/policies/rbac.ts`

### Environment-Specific Configuration

**Development**:
```env
NODE_ENV=development
NEXT_PUBLIC_SERVER_URL=http://localhost:3000
```

**Production**:
```env
NODE_ENV=production
NEXT_PUBLIC_SERVER_URL=https://your-domain.com
```

### Database Backups

Set up automated PostgreSQL backups:

```bash
# Daily backup script
pg_dump -U postgres meal_planner > backup_$(date +%Y%m%d).sql

# Restore from backup
psql -U postgres meal_planner < backup_20240101.sql
```

## Troubleshooting

### Common Issues

#### Database Connection Errors

**Problem**: `Error: connect ECONNREFUSED 127.0.0.1:5432`

**Solution**:
1. Ensure PostgreSQL is running: `pg_isready`
2. Check DATABASE_URI in `.env`
3. Verify database exists: `psql -l`

#### Port Already in Use

**Problem**: `Error: listen EADDRINUSE: address already in use :::3000`

**Solution**:
```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>
```

#### Seed Script Fails

**Problem**: Seed script creates duplicate data

**Solution**: The seed script is idempotent. Drop and recreate the database:
```bash
dropdb meal_planner
createdb meal_planner
npm run dev
```

#### Tests Failing

**Problem**: Tests fail with database errors

**Solution**:
1. Ensure test database exists
2. Check DATABASE_URI in `.env`
3. Clear Jest cache: `npx jest --clearCache`

### Getting Help

1. Check the [documentation](docs/)
2. Review [closed issues](https://github.com/your-repo/issues?q=is%3Aissue+is%3Aclosed)
3. Open a [new issue](https://github.com/your-repo/issues/new)

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Development Setup

1. Fork the repository
2. Clone your fork
3. Create a feature branch
4. Make your changes
5. Write tests
6. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with [Payload CMS](https://payloadcms.com/)
- UI components styled with [TailwindCSS](https://tailwindcss.com/)
- Property-based testing with [fast-check](https://fast-check.dev/)

## Support

For questions or support:
- 📧 Email: support@mealplanner.com
- 📚 Documentation: [docs/](docs/)
- 🐛 Issues: [GitHub Issues](https://github.com/your-repo/issues)

---

**Made with ❤️ for elderly care homes**
