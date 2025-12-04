import type { Payload } from 'payload'

/**
 * Performance Optimization: Add Database Indexes
 * 
 * This utility adds database indexes to improve query performance for common access patterns.
 * 
 * Indexes added:
 * 1. Composite index on (date, mealType) for meal_orders - optimizes kitchen dashboard queries
 * 2. Index on resident_id for meal_orders - optimizes filtering by resident
 * 3. Index on status for meal_orders - optimizes filtering by order status
 * 4. Composite index on (collectionName, documentId) for versioned_records - optimizes version history queries
 * 
 * Requirements: NFR-1 (Performance)
 */

export async function addPerformanceIndexes(payload: Payload): Promise<void> {
  console.log('Adding performance indexes to database...')

  try {
    // Access the database adapter
    const db = payload.db as any

    // Check if we have access to the drizzle instance
    if (!db.drizzle) {
      console.warn('Database adapter does not support direct SQL execution. Indexes should be added manually.')
      return
    }

    // Add composite index on (date, mealType) for meal_orders
    // This is the most common query pattern for the kitchen dashboard
    await db.drizzle.execute(`
      CREATE INDEX IF NOT EXISTS meal_orders_date_meal_type_idx 
      ON meal_orders (date, "mealType");
    `)
    console.log('✓ Created composite index on (date, mealType) for meal_orders')

    // Add index on resident_id for meal_orders
    // Optimizes queries filtering by resident
    await db.drizzle.execute(`
      CREATE INDEX IF NOT EXISTS meal_orders_resident_idx 
      ON meal_orders (resident_id);
    `)
    console.log('✓ Created index on resident_id for meal_orders')

    // Add index on status for meal_orders
    // Optimizes queries filtering by order status (pending, prepared, completed)
    await db.drizzle.execute(`
      CREATE INDEX IF NOT EXISTS meal_orders_status_idx 
      ON meal_orders (status);
    `)
    console.log('✓ Created index on status for meal_orders')

    // Add composite index on (collectionName, documentId) for versioned_records
    // Optimizes queries for version history of specific documents
    await db.drizzle.execute(`
      CREATE INDEX IF NOT EXISTS versioned_records_collection_document_idx 
      ON versioned_records ("collectionName", "documentId");
    `)
    console.log('✓ Created composite index on (collectionName, documentId) for versioned_records')

    console.log('Performance indexes added successfully!')
  } catch (error) {
    console.error('Error adding performance indexes:', error)
    throw error
  }
}

/**
 * Remove performance indexes (for rollback)
 */
export async function removePerformanceIndexes(payload: Payload): Promise<void> {
  console.log('Removing performance indexes from database...')

  try {
    const db = payload.db as any

    if (!db.drizzle) {
      console.warn('Database adapter does not support direct SQL execution.')
      return
    }

    // Remove indexes in reverse order
    await db.drizzle.execute(`DROP INDEX IF EXISTS versioned_records_collection_document_idx;`)
    await db.drizzle.execute(`DROP INDEX IF EXISTS meal_orders_status_idx;`)
    await db.drizzle.execute(`DROP INDEX IF EXISTS meal_orders_resident_idx;`)
    await db.drizzle.execute(`DROP INDEX IF EXISTS meal_orders_date_meal_type_idx;`)

    console.log('Performance indexes removed successfully!')
  } catch (error) {
    console.error('Error removing performance indexes:', error)
    throw error
  }
}
