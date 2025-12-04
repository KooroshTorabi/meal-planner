/**
 * Data Archival Service
 * 
 * Implements background job to archive old data based on retention policies.
 * Maintains referential integrity and schedules during low-usage periods.
 */

import type { Payload } from 'payload'
import { getRetentionPolicy, getArchivalCutoffDate, shouldRunArchival } from './config'

/**
 * Archive versioned records older than retention period
 */
async function archiveVersionedRecords(payload: Payload): Promise<number> {
  const policy = getRetentionPolicy()
  const cutoffDate = getArchivalCutoffDate(policy.versionedRecordsRetentionDays)
  
  console.log(`[Archival] Archiving versioned records older than ${cutoffDate.toISOString()}`)
  
  try {
    // Find versioned records older than cutoff date
    const oldRecords = await payload.find({
      collection: 'versioned-records',
      where: {
        createdAt: {
          less_than: cutoffDate.toISOString(),
        },
      },
      limit: 1000, // Process in batches
    })
    
    if (oldRecords.docs.length === 0) {
      console.log('[Archival] No versioned records to archive')
      return 0
    }
    
    console.log(`[Archival] Found ${oldRecords.docs.length} versioned records to archive`)
    
    // Archive each record
    let archivedCount = 0
    for (const record of oldRecords.docs) {
      try {
        // Create archived record
        await payload.create({
          collection: 'archived-records',
          data: {
            collectionName: record.collectionName,
            documentId: record.documentId,
            data: record,
            originalCreatedAt: record.createdAt,
            archivedAt: new Date().toISOString(),
            retentionPeriodDays: policy.versionedRecordsRetentionDays,
          },
        })
        
        // Delete original record
        await payload.delete({
          collection: 'versioned-records',
          id: record.id,
        })
        
        archivedCount++
      } catch (error) {
        console.error(`[Archival] Error archiving versioned record ${record.id}:`, error)
        // Continue with next record
      }
    }
    
    console.log(`[Archival] Successfully archived ${archivedCount} versioned records`)
    return archivedCount
  } catch (error) {
    console.error('[Archival] Error in archiveVersionedRecords:', error)
    return 0
  }
}

/**
 * Archive completed meal orders older than retention period
 */
async function archiveCompletedOrders(payload: Payload): Promise<number> {
  const policy = getRetentionPolicy()
  const cutoffDate = getArchivalCutoffDate(policy.completedOrdersRetentionDays)
  
  console.log(`[Archival] Archiving completed orders older than ${cutoffDate.toISOString()}`)
  
  try {
    // Find completed meal orders older than cutoff date
    const oldOrders = await payload.find({
      collection: 'meal-orders',
      where: {
        and: [
          {
            status: {
              equals: 'completed',
            },
          },
          {
            createdAt: {
              less_than: cutoffDate.toISOString(),
            },
          },
        ],
      },
      limit: 1000, // Process in batches
    })
    
    if (oldOrders.docs.length === 0) {
      console.log('[Archival] No completed orders to archive')
      return 0
    }
    
    console.log(`[Archival] Found ${oldOrders.docs.length} completed orders to archive`)
    
    // Archive each order
    let archivedCount = 0
    for (const order of oldOrders.docs) {
      try {
        // Create archived record
        await payload.create({
          collection: 'archived-records',
          data: {
            collectionName: 'meal-orders',
            documentId: order.id,
            data: order,
            originalCreatedAt: order.createdAt,
            archivedAt: new Date().toISOString(),
            retentionPeriodDays: policy.completedOrdersRetentionDays,
          },
        })
        
        // Delete original order
        await payload.delete({
          collection: 'meal-orders',
          id: order.id,
        })
        
        archivedCount++
      } catch (error) {
        console.error(`[Archival] Error archiving meal order ${order.id}:`, error)
        // Continue with next order
      }
    }
    
    console.log(`[Archival] Successfully archived ${archivedCount} completed orders`)
    return archivedCount
  } catch (error) {
    console.error('[Archival] Error in archiveCompletedOrders:', error)
    return 0
  }
}

/**
 * Run the archival process for all data types
 */
export async function runArchival(payload: Payload): Promise<void> {
  const policy = getRetentionPolicy()
  
  if (!policy.archivalEnabled) {
    console.log('[Archival] Archival is disabled')
    return
  }
  
  console.log('[Archival] Starting archival process...')
  const startTime = Date.now()
  
  try {
    // Archive versioned records
    const versionedCount = await archiveVersionedRecords(payload)
    
    // Archive completed orders
    const ordersCount = await archiveCompletedOrders(payload)
    
    const duration = Date.now() - startTime
    console.log(
      `[Archival] Archival process completed in ${duration}ms. ` +
      `Archived ${versionedCount} versioned records and ${ordersCount} completed orders.`
    )
  } catch (error) {
    console.error('[Archival] Error in runArchival:', error)
  }
}

/**
 * Start the archival background job
 * Checks every hour if archival should run based on schedule
 */
export function startArchivalJob(payload: Payload): void {
  const policy = getRetentionPolicy()
  
  if (!policy.archivalEnabled) {
    console.log('[Archival] Archival job not started (disabled)')
    return
  }
  
  console.log(
    `[Archival] Starting archival job (scheduled for hour ${policy.archivalScheduleHour})`
  )
  
  // Check every hour if we should run archival
  const checkInterval = 60 * 60 * 1000 // 1 hour
  
  setInterval(async () => {
    if (shouldRunArchival(policy)) {
      console.log('[Archival] Scheduled archival time reached, running archival...')
      await runArchival(payload)
    }
  }, checkInterval)
  
  // Also check immediately on startup (in case we missed a scheduled run)
  if (shouldRunArchival(policy)) {
    console.log('[Archival] Running archival on startup...')
    runArchival(payload).catch(error => {
      console.error('[Archival] Error running archival on startup:', error)
    })
  }
}

/**
 * Retrieve archived data by collection and document ID
 * Requires admin authorization (enforced by collection access control)
 */
export async function retrieveArchivedData(
  payload: Payload,
  collectionName: string,
  documentId: string
): Promise<any | null> {
  try {
    const result = await payload.find({
      collection: 'archived-records',
      where: {
        and: [
          {
            collectionName: {
              equals: collectionName,
            },
          },
          {
            documentId: {
              equals: documentId,
            },
          },
        ],
      },
      limit: 1,
    })
    
    if (result.docs.length === 0) {
      return null
    }
    
    return result.docs[0].data
  } catch (error) {
    console.error('[Archival] Error retrieving archived data:', error)
    throw error
  }
}
