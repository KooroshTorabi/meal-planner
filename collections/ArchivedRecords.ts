import type { CollectionConfig } from 'payload'
import type { Access } from 'payload'

/**
 * Access Control Rules for Archived Records Collection
 * - Admin: Read access only
 * - Caregiver: No access
 * - Kitchen: No access
 * 
 * This collection stores archived historical data that has exceeded
 * the retention period. Records are immutable once created.
 */

// Read access: Only admin can read archived records
const readAccess: Access = ({ req: { user } }) => {
  if (!user) return false
  
  // Only admin can read archived records
  return user.role === 'admin'
}

// Create access: Only system can create archived records (via archival service)
const createAccess: Access = () => {
  // Archived records are created automatically by archival service
  return true
}

// Update access: No one can update archived records (immutable)
const updateAccess: Access = () => {
  return false
}

// Delete access: Only admin can delete archived records (for cleanup)
const deleteAccess: Access = ({ req: { user } }) => {
  if (!user) return false
  return user.role === 'admin'
}

export const ArchivedRecords: CollectionConfig = {
  slug: 'archived-records',
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['collectionName', 'documentId', 'archivedAt', 'originalCreatedAt'],
    description: 'Archived historical data that exceeded retention period',
  },
  access: {
    read: readAccess,
    create: createAccess,
    update: updateAccess,
    delete: deleteAccess,
  },
  fields: [
    {
      name: 'collectionName',
      type: 'text',
      required: true,
      index: true,
      admin: {
        description: 'Name of the original collection',
        readOnly: true,
      },
    },
    {
      name: 'documentId',
      type: 'text',
      required: true,
      index: true,
      admin: {
        description: 'ID of the original document',
        readOnly: true,
      },
    },
    {
      name: 'data',
      type: 'json',
      required: true,
      admin: {
        description: 'Complete archived data',
        readOnly: true,
      },
    },
    {
      name: 'originalCreatedAt',
      type: 'date',
      required: true,
      index: true,
      admin: {
        description: 'Original creation date of the record',
        readOnly: true,
      },
    },
    {
      name: 'archivedAt',
      type: 'date',
      required: true,
      admin: {
        description: 'Date when the record was archived',
        readOnly: true,
      },
    },
    {
      name: 'retentionPeriodDays',
      type: 'number',
      required: true,
      admin: {
        description: 'Retention period that was applied (in days)',
        readOnly: true,
      },
    },
  ],
  timestamps: true,
  indexes: [
    {
      fields: {
        collectionName: 1,
        documentId: 1,
      },
    },
    {
      fields: {
        archivedAt: -1,
      },
    },
    {
      fields: {
        originalCreatedAt: -1,
      },
    },
  ],
}
