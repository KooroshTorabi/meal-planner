/**
 * Alert Escalation Service
 * Checks for unacknowledged alerts older than 30 minutes and escalates to admin users
 * Requirements: 10.5
 */

import type { Payload } from 'payload'

/**
 * Check for unacknowledged alerts older than 30 minutes and escalate to admin users
 */
export async function escalateUnacknowledgedAlerts(payload: Payload): Promise<number> {
  try {
    // Calculate the threshold time (30 minutes ago)
    const thirtyMinutesAgo = new Date()
    thirtyMinutesAgo.setMinutes(thirtyMinutesAgo.getMinutes() - 30)

    // Find unacknowledged alerts older than 30 minutes
    const unacknowledgedAlerts = await payload.find({
      collection: 'alerts',
      where: {
        and: [
          {
            acknowledged: {
              equals: false,
            },
          },
          {
            createdAt: {
              less_than: thirtyMinutesAgo.toISOString(),
            },
          },
        ],
      },
    })

    if (unacknowledgedAlerts.docs.length === 0) {
      return 0
    }

    // Get all active admin users
    const adminUsers = await payload.find({
      collection: 'users',
      where: {
        and: [
          {
            role: {
              equals: 'admin',
            },
          },
          {
            active: {
              equals: true,
            },
          },
        ],
      },
    })

    if (adminUsers.docs.length === 0) {
      console.warn('No active admin users found for alert escalation')
      return 0
    }

    let escalatedCount = 0

    // Create escalation alerts for each unacknowledged alert
    for (const alert of unacknowledgedAlerts.docs) {
      // Get the original meal order information
      const mealOrder = typeof alert.mealOrder === 'string'
        ? await payload.findByID({
            collection: 'meal-orders',
            id: alert.mealOrder,
          })
        : alert.mealOrder

      // Get resident information
      const resident = typeof mealOrder.resident === 'string'
        ? await payload.findByID({
            collection: 'residents',
            id: mealOrder.resident,
          })
        : mealOrder.resident

      const residentName = typeof resident === 'object' && resident !== null ? resident.name : 'Unknown'
      const roomNumber = typeof resident === 'object' && resident !== null ? resident.roomNumber : 'N/A'
      const mealType = mealOrder.mealType.charAt(0).toUpperCase() + mealOrder.mealType.slice(1)

      // Create escalation alert for each admin user
      for (const admin of adminUsers.docs) {
        await payload.create({
          collection: 'alerts',
          data: {
            mealOrder: typeof alert.mealOrder === 'string' ? alert.mealOrder : alert.mealOrder.id,
            message: `ESCALATED: Unacknowledged urgent ${mealType} order for ${residentName} (Room ${roomNumber}) - Original alert created ${new Date(alert.createdAt).toLocaleString()}`,
            severity: 'critical',
            acknowledged: false,
          },
        })
      }

      escalatedCount++
    }

    console.log(`Escalated ${escalatedCount} unacknowledged alerts to ${adminUsers.docs.length} admin users`)
    return escalatedCount
  } catch (error) {
    console.error('Error escalating alerts:', error)
    throw error
  }
}

/**
 * Start the alert escalation background job
 * Runs every 5 minutes to check for alerts that need escalation
 */
export function startAlertEscalationJob(payload: Payload): NodeJS.Timeout {
  // Run immediately on startup
  escalateUnacknowledgedAlerts(payload).catch((error) => {
    console.error('Initial alert escalation failed:', error)
  })

  // Then run every 5 minutes
  const interval = setInterval(() => {
    escalateUnacknowledgedAlerts(payload).catch((error) => {
      console.error('Alert escalation job failed:', error)
    })
  }, 5 * 60 * 1000) // 5 minutes

  console.log('Alert escalation background job started (runs every 5 minutes)')
  return interval
}

/**
 * Stop the alert escalation background job
 */
export function stopAlertEscalationJob(interval: NodeJS.Timeout): void {
  clearInterval(interval)
  console.log('Alert escalation background job stopped')
}
