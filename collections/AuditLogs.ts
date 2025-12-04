import type { CollectionConfig } from 'payload'
import type { Access } from 'payload'

/**
 * Access Control Rules for Audit Logs Collection
 * - Admin: Read access only
 * - Caregiver: No access
 * - Kitchen: No access
 * 
 * This collection stores audit logs for authentication attempts,
 * unauthorized access attempts, and data modifications.
 * Records are immutable once created.
 */

// Read access: Only admin can read audit logs
const readAccess: Access = ({ req: { user } }) => {
  if (!user) return false
  
  // Only admin can read audit logs
  return user.role === 'admin'
}

// Create access: System can create audit logs
const createAccess: Access = () => {
  // Audit logs are created automatically by the system
  return true
}

// Update access: No one can update audit logs (immutable)
const updateAccess: Access = () => {
  return false
}

// Delete access: No one can delete audit logs (immutable)
const deleteAccess: Access = () => {
  return false
}

export const AuditLogs: CollectionConfig = {
  slug: 'audit-logs',
  admin: {
    useAsTitle: 'action',
    defaultColumns: ['action', 'userId', 'email', 'status', 'ipAddress', 'createdAt'],
    description: 'Audit logs for authentication, authorization, and data modification events',
  },
  access: {
    read: readAccess,
    create: createAccess,
    update: updateAccess,
    delete: deleteAccess,
  },
  fields: [
    {
      name: 'action',
      type: 'select',
      required: true,
      options: [
        { label: 'Login Attempt', value: 'login_attempt' },
        { label: 'Login Success', value: 'login_success' },
        { label: 'Login Failure', value: 'login_failure' },
        { label: 'Logout', value: 'logout' },
        { label: 'Token Refresh', value: 'token_refresh' },
        { label: '2FA Enable', value: '2fa_enable' },
        { label: '2FA Verify', value: '2fa_verify' },
        { label: 'Unauthorized Access', value: 'unauthorized_access' },
        { label: 'Data Create', value: 'data_create' },
        { label: 'Data Update', value: 'data_update' },
        { label: 'Data Delete', value: 'data_delete' },
        { label: 'Data Read', value: 'data_read' },
      ],
      index: true,
      admin: {
        description: 'Type of action that was logged',
        readOnly: true,
      },
    },
    {
      name: 'userId',
      type: 'text',
      index: true,
      admin: {
        description: 'ID of the user who performed the action (if authenticated)',
        readOnly: true,
      },
    },
    {
      name: 'email',
      type: 'text',
      index: true,
      admin: {
        description: 'Email of the user (for authentication attempts)',
        readOnly: true,
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      options: [
        { label: 'Success', value: 'success' },
        { label: 'Failure', value: 'failure' },
        { label: 'Denied', value: 'denied' },
      ],
      index: true,
      admin: {
        description: 'Status of the action',
        readOnly: true,
      },
    },
    {
      name: 'ipAddress',
      type: 'text',
      index: true,
      admin: {
        description: 'IP address of the client',
        readOnly: true,
      },
    },
    {
      name: 'userAgent',
      type: 'text',
      admin: {
        description: 'User agent string of the client',
        readOnly: true,
      },
    },
    {
      name: 'resource',
      type: 'text',
      admin: {
        description: 'Resource being accessed (collection name, endpoint, etc.)',
        readOnly: true,
      },
    },
    {
      name: 'resourceId',
      type: 'text',
      admin: {
        description: 'ID of the specific resource being accessed',
        readOnly: true,
      },
    },
    {
      name: 'details',
      type: 'json',
      admin: {
        description: 'Additional details about the action',
        readOnly: true,
      },
    },
    {
      name: 'errorMessage',
      type: 'text',
      admin: {
        description: 'Error message if the action failed',
        readOnly: true,
        condition: (data) => data.status === 'failure' || data.status === 'denied',
      },
    },
  ],
  timestamps: true,
}
