import type { CollectionConfig } from 'payload'
import type { Access } from 'payload'
import { logUnauthorizedAccessFromPayload } from '@/lib/audit'

/**
 * Access Control Rules for Residents Collection
 * - Admin: Full CRUD access
 * - Caregiver: Read access only
 * - Kitchen: Read access only
 */

// Read access: Admin, Caregiver, and Kitchen can all read residents
const readAccess: Access = ({ req: { user } }) => {
  if (!user) return false
  
  // All authenticated users can read residents
  if (user.role === 'admin' || user.role === 'caregiver' || user.role === 'kitchen') {
    return true
  }
  
  return false
}

// Create access: Only admin can create residents
const createAccess: Access = async ({ req }) => {
  const { user } = req
  const hasAccess = user?.role === 'admin'
  
  if (!hasAccess && user) {
    // Log unauthorized access attempt
    await logUnauthorizedAccessFromPayload(
      req.payload,
      String(user.id),
      user.email,
      'residents',
      'create',
      undefined,
      { role: user.role }
    )
  }
  
  return hasAccess
}

// Update access: Only admin can update residents
const updateAccess: Access = async ({ req, id }) => {
  const { user } = req
  const hasAccess = user?.role === 'admin'
  
  if (!hasAccess && user) {
    // Log unauthorized access attempt
    await logUnauthorizedAccessFromPayload(
      req.payload,
      String(user.id),
      user.email,
      'residents',
      'update',
      String(id),
      { role: user.role }
    )
  }
  
  return hasAccess
}

// Delete access: Only admin can delete residents
const deleteAccess: Access = async ({ req, id }) => {
  const { user } = req
  const hasAccess = user?.role === 'admin'
  
  if (!hasAccess && user) {
    // Log unauthorized access attempt
    await logUnauthorizedAccessFromPayload(
      req.payload,
      String(user.id),
      user.email,
      'residents',
      'delete',
      String(id),
      { role: user.role }
    )
  }
  
  return hasAccess
}

export const Residents: CollectionConfig = {
  slug: 'residents',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'roomNumber', 'tableNumber', 'active'],
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
        // Only run on update operations
        if (operation !== 'update') {
          return data
        }

        // Display warnings for dietary restrictions
        // Note: In a real implementation, this would be logged or sent to the UI
        // For now, we'll add it to the context for potential UI display
        if (data.dietaryRestrictions && data.dietaryRestrictions.length > 0) {
          // Log dietary restriction warning
          req.payload.logger.info(
            `Resident ${data.name} has dietary restrictions: ${
              data.dietaryRestrictions.map((r: any) => r.restriction).join(', ')
            }`
          )
        }

        // Verify meal order preservation on resident updates
        // The meal orders are stored in a separate collection with a relationship
        // to the resident, so they are automatically preserved by the database
        // We just need to ensure the resident ID remains unchanged
        if (originalDoc && originalDoc.id !== data.id) {
          throw new Error('Cannot change resident ID - this would break meal order relationships')
        }

        return data
      },
    ],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: {
        description: 'Full name of the resident',
      },
    },
    {
      name: 'roomNumber',
      type: 'text',
      required: true,
      admin: {
        description: 'Room number where the resident stays',
      },
    },
    {
      name: 'tableNumber',
      type: 'text',
      admin: {
        description: 'Table number in the dining area',
      },
    },
    {
      name: 'station',
      type: 'text',
      admin: {
        description: 'Station or wing of the care home',
      },
    },
    {
      name: 'dietaryRestrictions',
      type: 'array',
      admin: {
        description: 'Special dietary requirements or restrictions',
      },
      fields: [
        {
          name: 'restriction',
          type: 'text',
        },
      ],
    },
    {
      name: 'aversions',
      type: 'textarea',
      admin: {
        description: 'Foods or ingredients the resident dislikes or cannot have',
      },
    },
    {
      name: 'specialNotes',
      type: 'textarea',
      admin: {
        description: 'Additional notes about meal preferences or requirements',
      },
    },
    {
      name: 'highCalorie',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Resident requires high-calorie meals',
      },
    },
    {
      name: 'active',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Inactive residents cannot have new meal orders but historical data is preserved',
      },
    },
  ],
  timestamps: true,
}
