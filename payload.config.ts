import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { Users } from './collections/Users'
import { Residents } from './collections/Residents'
import { MealOrders } from './collections/MealOrders'
import { VersionedRecords } from './collections/VersionedRecords'
import { Alerts } from './collections/Alerts'

export default buildConfig({
  secret: process.env.PAYLOAD_SECRET || '',
  
  // Database configuration with PostgreSQL adapter
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || '',
    },
    // Enable migrations for schema management
    migrationDir: path.resolve(__dirname, 'migrations'),
  }),
  
  editor: lexicalEditor({}),
  
  collections: [
    Users,
    Residents,
    MealOrders,
    VersionedRecords,
    Alerts,
  ],
  
  typescript: {
    outputFile: path.resolve(__dirname, 'payload-types.ts'),
  },
  
  // Admin panel customization
  admin: {
    user: 'users',
    meta: {
      titleSuffix: '- Meal Planner System',
      favicon: '/favicon.ico',
      ogImage: '/og-image.png',
    },
    // Custom branding
    components: {},
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
  
  // Rate limiting configuration
  rateLimit: {
    max: 500, // Max requests per window
    window: 15 * 60 * 1000, // 15 minutes
    trustProxy: true,
  },
  
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
  },
})
