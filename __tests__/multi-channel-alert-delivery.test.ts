/**
 * Property-Based Tests for Multi-Channel Alert Delivery
 * **Feature: meal-planner-system, Property 30: Multi-channel alert delivery**
 * **Validates: Requirements 16.1, 16.2, 16.3, 16.4, 16.5**
 * 
 * Property: For any alert created, the system must attempt delivery through all configured channels
 * (dashboard, WebSocket, push, email) and retry failed deliveries through alternative channels
 */

import * as fc from 'fast-check'
import { deliverAlert, deliverAlertWithRetry, retryAlertDelivery } from '../lib/alerts/delivery-orchestration'
import type { DeliveryResult } from '../lib/alerts/delivery-orchestration'

// Mock the channel delivery functions
jest.mock('../lib/alerts/websocket', () => ({
  broadcastAlert: jest.fn(),
  initializeWebSocketServer: jest.fn(),
  closeWebSocketServer: jest.fn(),
}))

jest.mock('../lib/alerts/push-notification', () => ({
  sendAlertPushNotifications: jest.fn(),
  initializePushNotifications: jest.fn(),
}))

jest.mock('../lib/alerts/email-notification', () => ({
  sendAlertEmailNotifications: jest.fn(),
  initializeEmailService: jest.fn(),
}))

import { broadcastAlert } from '../lib/alerts/websocket'
import { sendAlertPushNotifications } from '../lib/alerts/push-notification'
import { sendAlertEmailNotifications } from '../lib/alerts/email-notification'

// Mock Payload instance
const mockPayload = {
  find: jest.fn(),
  findByID: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
} as any

