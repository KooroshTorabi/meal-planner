import type { CollectionConfig } from 'payload'
import type { Access } from 'payload'
import bcrypt from 'bcrypt'

/**
 * Access Control Rules for Users Collection
 * - Admin: Full CRUD access
 * - Caregiver: Read own profile, update own password
 * - Kitchen: Read own profile, update own password
 */

// Read access: Admin can read all, others can only read their own profile
const readAccess: Access = ({ req: { user } }) => {
  if (!user) return false
  
  // Admin can read all users
  if (user.role === 'admin') {
    return true
  }
  
  // Caregiver and Kitchen can only read their own profile
  if (user.role === 'caregiver' || user.role === 'kitchen') {
    return {
      id: {
        equals: user.id,
      },
    }
  }
  
  return false
}

// Create access: Only admin can create users
const createAccess: Access = ({ req: { user } }) => {
  return user?.role === 'admin'
}

// Update access: Admin can update all, others can only update their own profile
const updateAccess: Access = ({ req: { user } }) => {
  if (!user) return false
  
  // Admin can update all users
  if (user.role === 'admin') {
    return true
  }
  
  // Caregiver and Kitchen can only update their own profile
  if (user.role === 'caregiver' || user.role === 'kitchen') {
    return {
      id: {
        equals: user.id,
      },
    }
  }
  
  return false
}

// Delete access: Only admin can delete users
const deleteAccess: Access = ({ req: { user } }) => {
  return user?.role === 'admin'
}

export const Users: CollectionConfig = {
  slug: 'users',
  auth: {
    tokenExpiration: 900, // 15 minutes for access tokens
    verify: false, // Disable email verification
    maxLoginAttempts: 5,
    lockTime: 15 * 60 * 1000, // 15 minutes lockout
  },
  admin: {
    useAsTitle: 'email',
  },
  access: {
    read: readAccess,
    create: createAccess,
    update: updateAccess,
    delete: deleteAccess,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'role',
      type: 'select',
      required: true,
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Caregiver', value: 'caregiver' },
        { label: 'Kitchen', value: 'kitchen' },
      ],
      defaultValue: 'caregiver',
      access: {
        // Only admin can update roles
        update: ({ req: { user } }) => user?.role === 'admin',
      },
    },
    {
      name: 'active',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Inactive users cannot authenticate but their historical data is preserved',
      },
      access: {
        // Only admin can update active status
        update: ({ req: { user } }) => user?.role === 'admin',
      },
    },
    {
      name: 'twoFactorEnabled',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Enable two-factor authentication for this user',
      },
      access: {
        // Users can enable/disable their own 2FA, admin can manage all
        update: ({ req: { user }, id }) => {
          if (user?.role === 'admin') return true
          return user?.id === id
        },
      },
    },
    {
      name: 'twoFactorSecret',
      type: 'text',
      admin: {
        condition: (data) => data.twoFactorEnabled === true,
        description: 'TOTP secret for two-factor authentication',
      },
      access: {
        // Users can update their own 2FA secret, admin can manage all
        update: ({ req: { user }, id }) => {
          if (user?.role === 'admin') return true
          return user?.id === id
        },
      },
    },
    {
      name: 'refreshTokens',
      type: 'array',
      admin: {
        readOnly: true,
        description: 'Active refresh tokens for this user',
      },
      access: {
        // Only system can update refresh tokens (via hooks)
        update: () => false,
      },
      fields: [
        {
          name: 'token',
          type: 'text',
          required: true,
        },
        {
          name: 'expiresAt',
          type: 'date',
          required: true,
        },
        {
          name: 'createdAt',
          type: 'date',
          required: true,
          admin: {
            date: {
              displayFormat: 'yyyy-MM-dd HH:mm:ss',
            },
          },
        },
      ],
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data, req, operation }) => {
        // Hash password on create or update if password is provided
        if (operation === 'create' || (operation === 'update' && data.password)) {
          if (data.password) {
            const saltRounds = 12
            data.password = await bcrypt.hash(data.password, saltRounds)
          }
        }
        return data
      },
    ],
    afterChange: [
      async ({ doc, operation, previousDoc }) => {
        // Invalidate user permissions cache if role changed
        if (operation === 'update' && previousDoc && previousDoc.role !== doc.role) {
          const { invalidateUserPermissionsCache } = await import('../lib/cache/permissions')
          invalidateUserPermissionsCache(doc.id)
        }
      },
    ],
  },
}
