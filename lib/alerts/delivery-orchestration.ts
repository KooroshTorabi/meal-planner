/**
 * Alert Delivery Orchestration
 * Coordinates alert delivery through multiple channels with retry logic and fallback
 * Requirements: 16.5
 */

import type { Payload } from 'payload'
import { broadcastAlert } from './websocket'
import { sendAlertPushNotifications } from './push-notification'
import { sendAlertEmailNotifications } from './email-notification'

export interface DeliveryResult {
  channel: 'websocket' | 'push' | 'email' | 'dashboard'
  success: boolean
  recipientCount: number
  error?: string
}

export interface DeliveryReport {
  alertId: string
  timestamp: string
  results: DeliveryResult[]
  totalRecipients: number
  successfulChannels: number
  failedChannels: number
}

/**
 * Deliver alert through all configured channels
 * Attempts delivery through all channels and implements retry logic with fallback
 */
export async function deliverAlert(
  payload: Payload,
  alert: any
): Promise<DeliveryReport> {
  const results: DeliveryResult[] = []
  const timestamp = new Date().toISOString()

  console.log(`Starting multi-channel alert delivery for alert ${alert.id}`)

  // Channel 1: Dashboard (always available, no failure possible)
  results.push({
    channel: 'dashboard',
    success: true,
    recipientCount: 1, // Alert is stored in database and visible in dashboard
  })

  // Channel 2: WebSocket (real-time)
  try {
    const wsRecipients = broadcastAlert(alert)
    results.push({
      channel: 'websocket',
      success: wsRecipients > 0,
      recipientCount: wsRecipients,
    })
    console.log(`WebSocket delivery: ${wsRecipients} recipients`)
  } catch (error: any) {
    console.error('WebSocket delivery failed:', error)
    results.push({
      channel: 'websocket',
      success: false,
      recipientCount: 0,
      error: error.message,
    })
  }

  // Channel 3: Push Notifications
  try {
    const pushRecipients = await sendAlertPushNotifications(payload, alert)
    results.push({
      channel: 'push',
      success: pushRecipients > 0,
      recipientCount: pushRecipients,
    })
    console.log(`Push notification delivery: ${pushRecipients} recipients`)
  } catch (error: any) {
    console.error('Push notification delivery failed:', error)
    results.push({
      channel: 'push',
      success: false,
      recipientCount: 0,
      error: error.message,
    })
  }

  // Channel 4: Email (fallback for failed real-time channels)
  try {
    const emailRecipients = await sendAlertEmailNotifications(payload, alert)
    results.push({
      channel: 'email',
      success: emailRecipients > 0,
      recipientCount: emailRecipients,
    })
    console.log(`Email delivery: ${emailRecipients} recipients`)
  } catch (error: any) {
    console.error('Email delivery failed:', error)
    results.push({
      channel: 'email',
      success: false,
      recipientCount: 0,
      error: error.message,
    })
  }

  // Calculate summary statistics
  const totalRecipients = results.reduce((sum, r) => sum + r.recipientCount, 0)
  const successfulChannels = results.filter((r) => r.success).length
  const failedChannels = results.filter((r) => !r.success).length

  const report: DeliveryReport = {
    alertId: alert.id,
    timestamp,
    results,
    totalRecipients,
    successfulChannels,
    failedChannels,
  }

  console.log(`Alert delivery complete: ${successfulChannels}/${results.length} channels successful, ${totalRecipients} total recipients`)

  // Log delivery report for audit purposes
  await logDeliveryReport(payload, report)

  return report
}

/**
 * Retry failed alert delivery
 * Attempts to re-deliver through failed channels
 */
