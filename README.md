# Meal Planner System

A comprehensive digital meal planning and ordering system for elderly care homes, built with Next.js, Payload CMS, and PostgreSQL.

## Overview

The Meal Planner System replaces manual, paper-based meal ordering workflows with a digital solution that enables:
- Caregivers to efficiently capture meal preferences on tablets
- Kitchen staff to view aggregated ingredient needs and track preparation progress
- Administrators to manage the system with full access control

## Technology Stack

- **Frontend**: Next.js 15 with React 19
- **Backend**: Payload CMS 3.x (Beta)
- **Database**: PostgreSQL with @payloadcms/db-postgres adapter
- **Styling**: TailwindCSS with dark mode support
- **Authentication**: JWT-based auth with refresh tokens and 2FA support
- **Testing**: Jest for unit tests, fast-check for property-based testing

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+
- Git

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd MealPlanner
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Copy the example environment file and update with your configuration:

```bash
cp .env.example .env
```

Edit `.env` and configure:
- `DATABASE_URI`: Your PostgreSQL connection string
- `PAYLOAD_SECRET`: A secure random string for Payload CMS
- `JWT_SECRET`: A secure random string for JWT tokens

### 4. Set Up PostgreSQL Database

Create a new PostgreSQL database:

```bash
createdb meal_planner
```

Or using psql:

```sql
CREATE DATABASE meal_planner;
```

### 5. Run Database Migrations

Payload CMS will automatically create the necessary tables on first run.

### 6. Start the Development Server

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

## Project Structure

```
.
├── app/                    # Next.js app directory
├── collections/            # Payload CMS collection schemas
├── lib/                    # Utility functions and services
│   ├── auth/              # Authentication utilities
│   ├── aggregation/       # Ingredient aggregation logic
│   ├── hooks/             # Payload CMS hooks
│   └── utils/             # General utilities
├── __tests__/             # Test files
├── payload.config.ts      # Payload CMS configuration
├── jest.config.js         # Jest configuration
└── tailwind.config.ts     # TailwindCSS configuration
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report
- `npm run lint` - Run Biome linter
- `npm run format` - Format code with Biome

## Testing

The project uses:
- **Jest** for unit testing
- **fast-check** for property-based testing
- **@testing-library/react** for component testing

Run tests:

```bash
npm test
```

Run tests with coverage:

```bash
npm run test:coverage
```

## User Roles

The system supports three user roles:

1. **Admin**: Full system access, user management, and configuration
2. **Caregiver**: Create and manage meal orders for residents
3. **Kitchen**: View orders, aggregate ingredients, and track preparation

## Features

- Role-based access control (RBAC)
- JWT authentication with refresh tokens
- Two-factor authentication (2FA) support
- Responsive design with dark mode
- Real-time alerts for urgent orders
- Ingredient aggregation and reporting
- Historical data versioning
- Accessibility compliant (WCAG 2.1 Level AA)

## Development Guidelines

- Follow TypeScript best practices
- Write tests for all new features
- Maintain 80% code coverage minimum
- Use property-based testing for critical logic
- Follow the EARS pattern for requirements
- Document complex logic with inline comments

## License

[Add your license here]

## Support

For issues and questions, please refer to the project documentation in `.Kourosh/specs/meal-planner-system/`
