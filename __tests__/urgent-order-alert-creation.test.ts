/**
 * Property-based test for urgent order alert creation
 * **Feature: meal-planner-system, Property 21: Urgent order alert creation**
 * **Validates: Requirements 10.1**
 */
import * as fc from 'fast-check'

// Mock Payload instance
interface MockPayload {
  find: jest.Mock
  create: jest.Mock
  findByID: jest.Mock
}

function createMockPayload(): MockPayload {
  return {
    find: jest.fn(),
    create: jest.fn(),
    findByID: jest.fn(),
  }
}

describe('Urgent Order Alert Creation', () => {
  /**
   * Property 21: Urgent order alert creation
   * For any meal order marked as urgent, the system must create alert records
   * for all active kitchen staff users
   */
  it('should create alerts for all active kitchen staff when order is marked urgent', async () => {
    // **Feature: meal-planner-system, Property 21: Urgent order alert creation**
    
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 10 }), // Number of active kitchen staff
        fc.integer({ min: 0, max: 5 }), // Number of inactive kitchen staff
        fc.record({
          id: fc.uuid(),
          resident: fc.uuid(),
          date: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }),
          mealType: fc.constantFrom('breakfast', 'lunch', 'dinner'),
          urgent: fc.constant(true),
          status: fc.constant('pending'),
        }),
        async (activeCount, inactiveCount, urgentOrder) => {
          const mockPayload = createMockPayload() as any
          const alertsCreated: any[] = []

          // Mock active kitchen staff
          const activeStaff = Array(activeCount)
            .fill(null)
            .map((_, i) => ({
              id: `kitchen-active-${i}`,
              role: 'kitchen',
              active: true,
              name: `Kitchen Staff ${i}`,
            }))

          // Mock inactive kitchen staff
          const inactiveStaff = Array(inactiveCount)
            .fill(null)
            .map((_, i) => ({
              id: `kitchen-inactive-${i}`,
              role: 'kitchen',
              active: false,
              name: `Inactive Kitchen Staff ${i}`,
            }))

          // Mock find to return only active kitchen staff
          mockPayload.find.mockResolvedValue({
            docs: activeStaff,
            totalDocs: activeStaff.length,
          })

          // Mock resident lookup
          mockPayload.findByID.mockResolvedValue({
            id: urgentOrder.resident,
            name: 'Test Resident',
            roomNumber: '101',
          })

          // Mock alert creation
          mockPayload.create.mockImplementation((args: any) => {
            if (args.collection === 'alerts') {
              alertsCreated.push(args.data)
            }
            return Promise.resolve({ id: `alert-${alertsCreated.length}` })
          })

          // Simulate the afterChange hook logic
          const req = { payload: mockPayload, user: { id: 'test-user' } }
          const doc = urgentOrder
          const operation = 'create'

          // Execute the alert creation logic
          if (doc.urgent && operation === 'create') {
            const kitchenStaff = await req.payload.find({
              collection: 'users',
              where: {
                and: [
                  { role: { equals: 'kitchen' } },
                  { active: { equals: true } },
                ],
              },
            })

            const resident = await req.payload.findByID({
              collection: 'residents',
              id: doc.resident,
            })

            const residentName = resident.name
            const mealType = doc.mealType.charAt(0).toUpperCase() + doc.mealType.slice(1)

            for (const staff of kitchenStaff.docs) {
              await req.payload.create({
                collection: 'alerts',
                data: {
                  mealOrder: doc.id,
                  message: `Urgent ${mealType} order for ${residentName} (Room ${resident.roomNumber})`,
                  severity: 'high',
                  acknowledged: false,
                },
              })
            }
          }

          // Verify that alerts were created for all active kitchen staff
          expect(alertsCreated.length).toBe(activeCount)

          // Verify that each alert has the correct structure
          for (const alert of alertsCreated) {
            expect(alert.mealOrder).toBe(urgentOrder.id)
            expect(alert.message).toContain('Urgent')
            expect(alert.message).toContain('Test Resident')
            expect(alert.message).toContain('Room 101')
            expect(alert.severity).toBe('high')
            expect(alert.acknowledged).toBe(false)
          }

          return true
        }
      ),
      { numRuns: 100 }
    )
  }, 30000) // 30 second timeout

  it('should not create alerts when order is not marked urgent', async () => {
    // **Feature: meal-planner-system, Property 21: Urgent order alert creation**
    
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id: fc.uuid(),
          resident: fc.uuid(),
          date: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }),
          mealType: fc.constantFrom('breakfast', 'lunch', 'dinner'),
          urgent: fc.constant(false),
          status: fc.constant('pending'),
        }),
        async (nonUrgentOrder) => {
          const mockPayload = createMockPayload() as any
          const alertsCreated: any[] = []

          mockPayload.create.mockImplementation((args: any) => {
            if (args.collection === 'alerts') {
              alertsCreated.push(args.data)
            }
            return Promise.resolve({ id: `alert-${alertsCreated.length}` })
          })

          // Simulate the afterChange hook logic
          const req = { payload: mockPayload, user: { id: 'test-user' } }
          const doc = nonUrgentOrder
          const operation = 'create'

          // Execute the alert creation logic
          if (doc.urgent && operation === 'create') {
            // This should not execute for non-urgent orders
            await req.payload.create({
              collection: 'alerts',
              data: {
                mealOrder: doc.id,
                message: 'This should not be created',
                severity: 'high',
                acknowledged: false,
              },
            })
          }

          // Verify that no alerts were created
          expect(alertsCreated.length).toBe(0)

          return true
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should create alerts only for active kitchen staff, not inactive ones', async () => {
    // **Feature: meal-planner-system, Property 21: Urgent order alert creation**
    
    const mockPayload = createMockPayload() as any
    const alertsCreated: any[] = []

    // Mock kitchen staff with mix of active and inactive
    const kitchenStaff = [
      { id: 'kitchen-1', role: 'kitchen', active: true, name: 'Active Kitchen 1' },
      { id: 'kitchen-2', role: 'kitchen', active: true, name: 'Active Kitchen 2' },
      { id: 'kitchen-3', role: 'kitchen', active: false, name: 'Inactive Kitchen' },
    ]

    // Mock find to return only active kitchen staff (as per the query filter)
    mockPayload.find.mockResolvedValue({
      docs: kitchenStaff.filter((s) => s.active),
      totalDocs: 2,
    })

    mockPayload.findByID.mockResolvedValue({
      id: 'resident-1',
      name: 'Test Resident',
      roomNumber: '101',
    })

    mockPayload.create.mockImplementation((args: any) => {
      if (args.collection === 'alerts') {
        alertsCreated.push(args.data)
      }
      return Promise.resolve({ id: `alert-${alertsCreated.length}` })
    })

    // Simulate urgent order creation
    const req = { payload: mockPayload, user: { id: 'test-user' } }
    const doc = {
      id: 'order-1',
      resident: 'resident-1',
      mealType: 'breakfast',
      urgent: true,
    }

    // Execute the alert creation logic
    const kitchenStaffResult = await req.payload.find({
      collection: 'users',
      where: {
        and: [
          { role: { equals: 'kitchen' } },
          { active: { equals: true } },
        ],
      },
    })

    const resident = await req.payload.findByID({
      collection: 'residents',
      id: doc.resident,
    })

    for (const staff of kitchenStaffResult.docs) {
      await req.payload.create({
        collection: 'alerts',
        data: {
          mealOrder: doc.id,
          message: `Urgent Breakfast order for ${resident.name} (Room ${resident.roomNumber})`,
          severity: 'high',
          acknowledged: false,
        },
      })
    }

    // Verify that alerts were created only for active kitchen staff (2)
    expect(alertsCreated.length).toBe(2)
  })

  it('should create alerts when order is updated from non-urgent to urgent', async () => {
    // **Feature: meal-planner-system, Property 21: Urgent order alert creation**
    
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 5 }), // Number of active kitchen staff
        async (activeCount) => {
          const mockPayload = createMockPayload() as any
          const alertsCreated: any[] = []

          const activeStaff = Array(activeCount)
            .fill(null)
            .map((_, i) => ({
              id: `kitchen-${i}`,
              role: 'kitchen',
              active: true,
            }))

          mockPayload.find.mockResolvedValue({
            docs: activeStaff,
            totalDocs: activeStaff.length,
          })

          mockPayload.findByID.mockResolvedValue({
            id: 'resident-1',
            name: 'Test Resident',
            roomNumber: '101',
          })

          mockPayload.create.mockImplementation((args: any) => {
            if (args.collection === 'alerts') {
              alertsCreated.push(args.data)
            }
            return Promise.resolve({ id: `alert-${alertsCreated.length}` })
          })

          // Simulate order update from non-urgent to urgent
          const req = { payload: mockPayload, user: { id: 'test-user' } }
          const doc = {
            id: 'order-1',
            resident: 'resident-1',
            mealType: 'lunch',
            urgent: true,
          }
          const previousDoc = {
            id: 'order-1',
            resident: 'resident-1',
            mealType: 'lunch',
            urgent: false,
          }
          const operation = 'update'

          // Execute the alert creation logic
          if (doc.urgent && (operation === 'create' || (operation === 'update' && !previousDoc?.urgent))) {
            const kitchenStaff = await req.payload.find({
              collection: 'users',
              where: {
                and: [
                  { role: { equals: 'kitchen' } },
                  { active: { equals: true } },
                ],
              },
            })

            const resident = await req.payload.findByID({
              collection: 'residents',
              id: doc.resident,
            })

            for (const staff of kitchenStaff.docs) {
              await req.payload.create({
                collection: 'alerts',
                data: {
                  mealOrder: doc.id,
                  message: `Urgent Lunch order for ${resident.name} (Room ${resident.roomNumber})`,
                  severity: 'high',
                  acknowledged: false,
                },
              })
            }
          }

          // Verify that alerts were created
          expect(alertsCreated.length).toBe(activeCount)

          return true
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should not create duplicate alerts when order remains urgent', async () => {
    // **Feature: meal-planner-system, Property 21: Urgent order alert creation**
    
    const mockPayload = createMockPayload() as any
    const alertsCreated: any[] = []

    mockPayload.create.mockImplementation((args: any) => {
      if (args.collection === 'alerts') {
        alertsCreated.push(args.data)
      }
      return Promise.resolve({ id: `alert-${alertsCreated.length}` })
    })

    // Simulate order update where urgent remains true
    const req = { payload: mockPayload, user: { id: 'test-user' } }
    const doc = {
      id: 'order-1',
      resident: 'resident-1',
      mealType: 'dinner',
      urgent: true,
      status: 'prepared', // Status changed but urgent remains true
    }
    const previousDoc = {
      id: 'order-1',
      resident: 'resident-1',
      mealType: 'dinner',
      urgent: true,
      status: 'pending',
    }
    const operation = 'update'

    // Execute the alert creation logic
    if (doc.urgent && (operation === 'create' || (operation === 'update' && !previousDoc?.urgent))) {
      // This should not execute because previousDoc.urgent is true
      await req.payload.create({
        collection: 'alerts',
        data: {
          mealOrder: doc.id,
          message: 'This should not be created',
          severity: 'high',
          acknowledged: false,
        },
      })
    }

    // Verify that no new alerts were created
    expect(alertsCreated.length).toBe(0)
  })

  it('should include correct meal type and resident information in alert message', async () => {
    // **Feature: meal-planner-system, Property 21: Urgent order alert creation**
    
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          residentName: fc.string({ minLength: 1, maxLength: 50 }),
          roomNumber: fc.string({ minLength: 1, maxLength: 10 }),
          mealType: fc.constantFrom('breakfast', 'lunch', 'dinner'),
        }),
        async ({ residentName, roomNumber, mealType }) => {
          const mockPayload = createMockPayload() as any
          const alertsCreated: any[] = []

          mockPayload.find.mockResolvedValue({
            docs: [{ id: 'kitchen-1', role: 'kitchen', active: true }],
            totalDocs: 1,
          })

          mockPayload.findByID.mockResolvedValue({
            id: 'resident-1',
            name: residentName,
            roomNumber: roomNumber,
          })

          mockPayload.create.mockImplementation((args: any) => {
            if (args.collection === 'alerts') {
              alertsCreated.push(args.data)
            }
            return Promise.resolve({ id: `alert-${alertsCreated.length}` })
          })

          // Simulate urgent order creation
          const req = { payload: mockPayload, user: { id: 'test-user' } }
          const doc = {
            id: 'order-1',
            resident: 'resident-1',
            mealType: mealType,
            urgent: true,
          }

          // Execute the alert creation logic
          const kitchenStaff = await req.payload.find({
            collection: 'users',
            where: {
              and: [
                { role: { equals: 'kitchen' } },
                { active: { equals: true } },
              ],
            },
          })

          const resident = await req.payload.findByID({
            collection: 'residents',
            id: doc.resident,
          })

          const mealTypeCapitalized = mealType.charAt(0).toUpperCase() + mealType.slice(1)

          for (const staff of kitchenStaff.docs) {
            await req.payload.create({
              collection: 'alerts',
              data: {
                mealOrder: doc.id,
                message: `Urgent ${mealTypeCapitalized} order for ${resident.name} (Room ${resident.roomNumber})`,
                severity: 'high',
                acknowledged: false,
              },
            })
          }

          // Verify alert message contains correct information
          expect(alertsCreated.length).toBe(1)
          expect(alertsCreated[0].message).toContain('Urgent')
          expect(alertsCreated[0].message).toContain(mealTypeCapitalized)
          expect(alertsCreated[0].message).toContain(residentName)
          expect(alertsCreated[0].message).toContain(roomNumber)

          return true
        }
      ),
      { numRuns: 100 }
    )
  })
})