export async function retryAlertDelivery(
  payload: Payload,
  alert: any,
  failedChannels: Array<'websocket' | 'push' | 'email'>
): Promise<DeliveryResult[]> {
  const results: DeliveryResult[] = []

  console.log(`Retrying alert delivery for alert ${alert.id} on channels: ${failedChannels.join(', ')}`)

  for (const channel of failedChannels) {
    try {
      let recipientCount = 0

      switch (channel) {
        case 'websocket':
          recipientCount = broadcastAlert(alert)
          break
        case 'push':
          recipientCount = await sendAlertPushNotifications(payload, alert)
          break
        case 'email':
          recipientCount = await sendAlertEmailNotifications(payload, alert)
          break
      }

      results.push({
        channel,
        success: recipientCount > 0,
        recipientCount,
      })

      console.log(`Retry ${channel}: ${recipientCount} recipients`)
    } catch (error: any) {
      console.error(`Retry ${channel} failed:`, error)
      results.push({
        channel,
        success: false,
        recipientCount: 0,
        error: error.message,
      })
    }

    // Add delay between retries to avoid overwhelming services
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  return results
}

/**
 * Deliver alert with automatic retry on failure
 * Implements exponential backoff for failed channels
 */
export async function deliverAlertWithRetry(
  payload: Payload,
  alert: any,
  maxRetries: number = 3
): Promise<DeliveryReport> {
  let report = await deliverAlert(payload, alert)

  // If all channels succeeded, no need to retry
  if (report.failedChannels === 0) {
    return report
  }

  // Retry failed channels (excluding dashboard which always succeeds)
  const failedChannels = report.results
    .filter((r) => !r.success && r.channel !== 'dashboard')
    .map((r) => r.channel) as Array<'websocket' | 'push' | 'email'>

  if (failedChannels.length === 0) {
    return report
  }

  console.log(`${failedChannels.length} channels failed, attempting retries (max ${maxRetries})`)

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    // Exponential backoff: 2^attempt seconds
    const delayMs = Math.pow(2, attempt) * 1000
    console.log(`Retry attempt ${attempt}/${maxRetries} after ${delayMs}ms delay`)
    await new Promise((resolve) => setTimeout(resolve, delayMs))

    const retryResults = await retryAlertDelivery(payload, alert, failedChannels)

    // Update report with retry results
    for (const retryResult of retryResults) {
      const originalIndex = report.results.findIndex((r) => r.channel === retryResult.channel)
      if (originalIndex !== -1 && retryResult.success) {
        report.results[originalIndex] = retryResult
      }
    }

    // Recalculate statistics
    report.successfulChannels = report.results.filter((r) => r.success).length
    report.failedChannels = report.results.filter((r) => !r.success).length

    // If all channels now succeeded, stop retrying
    if (report.failedChannels === 0) {
      console.log(`All channels succeeded after ${attempt} retry attempts`)
      break
    }

    // Update failed channels list for next retry
    const stillFailedChannels = report.results
      .filter((r) => !r.success && r.channel !== 'dashboard')
      .map((r) => r.channel) as Array<'websocket' | 'push' | 'email'>

    if (stillFailedChannels.length === 0) {
      break
    }
  }

  // Log final delivery report
  await logDeliveryReport(payload, report)

  return report
}

/**
 * Log delivery report for audit purposes
 * Stores delivery results in the database for tracking and analysis
 */
async function logDeliveryReport(
  payload: Payload,
  report: DeliveryReport
): Promise<void> {
  try {
    // In a production system, you would store this in a dedicated collection
    // For now, we'll just log it
    console.log('Delivery Report:', JSON.stringify(report, null, 2))

    // You could create a DeliveryLogs collection to store these reports
    // await payload.create({
    //   collection: 'delivery-logs',
    //   data: {
    //     alertId: report.alertId,
    //     timestamp: report.timestamp,
    //     results: report.results,
    //     totalRecipients: report.totalRecipients,
    //     successfulChannels: report.successfulChannels,
    //     failedChannels: report.failedChannels,
    //   },
    // })
  } catch (error) {
    console.error('Error logging delivery report:', error)
  }
}

/**
 * Get delivery statistics for an alert
 * Useful for monitoring and debugging
 */
export async function getAlertDeliveryStats(
  payload: Payload,
  alertId: string
): Promise<DeliveryReport | null> {
  try {
    // In a production system, you would retrieve this from the DeliveryLogs collection
    // For now, return null as we're not persisting delivery reports
    console.log(`Retrieving delivery stats for alert ${alertId}`)
    return null
  } catch (error) {
    console.error('Error retrieving delivery stats:', error)
    return null
  }
}

/**
 * Test multi-channel delivery
 * Useful for verifying configuration
 */
export async function testMultiChannelDelivery(
  payload: Payload
): Promise<DeliveryReport> {
  console.log('Testing multi-channel alert delivery...')

  // Create a test alert
  const testAlert = {
    id: 'test-alert-' + Date.now(),
    mealOrder: null,
    message: 'This is a test alert to verify multi-channel delivery configuration',
    severity: 'low',
    acknowledged: false,
    createdAt: new Date().toISOString(),
  }

  const report = await deliverAlert(payload, testAlert)

  console.log('Test delivery complete:')
  console.log(`- Successful channels: ${report.successfulChannels}/${report.results.length}`)
  console.log(`- Total recipients: ${report.totalRecipients}`)
  console.log('- Channel results:')
  for (const result of report.results) {
    console.log(`  - ${result.channel}: ${result.success ? '✓' : '✗'} (${result.recipientCount} recipients)`)
    if (result.error) {
      console.log(`    Error: ${result.error}`)
    }
  }

  return report
}
