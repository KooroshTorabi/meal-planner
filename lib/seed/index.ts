import type { Payload } from 'payload'
import bcrypt from 'bcrypt'

/**
 * Seed database with initial data for testing and development
 * Implements idempotency check to prevent duplicate seeding
 */
export async function seedDatabase(payload: Payload): Promise<void> {
  console.log('Starting database seeding...')

  try {
    // Check if database has already been seeded
    const existingUsers = await payload.find({
      collection: 'users',
      limit: 1,
    })

    if (existingUsers.totalDocs > 0) {
      console.log('Database already seeded. Skipping seed process.')
      return
    }

    // Seed users
    await seedUsers(payload)

    // Seed residents
    await seedResidents(payload)

    // Seed meal orders
    await seedMealOrders(payload)

    console.log('Database seeding completed successfully!')
  } catch (error) {
    console.error('Error seeding database:', error)
    throw error
  }
}

/**
 * Create three user accounts with specified credentials
 */
async function seedUsers(payload: Payload): Promise<void> {
  console.log('Seeding users...')

  const users = [
    {
      email: 'admin@mealplanner.com',
      password: 'Admin123!',
      role: 'admin',
      name: 'System Administrator',
      active: true,
      twoFactorEnabled: false,
    },
    {
      email: 'caregiver@mealplanner.com',
      password: 'Caregiver123!',
      role: 'caregiver',
      name: 'Jane Caregiver',
      active: true,
      twoFactorEnabled: false,
    },
    {
      email: 'kitchen@mealplanner.com',
      password: 'Kitchen123!',
      role: 'kitchen',
      name: 'John Kitchen',
      active: true,
      twoFactorEnabled: false,
    },
  ]

  for (const user of users) {
    const hashedPassword = await bcrypt.hash(user.password, 12)
    await payload.create({
      collection: 'users',
      data: {
        ...user,
        password: hashedPassword,
      },
    })
    console.log(`Created user: ${user.email}`)
  }
}

/**
 * Generate 10+ sample residents with varied dietary restrictions
 */
async function seedResidents(payload: Payload): Promise<void> {
  console.log('Seeding residents...')

  const residents = [
    {
      name: 'Maria Schmidt',
      roomNumber: '101',
      tableNumber: '1',
      station: 'A',
      dietaryRestrictions: [
        { restriction: 'lactose-free' },
        { restriction: 'low-sodium' },
      ],
      aversions: 'Dislikes fish',
      specialNotes: 'Prefers small portions',
      highCalorie: false,
      active: true,
    },
    {
      name: 'Hans Müller',
      roomNumber: '102',
      tableNumber: '1',
      station: 'A',
      dietaryRestrictions: [
        { restriction: 'diabetic' },
        { restriction: 'gluten-free' },
      ],
      aversions: 'No pork',
      specialNotes: 'Needs pureed food',
      highCalorie: false,
      active: true,
    },
    {
      name: 'Greta Weber',
      roomNumber: '103',
      tableNumber: '2',
      station: 'A',
      dietaryRestrictions: [{ restriction: 'vegetarian' }],
      aversions: '',
      specialNotes: 'Loves desserts',
      highCalorie: true,
      active: true,
    },
    {
      name: 'Friedrich Bauer',
      roomNumber: '104',
      tableNumber: '2',
      station: 'A',
      dietaryRestrictions: [
        { restriction: 'low-fat' },
        { restriction: 'no-fish' },
      ],
      aversions: 'Dislikes onions',
      specialNotes: '',
      highCalorie: false,
      active: true,
    },
    {
      name: 'Anna Schneider',
      roomNumber: '201',
      tableNumber: '3',
      station: 'B',
      dietaryRestrictions: [{ restriction: 'pureed-food' }],
      aversions: 'No spicy food',
      specialNotes: 'Requires assistance with eating',
      highCalorie: true,
      active: true,
    },
    {
      name: 'Klaus Fischer',
      roomNumber: '202',
      tableNumber: '3',
      station: 'B',
      dietaryRestrictions: [
        { restriction: 'low-sodium' },
        { restriction: 'diabetic' },
      ],
      aversions: '',
      specialNotes: 'Prefers tea over coffee',
      highCalorie: false,
      active: true,
    },
    {
      name: 'Helga Wagner',
      roomNumber: '203',
      tableNumber: '4',
      station: 'B',
      dietaryRestrictions: [
        { restriction: 'lactose-free' },
        { restriction: 'vegetarian' },
      ],
      aversions: 'No mushrooms',
      specialNotes: '',
      highCalorie: false,
      active: true,
    },
    {
      name: 'Otto Becker',
      roomNumber: '204',
      tableNumber: '4',
      station: 'B',
      dietaryRestrictions: [
        { restriction: 'gluten-free' },
        { restriction: 'no-fish' },
      ],
      aversions: 'Dislikes eggs',
      specialNotes: 'Large portions preferred',
      highCalorie: false,
      active: true,
    },
    {
      name: 'Ingrid Hoffmann',
      roomNumber: '301',
      tableNumber: '5',
      station: 'C',
      dietaryRestrictions: [
        { restriction: 'pureed-food' },
        { restriction: 'high-calorie' },
      ],
      aversions: '',
      specialNotes: 'Needs encouragement to eat',
      highCalorie: true,
      active: true,
    },
    {
      name: 'Wilhelm Schulz',
      roomNumber: '302',
      tableNumber: '5',
      station: 'C',
      dietaryRestrictions: [
        { restriction: 'diabetic' },
        { restriction: 'low-fat' },
      ],
      aversions: 'No red meat',
      specialNotes: '',
      highCalorie: false,
      active: true,
    },
    {
      name: 'Elisabeth Koch',
      roomNumber: '303',
      tableNumber: '6',
      station: 'C',
      dietaryRestrictions: [
        { restriction: 'vegetarian' },
        { restriction: 'lactose-free' },
      ],
      aversions: 'Dislikes tomatoes',
      specialNotes: 'Prefers whole grain bread',
      highCalorie: false,
      active: true,
    },
    {
      name: 'Hermann Richter',
      roomNumber: '304',
      tableNumber: '6',
      station: 'C',
      dietaryRestrictions: [],
      aversions: '',
      specialNotes: 'No special requirements',
      highCalorie: false,
      active: true,
    },
  ]

  for (const resident of residents) {
    await payload.create({
      collection: 'residents',
      data: resident,
    })
    console.log(`Created resident: ${resident.name}`)
  }
}

