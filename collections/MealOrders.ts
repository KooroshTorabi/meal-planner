import type { CollectionConfig } from 'payload'
import type { Access } from 'payload'
import { logDataModification, logUnauthorizedAccessFromPayload } from '@/lib/audit'

/**
 * Access Control Rules for Meal Orders Collection
 * - Admin: Full CRUD access
 * - Caregiver: Create, read, update (only if status is pending)
 * - Kitchen: Read all, update status field only
 */

// Read access: All authenticated users can read meal orders with filtering
const readAccess: Access = ({ req: { user } }) => {
  if (!user) return false
  
  // Admin can read all meal orders
  if (user.role === 'admin') {
    return true
  }
  
  // Kitchen can read all meal orders
  if (user.role === 'kitchen') {
    return true
  }
  
  // Caregiver can read orders they created or orders for the current date
  if (user.role === 'caregiver') {
    // For now, return true and implement filtering in the UI/API layer
    // Payload's access control query syntax is complex for OR conditions
    return true
  }
  
  return false
}

// Create access: Admin and Caregiver can create meal orders
const createAccess: Access = async ({ req }) => {
  const { user } = req
  const hasAccess = user?.role === 'admin' || user?.role === 'caregiver'
  
  if (!hasAccess && user) {
    // Log unauthorized access attempt
    await logUnauthorizedAccessFromPayload(
      req.payload,
      String(user.id),
      user.email,
      'meal-orders',
      'create',
      undefined,
      { role: user.role }
    )
  }
  
  return hasAccess
}

// Update access: Complex rules based on role and order status
const updateAccess: Access = ({ req: { user }, data }) => {
  if (!user) return false
  
  // Admin can update all meal orders
  if (user.role === 'admin') {
    return true
  }
  
  // Kitchen can only update status field
  if (user.role === 'kitchen') {
    return true // Field-level access control will restrict to status field only
  }
  
  // Caregiver can only update pending orders
  if (user.role === 'caregiver') {
    return {
      status: {
        equals: 'pending',
      },
    }
  }
  
  return false
}

// Delete access: Only admin can delete meal orders
const deleteAccess: Access = async ({ req, id }) => {
  const { user } = req
  const hasAccess = user?.role === 'admin'
  
  if (!hasAccess && user) {
    // Log unauthorized access attempt
    await logUnauthorizedAccessFromPayload(
      req.payload,
      String(user.id),
      user.email,
      'meal-orders',
      'delete',
      String(id),
      { role: user.role }
    )
  }
  
  return hasAccess
}