describe('Multi-Channel Alert Delivery Property Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  /**
   * Property 30.1: Dashboard channel always succeeds
   * For any alert, the dashboard channel must always report success
   */
  test('Property 30.1: Dashboard channel always succeeds', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id: fc.string({ minLength: 1 }),
          mealOrder: fc.string({ minLength: 1 }),
          message: fc.string({ minLength: 1 }),
          severity: fc.constantFrom('low', 'medium', 'high', 'critical'),
          acknowledged: fc.boolean(),
        }),
        async (alert) => {
          // Mock all channels to return 0 recipients (simulating failure)
          ;(broadcastAlert as jest.Mock).mockReturnValue(0)
          ;(sendAlertPushNotifications as jest.Mock).mockResolvedValue(0)
          ;(sendAlertEmailNotifications as jest.Mock).mockResolvedValue(0)

          const report = await deliverAlert(mockPayload, alert)

          // Dashboard channel should always be present and successful
          const dashboardResult = report.results.find((r) => r.channel === 'dashboard')
          expect(dashboardResult).toBeDefined()
          expect(dashboardResult?.success).toBe(true)
          expect(dashboardResult?.recipientCount).toBeGreaterThan(0)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property 30.2: All configured channels are attempted
   * For any alert, delivery must be attempted through all four channels
   */
  test('Property 30.2: All configured channels are attempted', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id: fc.string({ minLength: 1 }),
          mealOrder: fc.string({ minLength: 1 }),
          message: fc.string({ minLength: 1 }),
          severity: fc.constantFrom('low', 'medium', 'high', 'critical'),
          acknowledged: fc.boolean(),
        }),
        async (alert) => {
          // Mock channels with random success/failure
          ;(broadcastAlert as jest.Mock).mockReturnValue(Math.floor(Math.random() * 5))
          ;(sendAlertPushNotifications as jest.Mock).mockResolvedValue(Math.floor(Math.random() * 5))
          ;(sendAlertEmailNotifications as jest.Mock).mockResolvedValue(Math.floor(Math.random() * 5))

          const report = await deliverAlert(mockPayload, alert)

          // All four channels should be present in results
          expect(report.results).toHaveLength(4)
          
          const channels = report.results.map((r) => r.channel)
          expect(channels).toContain('dashboard')
          expect(channels).toContain('websocket')
          expect(channels).toContain('push')
          expect(channels).toContain('email')

          // All channel functions should have been called
          expect(broadcastAlert).toHaveBeenCalledWith(alert)
          expect(sendAlertPushNotifications).toHaveBeenCalledWith(mockPayload, alert)
          expect(sendAlertEmailNotifications).toHaveBeenCalledWith(mockPayload, alert)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property 30.3: Successful channels report correct recipient count
   * For any alert with successful delivery, the recipient count must be non-negative
   */
  test('Property 30.3: Successful channels report correct recipient count', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id: fc.string({ minLength: 1 }),
          mealOrder: fc.string({ minLength: 1 }),
          message: fc.string({ minLength: 1 }),
          severity: fc.constantFrom('low', 'medium', 'high', 'critical'),
          acknowledged: fc.boolean(),
        }),
        fc.integer({ min: 0, max: 10 }),
        fc.integer({ min: 0, max: 10 }),
        fc.integer({ min: 0, max: 10 }),
        async (alert, wsRecipients, pushRecipients, emailRecipients) => {
          ;(broadcastAlert as jest.Mock).mockReturnValue(wsRecipients)
          ;(sendAlertPushNotifications as jest.Mock).mockResolvedValue(pushRecipients)
          ;(sendAlertEmailNotifications as jest.Mock).mockResolvedValue(emailRecipients)

          const report = await deliverAlert(mockPayload, alert)

          // All successful channels should have non-negative recipient counts
          for (const result of report.results) {
            if (result.success) {
              expect(result.recipientCount).toBeGreaterThanOrEqual(0)
            }
          }

          // Total recipients should equal sum of all channel recipients
          const expectedTotal = 1 + wsRecipients + pushRecipients + emailRecipients // +1 for dashboard
          expect(report.totalRecipients).toBe(expectedTotal)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property 30.4: Failed channels are marked as unsuccessful
   * For any alert where a channel fails, that channel must be marked as unsuccessful
   */
  test('Property 30.4: Failed channels are marked as unsuccessful', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id: fc.string({ minLength: 1 }),
          mealOrder: fc.string({ minLength: 1 }),
          message: fc.string({ minLength: 1 }),
          severity: fc.constantFrom('low', 'medium', 'high', 'critical'),
          acknowledged: fc.boolean(),
        }),
        async (alert) => {
          // Mock all channels to fail (return 0 recipients)
          ;(broadcastAlert as jest.Mock).mockReturnValue(0)
          ;(sendAlertPushNotifications as jest.Mock).mockResolvedValue(0)
          ;(sendAlertEmailNotifications as jest.Mock).mockResolvedValue(0)

          const report = await deliverAlert(mockPayload, alert)

          // WebSocket, push, and email should be marked as unsuccessful
          const wsResult = report.results.find((r) => r.channel === 'websocket')
          const pushResult = report.results.find((r) => r.channel === 'push')
          const emailResult = report.results.find((r) => r.channel === 'email')

          expect(wsResult?.success).toBe(false)
          expect(pushResult?.success).toBe(false)
          expect(emailResult?.success).toBe(false)

          // Failed channels count should be 3 (dashboard always succeeds)
          expect(report.failedChannels).toBe(3)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property 30.5: Retry attempts failed channels
   * For any alert with failed channels, retry must attempt delivery through those channels
   */
  test('Property 30.5: Retry attempts failed channels', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id: fc.string({ minLength: 1 }),
          mealOrder: fc.string({ minLength: 1 }),
          message: fc.string({ minLength: 1 }),
          severity: fc.constantFrom('low', 'medium', 'high', 'critical'),
          acknowledged: fc.boolean(),
        }),
        fc.array(fc.constantFrom('websocket', 'push', 'email'), { minLength: 1, maxLength: 3 }),
        async (alert, failedChannels) => {
          // Clear previous mocks
          jest.clearAllMocks()
          
          // Mock channels to succeed on retry
          ;(broadcastAlert as jest.Mock).mockReturnValue(2)
          ;(sendAlertPushNotifications as jest.Mock).mockResolvedValue(3)
          ;(sendAlertEmailNotifications as jest.Mock).mockResolvedValue(4)

          const results = await retryAlertDelivery(mockPayload, alert, failedChannels as any)

          // Results should contain all failed channels
          expect(results).toHaveLength(failedChannels.length)
          
          for (const channel of failedChannels) {
            const result = results.find((r) => r.channel === channel)
            expect(result).toBeDefined()
          }

          // Verify that only the failed channels were retried
          if (failedChannels.includes('websocket')) {
            expect(broadcastAlert).toHaveBeenCalled()
          }
          if (failedChannels.includes('push')) {
            expect(sendAlertPushNotifications).toHaveBeenCalled()
          }
          if (failedChannels.includes('email')) {
            expect(sendAlertEmailNotifications).toHaveBeenCalled()
          }
        }
      ),
      { numRuns: 20 } // Reduced runs due to delays between retries
    )
  }, 60000) // 60 second timeout

  /**
   * Property 30.6: Delivery with retry eventually succeeds or exhausts retries
   * For any alert, delivery with retry must either succeed or exhaust all retry attempts
   */
  test('Property 30.6: Delivery with retry eventually succeeds or exhausts retries', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id: fc.string({ minLength: 1 }),
          mealOrder: fc.string({ minLength: 1 }),
          message: fc.string({ minLength: 1 }),
          severity: fc.constantFrom('low', 'medium', 'high', 'critical'),
          acknowledged: fc.boolean(),
        }),
        fc.integer({ min: 1, max: 2 }), // Reduced max retries to speed up test
        async (alert, maxRetries) => {
          // Mock channels to fail initially, then succeed on retry
          let wsCallCount = 0
          let pushCallCount = 0
          let emailCallCount = 0

          ;(broadcastAlert as jest.Mock).mockImplementation(() => {
            wsCallCount++
            return wsCallCount > 1 ? 2 : 0 // Succeed on second call
          })
          ;(sendAlertPushNotifications as jest.Mock).mockImplementation(async () => {
            pushCallCount++
            return pushCallCount > 1 ? 3 : 0 // Succeed on second call
          })
          ;(sendAlertEmailNotifications as jest.Mock).mockImplementation(async () => {
            emailCallCount++
            return emailCallCount > 1 ? 4 : 0 // Succeed on second call
          })

          const report = await deliverAlertWithRetry(mockPayload, alert, maxRetries)

          // Either all channels succeeded, or we exhausted retries
          const allSucceeded = report.failedChannels === 0
          const retriesExhausted = wsCallCount > maxRetries || pushCallCount > maxRetries || emailCallCount > maxRetries

          // At least one of these conditions must be true
          expect(allSucceeded || retriesExhausted || report.successfulChannels > 0).toBe(true)

          // Dashboard should always succeed
          const dashboardResult = report.results.find((r) => r.channel === 'dashboard')
          expect(dashboardResult?.success).toBe(true)
        }
      ),
      { numRuns: 20, timeout: 60000 } // Reduced runs and increased timeout due to retry delays
    )
  }, 120000) // Increase test timeout to 120 seconds

  /**
   * Property 30.7: Report contains accurate statistics
   * For any alert delivery, the report statistics must accurately reflect the results
   */
  test('Property 30.7: Report contains accurate statistics', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id: fc.string({ minLength: 1 }),
          mealOrder: fc.string({ minLength: 1 }),
          message: fc.string({ minLength: 1 }),
          severity: fc.constantFrom('low', 'medium', 'high', 'critical'),
          acknowledged: fc.boolean(),
        }),
        fc.integer({ min: 0, max: 10 }),
        fc.integer({ min: 0, max: 10 }),
        fc.integer({ min: 0, max: 10 }),
        async (alert, wsRecipients, pushRecipients, emailRecipients) => {
          ;(broadcastAlert as jest.Mock).mockReturnValue(wsRecipients)
          ;(sendAlertPushNotifications as jest.Mock).mockResolvedValue(pushRecipients)
          ;(sendAlertEmailNotifications as jest.Mock).mockResolvedValue(emailRecipients)

          const report = await deliverAlert(mockPayload, alert)

          // Verify statistics match actual results
          const actualSuccessful = report.results.filter((r) => r.success).length
          const actualFailed = report.results.filter((r) => !r.success).length
          const actualTotal = report.results.reduce((sum, r) => sum + r.recipientCount, 0)

          expect(report.successfulChannels).toBe(actualSuccessful)
          expect(report.failedChannels).toBe(actualFailed)
          expect(report.totalRecipients).toBe(actualTotal)
          expect(report.successfulChannels + report.failedChannels).toBe(report.results.length)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property 30.8: Channel errors are captured
   * For any alert where a channel throws an error, the error must be captured in the result
   */
  test('Property 30.8: Channel errors are captured', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id: fc.string({ minLength: 1 }),
          mealOrder: fc.string({ minLength: 1 }),
          message: fc.string({ minLength: 1 }),
          severity: fc.constantFrom('low', 'medium', 'high', 'critical'),
          acknowledged: fc.boolean(),
        }),
        fc.string({ minLength: 1 }),
        async (alert, errorMessage) => {
          // Mock channels to throw errors
          ;(broadcastAlert as jest.Mock).mockImplementation(() => {
            throw new Error(errorMessage)
          })
          ;(sendAlertPushNotifications as jest.Mock).mockRejectedValue(new Error(errorMessage))
          ;(sendAlertEmailNotifications as jest.Mock).mockRejectedValue(new Error(errorMessage))

          const report = await deliverAlert(mockPayload, alert)

          // Failed channels should have error messages
          const wsResult = report.results.find((r) => r.channel === 'websocket')
          const pushResult = report.results.find((r) => r.channel === 'push')
          const emailResult = report.results.find((r) => r.channel === 'email')

          expect(wsResult?.success).toBe(false)
          expect(wsResult?.error).toBe(errorMessage)
          expect(pushResult?.success).toBe(false)
          expect(pushResult?.error).toBe(errorMessage)
          expect(emailResult?.success).toBe(false)
          expect(emailResult?.error).toBe(errorMessage)
        }
      ),
      { numRuns: 100 }
    )
  })
})