/**
 * Generate 20+ sample meal orders across all meal types and dates
 * Include mix of pending and prepared orders
 */
async function seedMealOrders(payload: Payload): Promise<void> {
  console.log('Seeding meal orders...')

  // Get all residents and users for references
  const residentsResult = await payload.find({
    collection: 'residents',
    limit: 100,
  })
  const residents = residentsResult.docs

  const usersResult = await payload.find({
    collection: 'users',
    where: {
      role: {
        equals: 'caregiver',
      },
    },
    limit: 1,
  })
  const caregiver = usersResult.docs[0]

  const kitchenResult = await payload.find({
    collection: 'users',
    where: {
      role: {
        equals: 'kitchen',
      },
    },
    limit: 1,
  })
  const kitchenUser = kitchenResult.docs[0]

  if (!caregiver || !kitchenUser) {
    console.error('Required users not found for seeding meal orders')
    return
  }

  // Generate dates for the next 3 days
  const today = new Date()
  const dates = [
    new Date(today),
    new Date(today.getTime() + 24 * 60 * 60 * 1000),
    new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000),
  ]

  const mealTypes: Array<'breakfast' | 'lunch' | 'dinner'> = ['breakfast', 'lunch', 'dinner']
  const statuses: Array<'pending' | 'prepared'> = ['pending', 'prepared']

  let orderCount = 0

  // Create meal orders for first 8 residents across different dates and meal types
  for (let i = 0; i < Math.min(8, residents.length); i++) {
    const resident = residents[i]
    
    for (const date of dates) {
      for (const mealType of mealTypes) {
        // Create about 24 orders (8 residents × 3 meal types, varying dates)
        if (orderCount >= 24) break

        const status = statuses[Math.floor(Math.random() * statuses.length)]
        const urgent = Math.random() < 0.2 // 20% chance of urgent

        const orderData: any = {
          resident: resident.id,
          date: date.toISOString().split('T')[0],
          mealType,
          status,
          urgent,
          createdBy: caregiver.id,
          updatedBy: caregiver.id,
        }

        // Add meal-specific options
        if (mealType === 'breakfast') {
          orderData.breakfastOptions = {
            followsPlan: Math.random() < 0.7,
            breadItems: [
              { item: 'brötchen' },
              { item: 'vollkornbrötchen' },
            ],
            breadPreparation: [{ prep: 'geschnitten' }],
            spreads: [
              { spread: 'butter' },
              { spread: 'konfitüre' },
            ],
            porridge: Math.random() < 0.3,
            beverages: [
              { beverage: 'kaffee' },
              { beverage: 'milch heiß' },
            ],
            additions: [{ addition: 'zucker' }],
          }
        } else if (mealType === 'lunch') {
          orderData.lunchOptions = {
            portionSize: ['small', 'large', 'vegetarian'][Math.floor(Math.random() * 3)],
            soup: Math.random() < 0.6,
            dessert: Math.random() < 0.7,
            specialPreparations: [],
            restrictions: [],
          }
        } else if (mealType === 'dinner') {
          orderData.dinnerOptions = {
            followsPlan: Math.random() < 0.7,
            breadItems: [
              { item: 'graubrot' },
              { item: 'vollkornbrot' },
            ],
            breadPreparation: [{ prep: 'geschmiert' }],
            spreads: [
              { spread: 'butter' },
              { spread: 'margarine' },
            ],
            soup: Math.random() < 0.4,
            porridge: Math.random() < 0.2,
            noFish: Math.random() < 0.3,
            beverages: [{ beverage: 'tee' }],
            additions: [{ addition: 'zucker' }],
          }
        }

        // Add prepared metadata if status is prepared
        if (status === 'prepared') {
          orderData.preparedBy = kitchenUser.id
          orderData.preparedAt = new Date(date.getTime() - Math.random() * 3600000).toISOString()
        }

        await payload.create({
          collection: 'meal-orders',
          data: orderData,
        })

        orderCount++
        console.log(`Created meal order ${orderCount}: ${resident.name} - ${mealType} - ${date.toISOString().split('T')[0]}`)
      }
    }
  }

  console.log(`Created ${orderCount} meal orders`)
}
