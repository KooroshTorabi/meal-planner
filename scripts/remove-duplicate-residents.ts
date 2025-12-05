/**
 * Remove duplicate residents based on room number
 * Keeps the most recently created resident for each room number
 * Run with: npx tsx scripts/remove-duplicate-residents.ts
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

async function removeDuplicateResidents() {
  try {
    console.log('Loading Payload configuration...')
    const { getPayload } = await import('payload')
    const config = await import('../payload.config')
    
    console.log('Initializing Payload...')
    const payload = await getPayload({ config: config.default })
    
    console.log('Fetching all residents...')
    const residentsResult = await payload.find({
      collection: 'residents',
      limit: 1000,
      sort: 'createdAt',
    })
    
    const residents = residentsResult.docs
    console.log(`Found ${residents.length} residents`)
    
    // Group residents by room number
    const roomMap = new Map<string, any[]>()
    
    for (const resident of residents) {
      const roomNumber = resident.roomNumber
      if (!roomMap.has(roomNumber)) {
        roomMap.set(roomNumber, [])
      }
      roomMap.get(roomNumber)!.push(resident)
    }
    
    // Find duplicates
    let duplicatesRemoved = 0
    
    for (const [roomNumber, residentsInRoom] of roomMap.entries()) {
      if (residentsInRoom.length > 1) {
        console.log(`\nFound ${residentsInRoom.length} residents in room ${roomNumber}:`)
        
        // Sort by createdAt (most recent first)
        residentsInRoom.sort((a, b) => {
          const dateA = new Date(a.createdAt).getTime()
          const dateB = new Date(b.createdAt).getTime()
          return dateB - dateA
        })
        
        // Keep the most recent one, delete the rest
        const [keepResident, ...deleteResidents] = residentsInRoom
        
        console.log(`  ✓ Keeping: ${keepResident.name} (ID: ${keepResident.id}, Created: ${keepResident.createdAt})`)
        
        for (const resident of deleteResidents) {
          console.log(`  ✗ Deleting: ${resident.name} (ID: ${resident.id}, Created: ${resident.createdAt})`)
          
          try {
            // First, reassign any meal orders from this resident to the one we're keeping
            const mealOrdersResult = await payload.find({
              collection: 'meal-orders',
              where: {
                resident: {
                  equals: resident.id,
                },
              },
              limit: 1000,
            })
            
            if (mealOrdersResult.docs.length > 0) {
              console.log(`    Reassigning ${mealOrdersResult.docs.length} meal orders to kept resident...`)
              
              for (const order of mealOrdersResult.docs) {
                await payload.update({
                  collection: 'meal-orders',
                  id: order.id,
                  data: {
                    resident: keepResident.id,
                  },
                })
              }
            }
            
            // Now delete the duplicate resident
            await payload.delete({
              collection: 'residents',
              id: resident.id,
            })
            duplicatesRemoved++
          } catch (error: any) {
            console.error(`    Failed to delete: ${error.message}`)
          }
        }
      }
    }
    
    console.log(`\n✅ Removed ${duplicatesRemoved} duplicate residents`)
    console.log(`✅ ${roomMap.size} unique rooms remain`)
    
    process.exit(0)
  } catch (error) {
    console.error('❌ Failed to remove duplicates:', error)
    process.exit(1)
  }
}

removeDuplicateResidents()
