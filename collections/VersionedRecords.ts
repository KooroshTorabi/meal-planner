import type { CollectionConfig } from 'payload'
import type { Access } from 'payload'

/**
 * Access Control Rules for Versioned Records Collection
 * - Admin: Read access only
 * - Caregiver: No access
 * - Kitchen: No access
 * 
 * This collection stores historical snapshots of documents for audit trails
 * and reporting purposes. Records are immutable once created.
 */

// Read access: Only admin can read versioned records
const readAccess: Access = ({ req: { user } }) => {
  if (!user) return false
  
  // Only admin can read versioned records
  return user.role === 'admin'
}

// Create access: Only system can create versioned records (via hooks)
const createAccess: Access = () => {
  // Versioned records are created automatically by hooks
  // Not through direct user action
  return true
}

// Update access: No one can update versioned records (immutable)
const updateAccess: Access = () => {
  return false
}

// Delete access: No one can delete versioned records (immutable)
const deleteAccess: Access = () => {
  return false
}

export const VersionedRecords: CollectionConfig = {
  slug: 'versioned-records',
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['collectionName', 'documentId', 'version', 'changeType', 'createdAt'],
    description: 'Historical snapshots of document changes for audit trails and reporting',
  },
  access: {
    read: readAccess,
    create: createAccess,
    update: updateAccess,
    delete: deleteAccess,
  },
  indexes: [
    {
      fields: {
        collectionName: 1,
        documentId: 1,
      },
      options: {
        name: 'collection_document_idx',
      },
    },
    {
      fields: {
        createdAt: -1,
      },
      options: {
        name: 'created_at_idx',
      },
    },
  ],
  fields: [
    {
      name: 'collectionName',
      type: 'text',
      required: true,
      index: true,
      admin: {
        description: 'Name of the collection this version belongs to',
        readOnly: true,
      },
    },
    {
      name: 'documentId',
      type: 'text',
      required: true,
      index: true,
      admin: {
        description: 'ID of the document that was versioned',
        readOnly: true,
      },
    },
    {
      name: 'version',
      type: 'number',
      required: true,
      admin: {
        description: 'Version number (increments with each change)',
        readOnly: true,
      },
    },
    {
      name: 'snapshot',
      type: 'json',
      required: true,
      admin: {
        description: 'Complete snapshot of the document before the change',
        readOnly: true,
      },
    },
    {
      name: 'changeType',
      type: 'select',
      required: true,
      options: [
        { label: 'Create', value: 'create' },
        { label: 'Update', value: 'update' },
        { label: 'Delete', value: 'delete' },
      ],
      admin: {
        description: 'Type of change that triggered this version',
        readOnly: true,
      },
    },
    {
      name: 'changedFields',
      type: 'array',
      admin: {
        description: 'List of fields that were changed',
        readOnly: true,
      },
      fields: [
        {
          name: 'field',
          type: 'text',
        },
      ],
    },
    {
      name: 'changedBy',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        description: 'User who made the change',
        readOnly: true,
      },
    },
  ],
  timestamps: true,
}
