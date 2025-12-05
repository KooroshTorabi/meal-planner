/**
 * Seed sample data (residents and meal orders) without users
 * Run after users are already created
 * Run with: npm run seed:data
 */

import { readFileSync } from 'fs'
import { resolve } from 'path'

// Load environment variables
try {
  const envPath = resolve(process.cwd(), '.env')
  const envContent = readFileSync(envPath, 'utf-8')
  
  envContent.split('\n').forEach(line => {
    const trimmedLine = line.trim()
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const [key, ...valueParts] = trimmedLine.split('=')
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim()
        process.env[key.trim()] = value
      }
    }
  })
  
  console.log('Environment variables loaded from .env')
} catch (error) {
  console.warn('Could not load .env file:', error)
}

// Set flag to skip versioning during seed
process.env.SEED_DATABASE = 'true'

async function seedSampleData() {
  try {
    console.log('Loading Payload configuration...')
    const { getPayload } = await import('payload')
    const config = await import('../payload.config')
    
    console.log('Initializing Payload...')
    const payload = await getPayload({ config: config.default })
    
    console.log('Seeding residents...')
    await seedResidents(payload)
    
    console.log('Seeding meal orders...')
    await seedMealOrders(payload)
    
    console.log('\n✅ Sample data seeding completed!')
    process.exit(0)
  } catch (error) {
    console.error('❌ Seed failed:', error)
    process.exit(1)
  }
}

async function seedResidents(payload: any) {
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
    try {
      // Check if resident with this room number already exists
      const existingResident = await payload.find({
        collection: 'residents',
        where: {
          roomNumber: {
            equals: resident.roomNumber,
          },
        },
        limit: 1,
      })

      if (existingResident.docs.length > 0) {
        console.log(`⚠️  Resident already exists in room ${resident.roomNumber}: ${resident.name}`)
        continue
      }

      await payload.create({
        collection: 'residents',
        data: resident,
      })
      console.log(`✅ Created resident: ${resident.name}`)
    } catch (error: any) {
      if (error.message?.includes('duplicate') || error.message?.includes('unique')) {
        console.log(`⚠️  Resident already exists: ${resident.name}`)
      } else {
        console.error(`❌ Failed to create resident ${resident.name}:`, error.message)
      }
    }
  }
}

async function seedMealOrders(payload: any) {
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

  if (!caregiver) {
    console.error('Caregiver user not found. Please run seed:users first.')
    return
  }

  // Generate dates for today and tomorrow
  const today = new Date()
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000)
  const dates = [today, tomorrow]

  const mealTypes: Array<'breakfast' | 'lunch' | 'dinner'> = ['breakfast', 'lunch', 'dinner']

  let orderCount = 0

  // Create meal orders for first 6 residents
  for (let i = 0; i < Math.min(6, residents.length); i++) {
    const resident = residents[i]
    
    for (const date of dates) {
      for (const mealType of mealTypes) {
        if (orderCount >= 18) break // Limit to 18 orders

        const orderData: any = {
          resident: resident.id,
          date: date.toISOString().split('T')[0],
          mealType,
          status: 'pending',
          urgent: false,
          createdBy: caregiver.id,
          updatedBy: caregiver.id,
        }

        // Add meal-specific options
        if (mealType === 'breakfast') {
          orderData.breakfastOptions = {
            followsPlan: true,
            breadItems: ['brötchen'],
            breadPreparation: ['geschnitten'],
            spreads: ['butter', 'konfitüre'],
            porridge: false,
            beverages: ['kaffee'],
            additions: [],
          }
        } else if (mealType === 'lunch') {
          orderData.lunchOptions = {
            portionSize: 'large',
            soup: true,
            dessert: true,
            specialPreparations: [],
            restrictions: [],
          }
        } else if (mealType === 'dinner') {
          orderData.dinnerOptions = {
            followsPlan: true,
            breadItems: ['graubrot'],
            breadPreparation: ['geschmiert'],
            spreads: ['butter'],
            soup: false,
            porridge: false,
            noFish: false,
            beverages: ['tee'],
            additions: [],
          }
        }

        try {
          await payload.create({
            collection: 'meal-orders',
            data: orderData,
          })
          orderCount++
          console.log(`✅ Created meal order ${orderCount}: ${resident.name} - ${mealType} - ${date.toISOString().split('T')[0]}`)
        } catch (error: any) {
          console.error(`❌ Failed to create meal order:`, error.message)
        }
      }
    }
  }

  console.log(`\n✅ Created ${orderCount} meal orders`)
}

seedSampleData()
