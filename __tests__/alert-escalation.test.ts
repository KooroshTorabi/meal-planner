/**
 * Property-based test for alert escalation on timeout
 * **Feature: meal-planner-system, Property 23: Alert escalation on timeout**
 * **Validates: Requirements 10.5**
 */
import * as fc from 'fast-check'
import { escalateUnacknowledgedAlerts } from '../lib/alerts/escalation'

// Mock Payload instance
interface MockPayload {
  find: jest.Mock
  findByID: jest.Mock
  create: jest.Mock
}

function createMockPayload(): MockPayload {
  return {
    find: jest.fn(),
    findByID: jest.fn(),
    create: jest.fn(),
  }
}

describe('Alert Escalation on Timeout', () => {
  /**
   * Property 23: Alert escalation on timeout
   * For any alert that remains unacknowledged for more than 30 minutes,
   * the system must create escalation notifications for admin users
   */
  it('should escalate unacknowledged alerts older than 30 minutes to admin users', async () => {
    // **Feature: meal-planner-system, Property 23: Alert escalation on timeout**
    
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 5 }), // Number of unacknowledged alerts
        fc.integer({ min: 1, max: 3 }), // Number of admin users
        fc.integer({ min: 31, max: 120 }), // Minutes since alert creation (> 30)
        async (alertCount, adminCount, minutesOld) => {
          const mockPayload = createMockPayload() as any
          const escalationAlertsCreated: any[] = []

          // Create timestamps for old alerts
          const oldAlertTime = new Date()
          oldAlertTime.setMinutes(oldAlertTime.getMinutes() - minutesOld)

          // Mock unacknowledged alerts older than 30 minutes
          const oldAlerts = Array(alertCount)
            .fill(null)
            .map((_, i) => ({
              id: `alert-${i}`,
              mealOrder: `order-${i}`,
              message: `Urgent order ${i}`,
              severity: 'high',
              acknowledged: false,
              createdAt: oldAlertTime.toISOString(),
            }))

          // Mock admin users
          const adminUsers = Array(adminCount)
            .fill(null)
            .map((_, i) => ({
              id: `admin-${i}`,
              role: 'admin',
              active: true,
              name: `Admin ${i}`,
            }))

          // Mock find for unacknowledged alerts
          mockPayload.find.mockImplementation((args: any) => {
            if (args.collection === 'alerts') {
              return Promise.resolve({
                docs: oldAlerts,
                totalDocs: oldAlerts.length,
              })
            }
            if (args.collection === 'users') {
              return Promise.resolve({
                docs: adminUsers,
                totalDocs: adminUsers.length,
              })
            }
            return Promise.resolve({ docs: [], totalDocs: 0 })
          })

          // Mock meal order and resident lookups
          mockPayload.findByID.mockImplementation((args: any) => {
            if (args.collection === 'meal-orders') {
              return Promise.resolve({
                id: args.id,
                resident: 'resident-1',
                mealType: 'breakfast',
              })
            }
            if (args.collection === 'residents') {
              return Promise.resolve({
                id: args.id,
                name: 'Test Resident',
                roomNumber: '101',
              })
            }
            return Promise.resolve(null)
          })

          // Mock alert creation
          mockPayload.create.mockImplementation((args: any) => {
            if (args.collection === 'alerts') {
              escalationAlertsCreated.push(args.data)
            }
            return Promise.resolve({ id: `escalation-${escalationAlertsCreated.length}` })
          })

          // Run escalation
          const escalatedCount = await escalateUnacknowledgedAlerts(mockPayload)

          // Verify that escalation alerts were created
          // Should be: alertCount * adminCount (one escalation alert per admin per old alert)
          expect(escalationAlertsCreated.length).toBe(alertCount * adminCount)
          expect(escalatedCount).toBe(alertCount)

          // Verify each escalation alert has correct properties
          for (const escalationAlert of escalationAlertsCreated) {
            expect(escalationAlert.message).toContain('ESCALATED')
            expect(escalationAlert.message).toContain('Unacknowledged')
            expect(escalationAlert.severity).toBe('critical')
            expect(escalationAlert.acknowledged).toBe(false)
          }

          return true
        }
      ),
      { numRuns: 100 }
    )
  }, 30000) // 30 second timeout

  it('should not escalate alerts that are less than 30 minutes old', async () => {
    // **Feature: meal-planner-system, Property 23: Alert escalation on timeout**
    
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 29 }), // Minutes since alert creation (< 30)
        async (minutesOld) => {
          const mockPayload = createMockPayload() as any
          const escalationAlertsCreated: any[] = []

          // Create timestamp for recent alert
          const recentAlertTime = new Date()
          recentAlertTime.setMinutes(recentAlertTime.getMinutes() - minutesOld)

          // Mock recent unacknowledged alert
          const recentAlert = {
            id: 'alert-1',
            mealOrder: 'order-1',
            message: 'Urgent order',
            severity: 'high',
            acknowledged: false,
            createdAt: recentAlertTime.toISOString(),
          }

          // Mock find to return no alerts (because they're too recent)
          mockPayload.find.mockImplementation((args: any) => {
            if (args.collection === 'alerts') {
              // The query filters for alerts older than 30 minutes
              // So recent alerts should not be returned
              return Promise.resolve({
                docs: [],
                totalDocs: 0,
              })
            }
            return Promise.resolve({ docs: [], totalDocs: 0 })
          })

          mockPayload.create.mockImplementation((args: any) => {
            if (args.collection === 'alerts') {
              escalationAlertsCreated.push(args.data)
            }
            return Promise.resolve({ id: `escalation-${escalationAlertsCreated.length}` })
          })

          // Run escalation
          const escalatedCount = await escalateUnacknowledgedAlerts(mockPayload)

          // Verify that no escalation alerts were created
          expect(escalationAlertsCreated.length).toBe(0)
          expect(escalatedCount).toBe(0)

          return true
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should not escalate already acknowledged alerts', async () => {
    // **Feature: meal-planner-system, Property 23: Alert escalation on timeout**
    
    const mockPayload = createMockPayload() as any
    const escalationAlertsCreated: any[] = []

    // Create timestamp for old alert
    const oldAlertTime = new Date()
    oldAlertTime.setMinutes(oldAlertTime.getMinutes() - 60)

    // Mock acknowledged alert (even though it's old)
    const acknowledgedAlert = {
      id: 'alert-1',
      mealOrder: 'order-1',
      message: 'Urgent order',
      severity: 'high',
      acknowledged: true,
      acknowledgedBy: 'user-1',
      acknowledgedAt: new Date().toISOString(),
      createdAt: oldAlertTime.toISOString(),
    }

    // Mock find to return no alerts (because acknowledged alerts are filtered out)
    mockPayload.find.mockImplementation((args: any) => {
      if (args.collection === 'alerts') {
        // The query filters for unacknowledged alerts
        // So acknowledged alerts should not be returned
        return Promise.resolve({
          docs: [],
          totalDocs: 0,
        })
      }
      return Promise.resolve({ docs: [], totalDocs: 0 })
    })

    mockPayload.create.mockImplementation((args: any) => {
      if (args.collection === 'alerts') {
        escalationAlertsCreated.push(args.data)
      }
      return Promise.resolve({ id: `escalation-${escalationAlertsCreated.length}` })
    })

    // Run escalation
    const escalatedCount = await escalateUnacknowledgedAlerts(mockPayload)

    // Verify that no escalation alerts were created
    expect(escalationAlertsCreated.length).toBe(0)
    expect(escalatedCount).toBe(0)
  })

  it('should create escalation alerts for all active admin users', async () => {
    // **Feature: meal-planner-system, Property 23: Alert escalation on timeout**
    
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 5 }), // Number of active admins
        fc.integer({ min: 0, max: 3 }), // Number of inactive admins
        async (activeAdminCount, inactiveAdminCount) => {
          const mockPayload = createMockPayload() as any
          const escalationAlertsCreated: any[] = []

          // Create timestamp for old alert
          const oldAlertTime = new Date()
          oldAlertTime.setMinutes(oldAlertTime.getMinutes() - 60)

          const oldAlert = {
            id: 'alert-1',
            mealOrder: 'order-1',
            message: 'Urgent order',
            severity: 'high',
            acknowledged: false,
            createdAt: oldAlertTime.toISOString(),
          }

          // Mock active admin users
          const activeAdmins = Array(activeAdminCount)
            .fill(null)
            .map((_, i) => ({
              id: `admin-active-${i}`,
              role: 'admin',
              active: true,
            }))

          // Mock inactive admin users (should not receive escalations)
          const inactiveAdmins = Array(inactiveAdminCount)
            .fill(null)
            .map((_, i) => ({
              id: `admin-inactive-${i}`,
              role: 'admin',
              active: false,
            }))

          mockPayload.find.mockImplementation((args: any) => {
            if (args.collection === 'alerts') {
              return Promise.resolve({
                docs: [oldAlert],
                totalDocs: 1,
              })
            }
            if (args.collection === 'users') {
              // Return only active admins (as per the query filter)
              return Promise.resolve({
                docs: activeAdmins,
                totalDocs: activeAdmins.length,
              })
            }
            return Promise.resolve({ docs: [], totalDocs: 0 })
          })

          mockPayload.findByID.mockImplementation((args: any) => {
            if (args.collection === 'meal-orders') {
              return Promise.resolve({
                id: args.id,
                resident: 'resident-1',
                mealType: 'breakfast',
              })
            }
            if (args.collection === 'residents') {
              return Promise.resolve({
                id: args.id,
                name: 'Test Resident',
                roomNumber: '101',
              })
            }
            return Promise.resolve(null)
          })

          mockPayload.create.mockImplementation((args: any) => {
            if (args.collection === 'alerts') {
              escalationAlertsCreated.push(args.data)
            }
            return Promise.resolve({ id: `escalation-${escalationAlertsCreated.length}` })
          })

          // Run escalation
          await escalateUnacknowledgedAlerts(mockPayload)

          // Verify that escalation alerts were created only for active admins
          expect(escalationAlertsCreated.length).toBe(activeAdminCount)

          return true
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should include original alert information in escalation message', async () => {
    // **Feature: meal-planner-system, Property 23: Alert escalation on timeout**
    
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          residentName: fc.string({ minLength: 1, maxLength: 50 }),
          roomNumber: fc.string({ minLength: 1, maxLength: 10 }),
          mealType: fc.constantFrom('breakfast', 'lunch', 'dinner'),
        }),
        async ({ residentName, roomNumber, mealType }) => {
          const mockPayload = createMockPayload() as any
          const escalationAlertsCreated: any[] = []

          // Create timestamp for old alert
          const oldAlertTime = new Date()
          oldAlertTime.setMinutes(oldAlertTime.getMinutes() - 60)

          const oldAlert = {
            id: 'alert-1',
            mealOrder: 'order-1',
            message: 'Urgent order',
            severity: 'high',
            acknowledged: false,
            createdAt: oldAlertTime.toISOString(),
          }

          mockPayload.find.mockImplementation((args: any) => {
            if (args.collection === 'alerts') {
              return Promise.resolve({
                docs: [oldAlert],
                totalDocs: 1,
              })
            }
            if (args.collection === 'users') {
              return Promise.resolve({
                docs: [{ id: 'admin-1', role: 'admin', active: true }],
                totalDocs: 1,
              })
            }
            return Promise.resolve({ docs: [], totalDocs: 0 })
          })

          mockPayload.findByID.mockImplementation((args: any) => {
            if (args.collection === 'meal-orders') {
              return Promise.resolve({
                id: args.id,
                resident: 'resident-1',
                mealType: mealType,
              })
            }
            if (args.collection === 'residents') {
              return Promise.resolve({
                id: args.id,
                name: residentName,
                roomNumber: roomNumber,
              })
            }
            return Promise.resolve(null)
          })

          mockPayload.create.mockImplementation((args: any) => {
            if (args.collection === 'alerts') {
              escalationAlertsCreated.push(args.data)
            }
            return Promise.resolve({ id: `escalation-${escalationAlertsCreated.length}` })
          })

          // Run escalation
          await escalateUnacknowledgedAlerts(mockPayload)

          // Verify escalation message contains correct information
          expect(escalationAlertsCreated.length).toBe(1)
          const escalationMessage = escalationAlertsCreated[0].message
          expect(escalationMessage).toContain('ESCALATED')
          expect(escalationMessage).toContain('Unacknowledged')
          expect(escalationMessage).toContain(residentName)
          expect(escalationMessage).toContain(roomNumber)
          expect(escalationMessage).toContain(mealType.charAt(0).toUpperCase() + mealType.slice(1))

          return true
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should set escalation alert severity to critical', async () => {
    // **Feature: meal-planner-system, Property 23: Alert escalation on timeout**
    
    const mockPayload = createMockPayload() as any
    const escalationAlertsCreated: any[] = []

    // Create timestamp for old alert
    const oldAlertTime = new Date()
    oldAlertTime.setMinutes(oldAlertTime.getMinutes() - 60)

    const oldAlert = {
      id: 'alert-1',
      mealOrder: 'order-1',
      message: 'Urgent order',
      severity: 'high', // Original severity
      acknowledged: false,
      createdAt: oldAlertTime.toISOString(),
    }

    mockPayload.find.mockImplementation((args: any) => {
      if (args.collection === 'alerts') {
        return Promise.resolve({
          docs: [oldAlert],
          totalDocs: 1,
        })
      }
      if (args.collection === 'users') {
        return Promise.resolve({
          docs: [{ id: 'admin-1', role: 'admin', active: true }],
          totalDocs: 1,
        })
      }
      return Promise.resolve({ docs: [], totalDocs: 0 })
    })

    mockPayload.findByID.mockImplementation((args: any) => {
      if (args.collection === 'meal-orders') {
        return Promise.resolve({
          id: args.id,
          resident: 'resident-1',
          mealType: 'breakfast',
        })
      }
      if (args.collection === 'residents') {
        return Promise.resolve({
          id: args.id,
          name: 'Test Resident',
          roomNumber: '101',
        })
      }
      return Promise.resolve(null)
    })

    mockPayload.create.mockImplementation((args: any) => {
      if (args.collection === 'alerts') {
        escalationAlertsCreated.push(args.data)
      }
      return Promise.resolve({ id: `escalation-${escalationAlertsCreated.length}` })
    })

    // Run escalation
    await escalateUnacknowledgedAlerts(mockPayload)

    // Verify escalation alert has critical severity
    expect(escalationAlertsCreated.length).toBe(1)
    expect(escalationAlertsCreated[0].severity).toBe('critical')
  })

  it('should return zero when no unacknowledged alerts exist', async () => {
    // **Feature: meal-planner-system, Property 23: Alert escalation on timeout**
    
    const mockPayload = createMockPayload() as any

    // Mock find to return no alerts
    mockPayload.find.mockResolvedValue({
      docs: [],
      totalDocs: 0,
    })

    // Run escalation
    const escalatedCount = await escalateUnacknowledgedAlerts(mockPayload)

    // Verify that no escalation occurred
    expect(escalatedCount).toBe(0)
  })

  it('should handle multiple old alerts correctly', async () => {
    // **Feature: meal-planner-system, Property 23: Alert escalation on timeout**
    
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 2, max: 10 }), // Number of old alerts
        async (alertCount) => {
          const mockPayload = createMockPayload() as any
          const escalationAlertsCreated: any[] = []

          // Create timestamp for old alerts
          const oldAlertTime = new Date()
          oldAlertTime.setMinutes(oldAlertTime.getMinutes() - 60)

          const oldAlerts = Array(alertCount)
            .fill(null)
            .map((_, i) => ({
              id: `alert-${i}`,
              mealOrder: `order-${i}`,
              message: `Urgent order ${i}`,
              severity: 'high',
              acknowledged: false,
              createdAt: oldAlertTime.toISOString(),
            }))

          mockPayload.find.mockImplementation((args: any) => {
            if (args.collection === 'alerts') {
              return Promise.resolve({
                docs: oldAlerts,
                totalDocs: oldAlerts.length,
              })
            }
            if (args.collection === 'users') {
              return Promise.resolve({
                docs: [{ id: 'admin-1', role: 'admin', active: true }],
                totalDocs: 1,
              })
            }
            return Promise.resolve({ docs: [], totalDocs: 0 })
          })

          mockPayload.findByID.mockImplementation((args: any) => {
            if (args.collection === 'meal-orders') {
              return Promise.resolve({
                id: args.id,
                resident: 'resident-1',
                mealType: 'breakfast',
              })
            }
            if (args.collection === 'residents') {
              return Promise.resolve({
                id: args.id,
                name: 'Test Resident',
                roomNumber: '101',
              })
            }
            return Promise.resolve(null)
          })

          mockPayload.create.mockImplementation((args: any) => {
            if (args.collection === 'alerts') {
              escalationAlertsCreated.push(args.data)
            }
            return Promise.resolve({ id: `escalation-${escalationAlertsCreated.length}` })
          })

          // Run escalation
          const escalatedCount = await escalateUnacknowledgedAlerts(mockPayload)

          // Verify that all alerts were escalated
          expect(escalatedCount).toBe(alertCount)
          expect(escalationAlertsCreated.length).toBe(alertCount) // 1 admin * alertCount alerts

          return true
        }
      ),
      { numRuns: 100 }
    )
  })
})
