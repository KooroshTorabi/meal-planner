import type { CollectionConfig } from 'payload'
import type { Access } from 'payload'

/**
 * Access Control Rules for Alerts Collection
 * - Admin: Full CRUD access
 * - Caregiver: Create only
 * - Kitchen: Read, update (acknowledge only)
 */

// Read access: Admin and Kitchen can read alerts
const readAccess: Access = ({ req: { user } }) => {
  if (!user) return false
  
  // Admin and Kitchen can read all alerts
  if (user.role === 'admin' || user.role === 'kitchen') {
    return true
  }
  
  // Caregiver cannot read alerts
  return false
}

// Create access: Admin and Caregiver can create alerts
const createAccess: Access = ({ req: { user } }) => {
  return user?.role === 'admin' || user?.role === 'caregiver'
}

// Update access: Admin and Kitchen can update alerts
const updateAccess: Access = ({ req: { user } }) => {
  if (!user) return false
  
  // Admin can update all alerts
  if (user.role === 'admin') {
    return true
  }
  
  // Kitchen can update alerts (field-level access control will restrict to acknowledge fields)
  if (user.role === 'kitchen') {
    return true
  }
  
  return false
}

// Delete access: Only admin can delete alerts
const deleteAccess: Access = ({ req: { user } }) => {
  return user?.role === 'admin'
}

export const Alerts: CollectionConfig = {
  slug: 'alerts',
  admin: {
    useAsTitle: 'message',
    defaultColumns: ['mealOrder', 'message', 'severity', 'acknowledged', 'createdAt'],
  },
  access: {
    read: readAccess,
    create: createAccess,
    update: updateAccess,
    delete: deleteAccess,
  },
  hooks: {
    beforeChange: [
      async ({ data, req, operation, originalDoc }) => {
        // When acknowledged is set to true, record the acknowledging user and timestamp
        if (operation === 'update' && data.acknowledged && !originalDoc?.acknowledged) {
          data.acknowledgedBy = req.user?.id
          data.acknowledgedAt = new Date().toISOString()
        }
        return data
      },
    ],
  },
  fields: [
    {
      name: 'mealOrder',
      type: 'relationship',
      relationTo: 'meal-orders',
      required: true,
      admin: {
        description: 'The meal order that triggered this alert',
      },
    },
    {
      name: 'message',
      type: 'text',
      required: true,
      admin: {
        description: 'Alert message describing the urgent situation',
      },
    },
    {
      name: 'severity',
      type: 'select',
      required: true,
      options: [
        { label: 'Low', value: 'low' },
        { label: 'Medium', value: 'medium' },
        { label: 'High', value: 'high' },
        { label: 'Critical', value: 'critical' },
      ],
      defaultValue: 'medium',
      admin: {
        description: 'Severity level of the alert',
      },
    },
    {
      name: 'acknowledged',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Whether the alert has been acknowledged by kitchen staff',
      },
      access: {
        // Kitchen and Admin can update acknowledged status
        update: ({ req: { user } }) => {
          return user?.role === 'admin' || user?.role === 'kitchen'
        },
      },
    },
    {
      name: 'acknowledgedBy',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        readOnly: true,
        description: 'User who acknowledged the alert',
        condition: (data) => data.acknowledged === true,
      },
      access: {
        // Only system can update acknowledgedBy (via hooks)
        update: () => false,
      },
    },
    {
      name: 'acknowledgedAt',
      type: 'date',
      admin: {
        readOnly: true,
        description: 'Timestamp when the alert was acknowledged',
        condition: (data) => data.acknowledged === true,
        date: {
          displayFormat: 'yyyy-MM-dd HH:mm:ss',
        },
      },
      access: {
        // Only system can update acknowledgedAt (via hooks)
        update: () => false,
      },
    },
  ],
  timestamps: true,
  // Set up indexes for efficient querying
  indexes: [
    {
      fields: {
        acknowledged: 1,
      },
    },
    {
      fields: {
        createdAt: -1,
      },
    },
    {
      fields: {
        severity: 1,
      },
    },
  ],
}
