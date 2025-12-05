# Quick Start Guide

## Setup Steps

### 1. Start the Server

```bash
npm run dev
```

The server will start on `http://localhost:3000`

### 2. Create Your First User

**Option A: Use Payload Admin Panel (Recommended)**

1. Go to `http://localhost:3000/admin`
2. Click "Create your first user"
3. Fill in:
   - Email: `admin@example.com`
   - Password: `test` (or your preferred password)
   - Name: `Admin User`
   - Role: `admin`
4. Click "Create"

**Option B: Use the Automated Setup Script (Easiest)**

```bash
npm run setup:auth
```

This automatically:
1. Resets the database
2. Configures schema push
3. Seeds test users
4. Restores configuration

Creates three test users:
- Admin: `admin@example.com` / `test`
- Caregiver: `caregiver@example.com` / `test`
- Kitchen: `kitchen@example.com` / `test`

### 3. Login

1. Go to `http://localhost:3000/login`
2. Enter your credentials
3. Click "Sign In"

After login, you'll see:
- Your name and role in the header
- "Sign Out" button
- Access to role-specific pages

## Features

- **Dark Mode**: Click the theme toggle button in the header
- **Authentication**: All pages except home and login require authentication
- **Role-Based Access**: Different roles have access to different pages
  - Admin: Full access
  - Caregiver: Caregiver interface, reports
  - Kitchen: Kitchen dashboard, reports

## Troubleshooting

### Login Takes Too Long

First login may take 60-90 seconds due to database initialization. This is normal.

### "Internal Server Error" on Login

1. Stop the server (`Ctrl+C`)
2. Reset the database: `npm run reset-db`
3. Start the server: `npm run dev`
4. Use the Payload Admin Panel to create users (Option A above)

### Can't Access Pages

Make sure you're logged in. The system requires authentication for all pages except:
- Home (`/`)
- Login (`/login`)
- API Documentation (`/api-docs`)
- Theme Test (`/theme-test`)

## Next Steps

Once logged in, you can:
1. Create residents
2. Create meal orders
3. View reports
4. Check audit logs (admin only)