export const MealOrders: CollectionConfig = {
  slug: 'meal-orders',
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['resident', 'date', 'mealType', 'status', 'urgent'],
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
        // Validate meal type specific options
        if (data.mealType === 'breakfast' && !data.breakfastOptions) {
          throw new Error('Breakfast orders must include breakfast options')
        }
        if (data.mealType === 'lunch' && !data.lunchOptions) {
          throw new Error('Lunch orders must include lunch options')
        }
        if (data.mealType === 'dinner' && !data.dinnerOptions) {
          throw new Error('Dinner orders must include dinner options')
        }

        // Check for duplicate orders (resident, date, mealType combination)
        if (operation === 'create') {
          const existingOrder = await req.payload.find({
            collection: 'meal-orders',
            where: {
              and: [
                {
                  resident: {
                    equals: data.resident,
                  },
                },
                {
                  date: {
                    equals: data.date,
                  },
                },
                {
                  mealType: {
                    equals: data.mealType,
                  },
                },
              ],
            },
          })

          if (existingOrder.docs.length > 0) {
            throw new Error(
              `A meal order already exists for this resident, date, and meal type`
            )
          }
        }

        // Optimistic locking: Check version on update
        if (operation === 'update') {
          // If version is provided in the update data, verify it matches the current version
          if (data.version !== undefined && originalDoc?.version !== undefined) {
            if (data.version !== originalDoc.version) {
              // Version mismatch - concurrent modification detected
              throw new Error(
                JSON.stringify({
                  error: 'Conflict detected',
                  message: 'This meal order has been modified by another user',
                  currentVersion: originalDoc,
                  yourVersion: data,
                })
              )
            }
          }
          
          // Increment version number on update
          data.version = (originalDoc?.version || 1) + 1
        }

        // Prevent modification of prepared/completed orders by caregivers
        if (operation === 'update' && req.user?.role === 'caregiver') {
          if (originalDoc?.status === 'prepared' || originalDoc?.status === 'completed') {
            throw new Error('Caregivers cannot modify orders that are prepared or completed')
          }
        }

        return data
      },
    ],
    afterChange: [
      async ({ doc, req, operation, previousDoc }) => {
        // Record preparedAt timestamp and preparedBy user when status changes to prepared
        if (operation === 'update' && doc.status === 'prepared' && previousDoc?.status !== 'prepared') {
          await req.payload.update({
            collection: 'meal-orders',
            id: doc.id,
            data: {
              preparedAt: new Date().toISOString(),
              preparedBy: req.user?.id,
            },
          })
        }

        // Create alerts for urgent orders and deliver via multi-channel
        if (doc.urgent && (operation === 'create' || (operation === 'update' && !previousDoc?.urgent))) {
          // Get resident information for the alert message
          const resident = typeof doc.resident === 'string' 
            ? await req.payload.findByID({
                collection: 'residents',
                id: doc.resident,
              })
            : doc.resident

          const residentName = typeof resident === 'object' && resident !== null ? resident.name : 'Unknown'
          const roomNumber = typeof resident === 'object' && resident !== null ? resident.roomNumber : 'N/A'
          const mealType = doc.mealType.charAt(0).toUpperCase() + doc.mealType.slice(1)
          
          // Create a single alert in the database
          const alert = await req.payload.create({
            collection: 'alerts',
            data: {
              mealOrder: doc.id,
              message: `Urgent ${mealType} order for ${residentName} (Room ${roomNumber})`,
              severity: 'high',
              acknowledged: false,
            },
          })

          // Deliver alert through all configured channels (WebSocket, Push, Email)
          // Import is done dynamically to avoid circular dependencies
          const { deliverAlertWithRetry } = await import('../lib/alerts/delivery-orchestration')
          
          // Deliver with automatic retry on failure
          deliverAlertWithRetry(req.payload, alert, 3).catch((error) => {
            console.error('Error delivering urgent order alert:', error)
          })
        }

        // Create versioned record for all changes (create, update, delete)
        // Skip versioning during seed (when SEED_DATABASE env var is set)
        // Skip if doc.id is not available (can happen during initial seed)
        if ((operation === 'create' || operation === 'update') && doc.id && !process.env.SEED_DATABASE) {
          // Get the current version count for this document
          const existingVersions = await req.payload.find({
            collection: 'versioned-records',
            where: {
              and: [
                {
                  collectionName: {
                    equals: 'meal-orders',
                  },
                },
                {
                  documentId: {
                    equals: doc.id,
                  },
                },
              ],
            },
            limit: 1,
            sort: '-version',
          })

          const nextVersion = existingVersions.docs.length > 0 
            ? (existingVersions.docs[0].version as number) + 1 
            : 1

          // Determine which fields changed
          const changedFields: string[] = []
          if (operation === 'update' && previousDoc) {
            // Compare previous and current document to find changed fields
            const fieldsToCheck = [
              'resident', 'date', 'mealType', 'status', 'urgent',
              'breakfastOptions', 'lunchOptions', 'dinnerOptions',
              'specialNotes', 'preparedAt', 'preparedBy'
            ]
            
            for (const field of fieldsToCheck) {
              if (JSON.stringify(previousDoc[field]) !== JSON.stringify(doc[field])) {
                changedFields.push(field)
              }
            }
          }

          // Create the versioned record with the snapshot BEFORE the change
          // For create operations, we store the initial state
          // For update operations, we store the previous state
          const snapshot = operation === 'create' ? doc : previousDoc

          await req.payload.create({
            collection: 'versioned-records',
            data: {
              collectionName: 'meal-orders',
              documentId: doc.id,
              version: nextVersion,
              snapshot: snapshot,
              changeType: operation,
              changedFields: changedFields.map(field => ({ field })),
              changedBy: req.user?.id,
            },
          })
        }

        // Log data modification to audit logs
        if (req.user && (operation === 'create' || operation === 'update')) {
          const action = operation === 'create' ? 'data_create' : 'data_update'
          await logDataModification(
            req.payload,
            action,
            String(req.user.id),
            req.user.email || 'unknown',
            'meal-orders',
            String(doc.id),
            {
              mealType: doc.mealType,
              status: doc.status,
              urgent: doc.urgent,
            }
          )
        }

        // Invalidate meal order caches after any change
        const { invalidateMealOrders } = await import('../lib/cache')
        invalidateMealOrders()
      },
    ],
  },
  fields: [
    {
      name: 'resident',
      type: 'relationship',
      relationTo: 'residents',
      required: true,
      index: true, // Index for filtering by resident
      admin: {
        description: 'The resident for whom this meal order is created',
      },
    },
    {
      name: 'date',
      type: 'date',
      required: true,
      index: true, // Index for date-based queries
      admin: {
        description: 'Date for which the meal is ordered',
        date: {
          displayFormat: 'yyyy-MM-dd',
        },
      },
    },
    {
      name: 'mealType',
      type: 'select',
      required: true,
      options: [
        { label: 'Breakfast', value: 'breakfast' },
        { label: 'Lunch', value: 'lunch' },
        { label: 'Dinner', value: 'dinner' },
      ],
      admin: {
        description: 'Type of meal (breakfast, lunch, or dinner)',
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      index: true, // Index for filtering by status
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Prepared', value: 'prepared' },
        { label: 'Completed', value: 'completed' },
      ],
      admin: {
        description: 'Current status of the meal order',
      },
      access: {
        // Kitchen can update status, caregivers cannot
        update: ({ req: { user } }) => {
          return user?.role === 'admin' || user?.role === 'kitchen'
        },
      },
    },
    {
      name: 'urgent',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Mark this order as urgent to trigger alerts to kitchen staff',
      },
    },
    {
      name: 'version',
      type: 'number',
      required: true,
      defaultValue: 1,
      admin: {
        readOnly: true,
        description: 'Version number for optimistic locking (concurrency control)',
      },
    },
    {
      name: 'breakfastOptions',
      type: 'group',
      admin: {
        condition: (data) => data.mealType === 'breakfast',
        description: 'Breakfast-specific meal options',
      },
      fields: [
        {
          name: 'followsPlan',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            description: 'Resident follows the standard breakfast plan',
          },
        },
        {
          name: 'breadItems',
          type: 'select',
          hasMany: true,
          options: [
            { label: 'Brötchen', value: 'brötchen' },
            { label: 'Vollkornbrötchen', value: 'vollkornbrötchen' },
            { label: 'Graubrot', value: 'graubrot' },
            { label: 'Vollkornbrot', value: 'vollkornbrot' },
            { label: 'Weißbrot', value: 'weißbrot' },
            { label: 'Knäckebrot', value: 'knäckebrot' },
          ],
          admin: {
            description: 'Types of bread items',
          },
        },
        {
          name: 'breadPreparation',
          type: 'select',
          hasMany: true,
          options: [
            { label: 'Geschnitten (Sliced)', value: 'geschnitten' },
            { label: 'Geschmiert (Spread)', value: 'geschmiert' },
          ],
          admin: {
            description: 'How the bread should be prepared',
          },
        },
        {
          name: 'spreads',
          type: 'select',
          hasMany: true,
          options: [
            { label: 'Butter', value: 'butter' },
            { label: 'Margarine', value: 'margarine' },
            { label: 'Konfitüre (Jam)', value: 'konfitüre' },
            { label: 'Honig (Honey)', value: 'honig' },
            { label: 'Käse (Cheese)', value: 'käse' },
            { label: 'Wurst (Sausage)', value: 'wurst' },
          ],
          admin: {
            description: 'Spreads and toppings',
          },
        },
        {
          name: 'porridge',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            description: 'Include porridge/brei',
          },
        },
        {
          name: 'beverages',
          type: 'select',
          hasMany: true,
          options: [
            { label: 'Kaffee (Coffee)', value: 'kaffee' },
            { label: 'Tee (Tea)', value: 'tee' },
            { label: 'Milch heiß (Hot milk)', value: 'milch_heiß' },
            { label: 'Milch kalt (Cold milk)', value: 'milch_kalt' },
          ],
          admin: {
            description: 'Beverages',
          },
        },
        {
          name: 'additions',
          type: 'select',
          hasMany: true,
          options: [
            { label: 'Zucker (Sugar)', value: 'zucker' },
            { label: 'Süßstoff (Sweetener)', value: 'süßstoff' },
            { label: 'Kaffeesahne (Coffee creamer)', value: 'kaffeesahne' },
          ],
          admin: {
            description: 'Additional items',
          },
        },
      ],
    },
    {
      name: 'lunchOptions',
      type: 'group',
      admin: {
        condition: (data) => data.mealType === 'lunch',
        description: 'Lunch-specific meal options',
      },
      fields: [
        {
          name: 'portionSize',
          type: 'select',
          options: [
            { label: 'Small', value: 'small' },
            { label: 'Large', value: 'large' },
            { label: 'Vegetarian', value: 'vegetarian' },
          ],
          admin: {
            description: 'Portion size or type',
          },
        },
        {
          name: 'soup',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            description: 'Include soup',
          },
        },
        {
          name: 'dessert',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            description: 'Include dessert',
          },
        },
        {
          name: 'specialPreparations',
          type: 'select',
          hasMany: true,
          options: [
            { label: 'Passierte Kost (Pureed food)', value: 'passierte_kost' },
            { label: 'Passiertes Fleisch (Pureed meat)', value: 'passiertes_fleisch' },
            { label: 'Geschnittenes Fleisch (Sliced meat)', value: 'geschnittenes_fleisch' },
            { label: 'Kartoffelbrei (Mashed potatoes)', value: 'kartoffelbrei' },
          ],
          admin: {
            description: 'Special food preparations',
          },
        },
        {
          name: 'restrictions',
          type: 'select',
          hasMany: true,
          options: [
            { label: 'Ohne Fisch (No fish)', value: 'ohne_fisch' },
            { label: 'Fingerfood', value: 'fingerfood' },
            { label: 'Nur süß (Only sweet)', value: 'nur_süß' },
          ],
          admin: {
            description: 'Dietary restrictions for this meal',
          },
        },
      ],
    },
    {
      name: 'dinnerOptions',
      type: 'group',
      admin: {
        condition: (data) => data.mealType === 'dinner',
        description: 'Dinner-specific meal options',
      },
      fields: [
        {
          name: 'followsPlan',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            description: 'Resident follows the standard dinner plan',
          },
        },
        {
          name: 'breadItems',
          type: 'select',
          hasMany: true,
          options: [
            { label: 'Graubrot', value: 'graubrot' },
            { label: 'Vollkornbrot', value: 'vollkornbrot' },
            { label: 'Weißbrot', value: 'weißbrot' },
            { label: 'Knäckebrot', value: 'knäckebrot' },
          ],
          admin: {
            description: 'Types of bread items',
          },
        },
        {
          name: 'breadPreparation',
          type: 'select',
          hasMany: true,
          options: [
            { label: 'Geschmiert (Spread)', value: 'geschmiert' },
            { label: 'Geschnitten (Sliced)', value: 'geschnitten' },
          ],
          admin: {
            description: 'How the bread should be prepared',
          },
        },
        {
          name: 'spreads',
          type: 'select',
          hasMany: true,
          options: [
            { label: 'Butter', value: 'butter' },
            { label: 'Margarine', value: 'margarine' },
          ],
          admin: {
            description: 'Spreads',
          },
        },
        {
          name: 'soup',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            description: 'Include soup',
          },
        },
        {
          name: 'porridge',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            description: 'Include porridge/brei',
          },
        },
        {
          name: 'noFish',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            description: 'No fish',
          },
        },
        {
          name: 'beverages',
          type: 'select',
          hasMany: true,
          options: [
            { label: 'Tee (Tea)', value: 'tee' },
            { label: 'Kakao (Cocoa)', value: 'kakao' },
            { label: 'Milch heiß (Hot milk)', value: 'milch_heiß' },
            { label: 'Milch kalt (Cold milk)', value: 'milch_kalt' },
          ],
          admin: {
            description: 'Beverages',
          },
        },
        {
          name: 'additions',
          type: 'select',
          hasMany: true,
          options: [
            { label: 'Zucker (Sugar)', value: 'zucker' },
            { label: 'Süßstoff (Sweetener)', value: 'süßstoff' },
          ],
          admin: {
            description: 'Additional items',
          },
        },
      ],
    },
    {
      name: 'specialNotes',
      type: 'textarea',
      admin: {
        description: 'Additional notes or special instructions for this meal order',
      },
    },
    {
      name: 'preparedAt',
      type: 'date',
      admin: {
        readOnly: true,
        description: 'Timestamp when the order was marked as prepared',
        date: {
          displayFormat: 'yyyy-MM-dd HH:mm:ss',
        },
      },
    },
    {
      name: 'preparedBy',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        readOnly: true,
        description: 'User who marked the order as prepared',
      },
    },
  ],
  timestamps: true,
}
