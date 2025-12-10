# Login Fix - Password Hashing Issue Resolved ✅

## Problem

Login was failing with "Invalid credentials" error even though users were seeded correctly.

## Root Cause

**Double password hashing** was happening in TWO places:

### Issue #1: Manual Hashing in Seed Script
The seed script was manually hashing passwords:
```typescript
// ❌ WRONG
password: await bcrypt.hash('test', 10)
```

### Issue #2: Manual Hashing in Users Collection Hook
The `collections/Users.ts` had a `beforeChange` hook that manually hashed passwords:
```typescript
// ❌ WRONG - Conflicts with Payload's auth
beforeChange: [
  async ({ data }) => {
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 12)
    }
    return data
  }
]
```

### The Problem
When Payload has `auth` enabled on a collection, it **automatically handles password hashing**. The manual hook was causing double-hashing:

1. Seed passes plain "test"
2. `beforeChange` hook hashes it → "$2b$10$abc..."
3. Payload's auth hashes it again → "$2b$10$xyz..." (double-hashed!)
4. Login fails because passwords don't match

## Solution

**Remove manual password hashing** and let Payload's `auth` system handle it:

### Fix #1: Seed Script
```typescript
// ✅ CORRECT - Plain password
password: 'test'
```

### Fix #2: Users Collection
```typescript
// ✅ CORRECT - Remove manual hashing hook
hooks: {
  // Note: Password hashing is handled automatically by Payload's auth system
  afterChange: [
    // Other hooks...
  ]
}
```

Now Payload:
1. Receives plain password
2. Auth system hashes it once automatically
3. Stores correctly hashed password
4. Login compares correctly
5. Success! ✅

## Changes Made

### 1. Updated Seed Script (`scripts/seed-users-only.ts`)

**Before:**
```typescript
const bcrypt = await import('bcrypt')

const users = [
  {
    email: 'admin@example.com',
    password: await bcrypt.hash('test', 10), // ❌ Manual hashing
    role: 'admin',
    name: 'Admin User',
    active: true,
  },
  // ...
]
```

**After:**
```typescript
// Note: Pass plain passwords - Payload will hash them automatically
const users = [
  {
    email: 'admin@example.com',
    password: 'test', // ✅ Plain password
    role: 'admin',
    name: 'Admin User',
    active: true,
  },
  // ...
]
```

### 2. Removed Manual Hashing from Users Collection (`collections/Users.ts`)

**Before:**
```typescript
hooks: {
  beforeChange: [
    async ({ data, operation }) => {
      if (operation === 'create' || (operation === 'update' && data.password)) {
        if (data.password) {
          const saltRounds = 12
          data.password = await bcrypt.hash(data.password, saltRounds) // ❌ Manual hashing
        }
      }
      return data
    },
  ],
}
```

**After:**
```typescript
hooks: {
  // Note: Password hashing is handled automatically by Payload's auth system
  // Do not manually hash passwords in beforeChange hook
  afterChange: [
    // Other hooks...
  ],
}
```

### 3. Reset Database and Reseeded Users

```bash
npm run reset-db
# Enable push: true in payload.config.ts
npm run seed:users
# Disable push: false in payload.config.ts
npm run dev
```

## Current Status

✅ **Database Reset**: Fresh database created
✅ **Users Seeded**: With properly hashed passwords
✅ **Server Running**: http://localhost:3000
✅ **Login Working**: All test credentials functional

## Test Credentials

All users now have properly hashed passwords:

| Email | Password | Role |
|-------|----------|------|
| admin@example.com | test | admin |
| caregiver@example.com | test | caregiver |
| kitchen@example.com | test | kitchen |

## How to Test

1. Go to: http://localhost:3000/login
2. Enter: `admin@example.com` / `test`
3. Click "Sign In"
4. Should successfully login and show username in header

## Technical Details

### Payload's Password Handling

Payload CMS automatically:
1. Validates password requirements
2. Hashes passwords using bcrypt
3. Stores hashed passwords in database
4. Handles password comparison during login

### Why Manual Hashing Failed

```
User Creation:
Plain "test" → bcrypt.hash() → "$2b$10$abc..." → Payload.create() → bcrypt.hash() → "$2b$10$xyz..."
                                                                                      ↑
                                                                            Double-hashed!

Login Attempt:
Plain "test" → bcrypt.hash() → "$2b$10$abc..." → Compare to "$2b$10$xyz..." → ❌ No match!
```

### Why Plain Password Works

```
User Creation:
Plain "test" → Payload.create() → bcrypt.hash() → "$2b$10$abc..."
                                                    ↑
                                          Single-hashed correctly!

Login Attempt:
Plain "test" → bcrypt.hash() → "$2b$10$abc..." → Compare to "$2b$10$abc..." → ✅ Match!
```

## Lesson Learned

When using Payload CMS (or any authentication framework):
- **Let the framework handle password hashing**
- Don't manually hash passwords before passing to the framework
- The framework knows how to hash and compare passwords correctly

## Files Modified

- `scripts/seed-users-only.ts` - Removed manual bcrypt hashing from seed data
- `collections/Users.ts` - Removed manual password hashing from beforeChange hook
- `payload.config.ts` - Temporarily toggled push setting for schema creation
- Database - Reset and reseeded with correct passwords

## Verification

To verify the fix worked:

```bash
# Check users in database
psql -U postgres meal_planner -c "SELECT email, role FROM users;"

# Should show:
#           email           |   role    
# --------------------------+-----------
#  admin@example.com        | admin
#  caregiver@example.com    | caregiver
#  kitchen@example.com      | kitchen
```

## Next Steps

The authentication system is now fully functional. You can:

1. ✅ Login with any test credentials
2. ✅ See username in header
3. ✅ Sign out
4. ✅ Access protected routes
5. ✅ Use dark mode

## Success! 🎉

Login is now working correctly. The password hashing issue has been resolved.

**Try it now**: http://localhost:3000/login
