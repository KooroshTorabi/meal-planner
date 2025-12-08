// payload.config.ts

import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'

import { Users } from './collections/Users'
import { Residents } from './collections/Residents'
import { MealOrders } from './collections/MealOrders'
import { VersionedRecords } from './collections/VersionedRecords'
import { ArchivedRecords } from './collections/ArchivedRecords'
import { Alerts } from './collections/Alerts'
import { AuditLogs } from './collections/AuditLogs'
import { can } from './lib/policies/rbac'

export default buildConfig({
  secret: process.env.PAYLOAD_SECRET || '',

  // Database configuration with PostgreSQL adapter
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || '',
    },
    // Enable migrations for schema management
    migrationDir: path.resolve(__dirname, 'migrations'),
    // Disable automatic schema push to prevent conflicts
    push: false,
  }),

  editor: lexicalEditor({}),

  collections: [
    {
      ...Users,
      access: {
        read: ({ req }) => can(req.user?.role, 'user.read'),
        create: ({ req }) => can(req.user?.role, 'user.create'),
        update: ({ req }) => can(req.user?.role, 'user.update'),
        delete: ({ req }) => can(req.user?.role, 'user.delete'),
      },
    },
    {
      ...Residents,
      access: {
        read: ({ req }) => can(req.user?.role, 'resident.read'),
        create: ({ req }) => can(req.user?.role, 'resident.create'),
        update: ({ req }) => can(req.user?.role, 'resident.update'),
        delete: ({ req }) => can(req.user?.role, 'resident.delete'),
      },
    },
    {
      ...MealOrders,
      access: {
        read: ({ req }) => can(req.user?.role, 'meal.read'),
        create: ({ req }) => can(req.user?.role, 'meal.create'),
        update: ({ req }) => can(req.user?.role, 'meal.update'),
        delete: ({ req }) => can(req.user?.role, 'meal.delete'),
      },
    },
    VersionedRecords,
    ArchivedRecords,
    Alerts,
    {
      ...AuditLogs,
      access: {
        read: ({ req }) => can(req.user?.role, 'audit.read'),
        create: ({ req }) => can(req.user?.role, 'audit.create'),
        update: ({ req }) => can(req.user?.role, 'audit.access'),
        delete: ({ req }) => can(req.user?.role, 'audit.access'),
      },
    },
  ],

  typescript: {
    outputFile: path.resolve(__dirname, 'payload-types.ts'),
  },

  // Admin panel customization
  admin: {
    user: 'users',
    meta: {
      titleSuffix: '- Meal Planner System',
    },
    // Custom branding
    components: {},
    importMap: {
      baseDir: path.resolve(__dirname),
    },
  },

  // CORS configuration
  cors: [
    process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000',
    // Add additional allowed origins as needed
  ],

  // CSRF protection
  csrf: [
    process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000',
  ],

  // Server URL configuration
  serverURL: process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000',

  // Initialization hook for seeding and background jobs
  onInit: async (payload) => {
    // Seed script
    if (process.env.SEED_DATABASE === 'true') {
      const { seedDatabase } = await import('./lib/seed')
      await seedDatabase(payload)
    }

    // Start alert escalation background job
    const { startAlertEscalationJob } = await import('./lib/alerts/escalation')
    startAlertEscalationJob(payload)

    // Start data archival background job
    const { startArchivalJob } = await import('./lib/retention/archival')
    startArchivalJob(payload)
  },
})
