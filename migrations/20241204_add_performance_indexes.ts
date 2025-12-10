import type { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'
import { sql } from 'drizzle-orm'

/**
 * Performance Optimization Migration
 * 
 * This migration adds database indexes to improve query performance:
 * 1. Composite index on (date, mealType) for meal_orders - optimizes kitchen dashboard queries
 * 2. Index on resident for meal_orders - optimizes filtering by resident
 * 3. Index on status for meal_orders - optimizes filtering by order status
 * 4. Composite index on (collectionName, documentId) for versioned_records - optimizes version history queries
 * 
 * Requirements: NFR-1 (Performance)
 */

export async function up({ payload }: MigrateUpArgs): Promise<void> {
  // Get the database adapter
  const db = payload.db

  // Add composite index on (date, mealType) for meal_orders
  // This is the most common query pattern for the kitchen dashboard
  await db.execute({
    sql: sql`
      CREATE INDEX IF NOT EXISTS meal_orders_date_meal_type_idx 
      ON meal_orders (date, "mealType")
    `,
  })

  // Add index on resident_id for meal_orders
  // Optimizes queries filtering by resident
  await db.execute({
    sql: sql`
      CREATE INDEX IF NOT EXISTS meal_orders_resident_idx 
      ON meal_orders (resident_id)
    `,
  })

  // Add index on status for meal_orders
  // Optimizes queries filtering by order status (pending, prepared, completed)
  await db.execute({
    sql: sql`
      CREATE INDEX IF NOT EXISTS meal_orders_status_idx 
      ON meal_orders (status)
    `,
  })

  // Add composite index on (collectionName, documentId) for versioned_records
  // Optimizes queries for version history of specific documents
  await db.execute({
    sql: sql`
      CREATE INDEX IF NOT EXISTS versioned_records_collection_document_idx 
      ON versioned_records ("collectionName", "documentId")
    `,
  })

  payload.logger.info('Performance indexes created successfully')
}

export async function down({ payload }: MigrateDownArgs): Promise<void> {
  // Get the database adapter
  const db = payload.db

  // Remove indexes in reverse order
  await db.execute({
    sql: sql`DROP INDEX IF EXISTS versioned_records_collection_document_idx`,
  })

  await db.execute({
    sql: sql`DROP INDEX IF EXISTS meal_orders_status_idx`,
  })

  await db.execute({
    sql: sql`DROP INDEX IF EXISTS meal_orders_resident_idx`,
  })

  await db.execute({
    sql: sql`DROP INDEX IF EXISTS meal_orders_date_meal_type_idx`,
  })

  payload.logger.info('Performance indexes removed successfully')
}
